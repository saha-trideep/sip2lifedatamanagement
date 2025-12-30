/**
 * Reg-78 Routes - Master Spirit Ledger
 * 
 * Handles daily spirit inventory tracking by aggregating data from all registers.
 * Provides auto-generation, manual adjustments, and reconciliation workflows.
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');
const {
    aggregateFromAllRegisters,
    calculateVariance,
    determineReconciliationStatus,
    validateReg78Entry,
    getDrillDownData
} = require('../utils/reg78Calculations');

// GET all Reg-78 entries with filters
router.get('/entries', verifyToken, async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            isReconciled,
            page = 1,
            limit = 50,
            sortBy = 'entryDate',
            sortOrder = 'desc'
        } = req.query;

        const where = {};

        // Date range filter
        if (startDate && endDate) {
            where.entryDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        } else if (startDate) {
            where.entryDate = {
                gte: new Date(startDate)
            };
        } else if (endDate) {
            where.entryDate = {
                lte: new Date(endDate)
            };
        }

        // Reconciliation status filter
        if (isReconciled !== undefined) {
            where.isReconciled = isReconciled === 'true';
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [entries, total] = await Promise.all([
            prisma.reg78Entry.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: {
                    [sortBy]: sortOrder
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.reg78Entry.count({ where })
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
        console.error('Error fetching Reg-78 entries:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET single Reg-78 entry by ID with drill-down data
router.get('/entries/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { includeDrillDown = 'false' } = req.query;

        const entry = await prisma.reg78Entry.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Include drill-down data if requested
        let drillDown = null;
        if (includeDrillDown === 'true') {
            drillDown = await getDrillDownData(entry.entryDate);
        }

        res.json({
            entry,
            drillDown
        });
    } catch (error) {
        console.error('Error fetching Reg-78 entry:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST auto-generate entry for a specific date
router.post('/auto-generate/:date', verifyToken, async (req, res) => {
    try {
        const { date } = req.params;
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        // Check if entry already exists for this date
        const existing = await prisma.reg78Entry.findUnique({
            where: { entryDate: targetDate }
        });

        if (existing) {
            return res.status(400).json({
                error: 'Entry already exists for this date',
                existingEntry: existing
            });
        }

        // Aggregate data from all registers
        const aggregatedData = await aggregateFromAllRegisters(targetDate);

        // Create new entry
        const entry = await prisma.reg78Entry.create({
            data: {
                entryDate: targetDate,
                openingBl: aggregatedData.openingBl,
                openingAl: aggregatedData.openingAl,
                receiptBl: aggregatedData.receiptBl,
                receiptAl: aggregatedData.receiptAl,
                issueBl: aggregatedData.issueBl,
                issueAl: aggregatedData.issueAl,
                wastageBl: aggregatedData.wastageBl,
                wastageAl: aggregatedData.wastageAl,
                closingBl: aggregatedData.closingBl,
                closingAl: aggregatedData.closingAl,
                variance: 0, // No variance for auto-generated entries
                isReconciled: false,
                createdBy: req.user.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Log audit
        await logAudit({
            userId: req.user.id,
            action: 'REG78_AUTO_GENERATE',
            entityType: 'REG78',
            entityId: entry.id.toString(),
            metadata: {
                entry,
                sourceData: aggregatedData.sourceData
            }
        });

        res.status(201).json({
            message: 'Entry auto-generated successfully',
            entry,
            sourceData: aggregatedData.sourceData
        });
    } catch (error) {
        console.error('Error auto-generating Reg-78 entry:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST create manual entry
router.post('/entries', verifyToken, async (req, res) => {
    try {
        const data = req.body;

        // Validate entry
        const validation = validateReg78Entry(data);
        if (!validation.isValid) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.errors
            });
        }

        // Check if entry already exists for this date
        const existing = await prisma.reg78Entry.findUnique({
            where: { entryDate: new Date(data.entryDate) }
        });

        if (existing) {
            return res.status(400).json({
                error: 'Entry already exists for this date. Use PUT to update.'
            });
        }

        // Create entry
        const entry = await prisma.reg78Entry.create({
            data: {
                entryDate: new Date(data.entryDate),
                openingBl: parseFloat(data.openingBl) || 0,
                openingAl: parseFloat(data.openingAl) || 0,
                receiptBl: parseFloat(data.receiptBl) || 0,
                receiptAl: parseFloat(data.receiptAl) || 0,
                issueBl: parseFloat(data.issueBl) || 0,
                issueAl: parseFloat(data.issueAl) || 0,
                wastageBl: parseFloat(data.wastageBl) || 0,
                wastageAl: parseFloat(data.wastageAl) || 0,
                closingBl: parseFloat(data.closingBl) || 0,
                closingAl: parseFloat(data.closingAl) || 0,
                variance: parseFloat(data.variance) || null,
                isReconciled: data.isReconciled || false,
                remarks: data.remarks || null,
                createdBy: req.user.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Log audit
        await logAudit({
            userId: req.user.id,
            action: 'REG78_CREATE',
            entityType: 'REG78',
            entityId: entry.id.toString(),
            metadata: { entry }
        });

        res.status(201).json(entry);
    } catch (error) {
        console.error('Error creating Reg-78 entry:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update Reg-78 entry (manual adjustments)
router.put('/entries/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Check if entry exists
        const existing = await prisma.reg78Entry.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Validate entry
        const validation = validateReg78Entry(data);
        if (!validation.isValid) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.errors
            });
        }

        // Calculate variance if manual adjustment is made
        let variance = existing.variance;
        if (data.closingBl !== undefined && data.closingBl !== existing.closingBl) {
            const calculatedClosing = (data.openingBl || existing.openingBl) +
                (data.receiptBl || existing.receiptBl) -
                (data.issueBl || existing.issueBl) -
                (data.wastageBl || existing.wastageBl);
            variance = calculateVariance(calculatedClosing, data.closingBl);
        }

        // Update entry
        const entry = await prisma.reg78Entry.update({
            where: { id: parseInt(id) },
            data: {
                openingBl: data.openingBl !== undefined ? parseFloat(data.openingBl) : undefined,
                openingAl: data.openingAl !== undefined ? parseFloat(data.openingAl) : undefined,
                receiptBl: data.receiptBl !== undefined ? parseFloat(data.receiptBl) : undefined,
                receiptAl: data.receiptAl !== undefined ? parseFloat(data.receiptAl) : undefined,
                issueBl: data.issueBl !== undefined ? parseFloat(data.issueBl) : undefined,
                issueAl: data.issueAl !== undefined ? parseFloat(data.issueAl) : undefined,
                wastageBl: data.wastageBl !== undefined ? parseFloat(data.wastageBl) : undefined,
                wastageAl: data.wastageAl !== undefined ? parseFloat(data.wastageAl) : undefined,
                closingBl: data.closingBl !== undefined ? parseFloat(data.closingBl) : undefined,
                closingAl: data.closingAl !== undefined ? parseFloat(data.closingAl) : undefined,
                variance: variance,
                remarks: data.remarks !== undefined ? data.remarks : undefined
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Log audit
        await logAudit({
            userId: req.user.id,
            action: 'REG78_UPDATE',
            entityType: 'REG78',
            entityId: entry.id.toString(),
            metadata: {
                entry,
                previousData: existing,
                variance
            }
        });

        res.json(entry);
    } catch (error) {
        console.error('Error updating Reg-78 entry:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST reconcile entry
router.post('/reconcile/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        const entry = await prisma.reg78Entry.findUnique({
            where: { id: parseInt(id) }
        });

        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        if (entry.isReconciled) {
            return res.status(400).json({
                error: 'Entry is already reconciled',
                reconciledAt: entry.reconciledAt,
                reconciledBy: entry.reconciledBy
            });
        }

        // Check if variance is within acceptable limits
        const varianceThreshold = 1.0; // 1% default threshold
        const isAcceptable = determineReconciliationStatus(entry.variance || 0, varianceThreshold);

        if (!isAcceptable && !remarks) {
            return res.status(400).json({
                error: 'Variance exceeds threshold. Remarks are required for reconciliation.',
                variance: entry.variance,
                threshold: varianceThreshold
            });
        }

        // Reconcile entry
        const reconciledEntry = await prisma.reg78Entry.update({
            where: { id: parseInt(id) },
            data: {
                isReconciled: true,
                reconciledBy: req.user.id,
                reconciledAt: new Date(),
                remarks: remarks || entry.remarks
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Log audit
        await logAudit({
            userId: req.user.id,
            action: 'REG78_RECONCILE',
            entityType: 'REG78',
            entityId: reconciledEntry.id.toString(),
            metadata: {
                entry: reconciledEntry,
                variance: entry.variance,
                remarks
            }
        });

        res.json({
            message: 'Entry reconciled successfully',
            entry: reconciledEntry
        });
    } catch (error) {
        console.error('Error reconciling Reg-78 entry:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE Reg-78 entry
router.delete('/entries/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await prisma.reg78Entry.delete({
            where: { id: parseInt(id) }
        });

        // Log audit
        await logAudit({
            userId: req.user.id,
            action: 'REG78_DELETE',
            entityType: 'REG78',
            entityId: entry.id.toString(),
            metadata: { entry }
        });

        res.json({
            message: 'Entry deleted successfully',
            deletedEntry: entry
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Entry not found' });
        }
        console.error('Error deleting Reg-78 entry:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET variance report
router.get('/variance-report', verifyToken, async (req, res) => {
    try {
        const {
            threshold = 1.0,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        const where = {
            variance: {
                not: null
            },
            OR: [
                { variance: { gte: parseFloat(threshold) } },
                { variance: { lte: -parseFloat(threshold) } }
            ]
        };

        // Date range filter
        if (startDate && endDate) {
            where.entryDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [entries, total] = await Promise.all([
            prisma.reg78Entry.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: {
                    variance: 'desc'
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.reg78Entry.count({ where })
        ]);

        // Calculate summary statistics
        const allVariances = await prisma.reg78Entry.findMany({
            where: {
                variance: { not: null }
            },
            select: {
                variance: true
            }
        });

        const avgVariance = allVariances.length > 0
            ? allVariances.reduce((sum, e) => sum + Math.abs(e.variance), 0) / allVariances.length
            : 0;

        res.json({
            entries,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            },
            summary: {
                threshold: parseFloat(threshold),
                entriesExceedingThreshold: total,
                averageVariance: avgVariance.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error generating variance report:', error);
        res.status(500).json({ error: error.message });
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

        const entries = await prisma.reg78Entry.findMany({
            where,
            select: {
                openingBl: true,
                openingAl: true,
                receiptBl: true,
                receiptAl: true,
                issueBl: true,
                issueAl: true,
                wastageBl: true,
                wastageAl: true,
                closingBl: true,
                closingAl: true,
                variance: true,
                isReconciled: true
            }
        });

        const stats = {
            totalEntries: entries.length,
            totalReceiptsBl: entries.reduce((sum, e) => sum + e.receiptBl, 0),
            totalReceiptsAl: entries.reduce((sum, e) => sum + e.receiptAl, 0),
            totalIssuesBl: entries.reduce((sum, e) => sum + e.issueBl, 0),
            totalIssuesAl: entries.reduce((sum, e) => sum + e.issueAl, 0),
            totalWastageBl: entries.reduce((sum, e) => sum + e.wastageBl, 0),
            totalWastageAl: entries.reduce((sum, e) => sum + e.wastageAl, 0),
            currentClosingBl: entries.length > 0 ? entries[entries.length - 1].closingBl : 0,
            currentClosingAl: entries.length > 0 ? entries[entries.length - 1].closingAl : 0,
            reconciledCount: entries.filter(e => e.isReconciled).length,
            pendingReconciliation: entries.filter(e => !e.isReconciled).length,
            averageVariance: entries.filter(e => e.variance !== null)
                .reduce((sum, e) => sum + Math.abs(e.variance), 0) /
                (entries.filter(e => e.variance !== null).length || 1)
        };

        res.json(stats);
    } catch (error) {
        console.error('Error generating summary stats:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
