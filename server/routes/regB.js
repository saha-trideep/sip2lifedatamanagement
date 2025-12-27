const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');
const {
    calculateAllRegBTotals,
    validateRegBBalance,
    autoFillFromRegA,
    validateRegBEntry
} = require('../utils/regBCalculations');

// GET all Reg-B entries
router.get('/', verifyToken, async (req, res) => {
    try {
        const { startDate, endDate, batchId, page = 1, limit = 50 } = req.query;

        const where = {};

        // Date range filter
        if (startDate && endDate) {
            where.entryDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        // Batch filter
        if (batchId) {
            where.batchId = parseInt(batchId);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [entries, total] = await Promise.all([
            prisma.regBEntry.findMany({
                where,
                include: {
                    batch: {
                        include: { brand: true }
                    },
                    user: {
                        select: { name: true, email: true }
                    }
                },
                orderBy: { entryDate: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.regBEntry.count({ where })
        ]);

        res.json({
            entries,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// GET single Reg-B entry by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await prisma.regBEntry.findUnique({
            where: { id: parseInt(id) },
            include: {
                batch: {
                    include: { brand: true }
                },
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new Reg-B entry
router.post('/', verifyToken, async (req, res) => {
    try {
        const data = req.body;

        // Validate entry
        const validation = validateRegBEntry(data);
        if (!validation.isValid) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.errors
            });
        }

        // Calculate all totals
        const totals = calculateAllRegBTotals(data);

        // Validate balance
        const balanceCheck = validateRegBBalance(totals);
        if (!balanceCheck.isBalanced) {
            return res.status(400).json({
                error: 'Balance validation failed',
                details: {
                    message: `Opening + Receipt (${balanceCheck.leftSide} BL) ≠ Issue + Wastage + Closing (${balanceCheck.rightSide} BL)`,
                    difference: balanceCheck.difference
                }
            });
        }

        // Create entry
        const entry = await prisma.regBEntry.create({
            data: {
                ...data,
                ...totals,
                createdBy: req.user.id
            },
            include: {
                batch: {
                    include: { brand: true }
                }
            }
        });

        // Log audit
        await logAudit({
            userId: req.user.id,
            action: 'REGB_CREATE',
            entityType: 'REGB',
            entityId: entry.id.toString(),
            metadata: { entry, totals, balanceCheck }
        });

        res.status(201).json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update Reg-B entry
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Check if entry exists
        const existing = await prisma.regBEntry.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Validate entry
        const validation = validateRegBEntry(data);
        if (!validation.isValid) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.errors
            });
        }

        // Calculate all totals
        const totals = calculateAllRegBTotals(data);

        // Validate balance
        const balanceCheck = validateRegBBalance(totals);
        if (!balanceCheck.isBalanced) {
            return res.status(400).json({
                error: 'Balance validation failed',
                details: {
                    message: `Opening + Receipt (${balanceCheck.leftSide} BL) ≠ Issue + Wastage + Closing (${balanceCheck.rightSide} BL)`,
                    difference: balanceCheck.difference
                }
            });
        }

        // Update entry
        const entry = await prisma.regBEntry.update({
            where: { id: parseInt(id) },
            data: {
                ...data,
                ...totals
            },
            include: {
                batch: {
                    include: { brand: true }
                }
            }
        });

        // Log audit
        await logAudit({
            userId: req.user.id,
            action: 'REGB_UPDATE',
            entityType: 'REGB',
            entityId: entry.id.toString(),
            metadata: { entry, totals, balanceCheck }
        });

        res.json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE Reg-B entry
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await prisma.regBEntry.delete({
            where: { id: parseInt(id) }
        });

        // Log audit
        await logAudit({
            userId: req.user.id,
            action: 'REGB_DELETE',
            entityType: 'REGB',
            entityId: id,
            metadata: { entry }
        });

        res.json({ message: 'Entry deleted successfully', entry });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.status(500).json({ error: error.message });
    }
});

// POST auto-fill from Reg-A
router.post('/auto-fill/:date', verifyToken, async (req, res) => {
    try {
        const { date } = req.params;
        const { batchId } = req.body;

        // Find completed Reg-A entries for the date
        const regAEntries = await prisma.regAEntry.findMany({
            where: {
                productionDate: {
                    gte: new Date(date),
                    lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
                },
                status: 'COMPLETED',
                ...(batchId && { batchId: parseInt(batchId) })
            },
            include: {
                batch: {
                    include: { brand: true }
                }
            }
        });

        if (regAEntries.length === 0) {
            return res.status(404).json({
                error: 'No completed production entries found for this date'
            });
        }

        // Auto-fill receipt data from Reg-A entries
        const receiptData = {};
        regAEntries.forEach(entry => {
            const entryReceipt = autoFillFromRegA(entry);
            if (entryReceipt) {
                // Merge bottle counts
                Object.keys(entryReceipt).forEach(key => {
                    receiptData[key] = (receiptData[key] || 0) + entryReceipt[key];
                });
            }
        });

        res.json({
            message: `Auto-filled from ${regAEntries.length} production entries`,
            receiptData,
            sourceEntries: regAEntries.map(e => ({
                id: e.id,
                batchNo: e.batch.baseBatchNo,
                brand: e.batch.brand.name,
                bottledAl: e.spiritBottledAl
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// POST calculate totals (preview without saving)
router.post('/calculate', verifyToken, async (req, res) => {
    try {
        const data = req.body;

        // Calculate all totals
        const totals = calculateAllRegBTotals(data);

        // Validate balance
        const balanceCheck = validateRegBBalance(totals);

        res.json({
            totals,
            balanceCheck,
            isValid: balanceCheck.isBalanced
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET summary statistics
router.get('/summary/stats', verifyToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = {};
        if (startDate && endDate) {
            where.entryDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const entries = await prisma.regBEntry.findMany({
            where,
            select: {
                totalIssueBl: true,
                totalIssueAl: true,
                totalWastageBl: true,
                totalWastageAl: true,
                productionFees: true
            }
        });

        const stats = {
            totalEntries: entries.length,
            totalIssuedBl: entries.reduce((sum, e) => sum + (e.totalIssueBl || 0), 0),
            totalIssuedAl: entries.reduce((sum, e) => sum + (e.totalIssueAl || 0), 0),
            totalWastageBl: entries.reduce((sum, e) => sum + (e.totalWastageBl || 0), 0),
            totalWastageAl: entries.reduce((sum, e) => sum + (e.totalWastageAl || 0), 0),
            totalProductionFees: entries.reduce((sum, e) => sum + (e.productionFees || 0), 0)
        };

        // Round to 2 decimal places
        Object.keys(stats).forEach(key => {
            if (typeof stats[key] === 'number' && key !== 'totalEntries') {
                stats[key] = Math.round(stats[key] * 100) / 100;
            }
        });

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
