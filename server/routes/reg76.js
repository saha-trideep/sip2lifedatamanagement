const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');
const {
    calculateAllReg76Values,
    validateReg76Entry
} = require('../utils/reg76Calculations');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// CREATE - POST /api/registers/reg76
// ============================================================================

router.post('/', verifyToken, async (req, res) => {
    try {
        const data = req.body;

        // Validate entry data
        const validation = validateReg76Entry(data);
        if (!validation.isValid) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.errors
            });
        }

        // Calculate all values
        const calculatedValues = calculateAllReg76Values(data);

        // Create entry
        const entry = await prisma.reg76Entry.create({
            data: {
                // Basic Information
                receiptDate: new Date(data.receiptDate),
                arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
                permitNo: data.permitNo,
                permitDate: data.permitDate ? new Date(data.permitDate) : null,
                exportingDistillery: data.exportingDistillery,
                invoiceNo: data.invoiceNo,
                invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
                vehicleNo: data.vehicleNo,
                tankerMakeModel: data.tankerMakeModel || null,
                natureOfSpirit: data.natureOfSpirit,
                storageVat: data.storageVat,

                // Advised Quantities
                advisedBl: parseFloat(data.advisedBl),
                advisedAl: parseFloat(data.advisedAl),
                advisedStrength: parseFloat(data.advisedStrength),
                advisedMassKg: parseFloat(data.advisedMassKg),

                // Measurement Data
                ladenWeightKg: parseFloat(data.ladenWeightKg),
                unladenWeightKg: parseFloat(data.unladenWeightKg),
                avgDensity: parseFloat(data.avgDensity),
                avgTemperature: parseFloat(data.avgTemperature),

                // Received Values
                receivedStrength: parseFloat(data.receivedStrength),
                remarks: data.remarks || null,

                // Auto-calculated fields
                receivedMass: calculatedValues.receivedMass,
                receivedBl: calculatedValues.receivedBl,
                receivedAl: calculatedValues.receivedAl,
                transitWastageBl: calculatedValues.transitWastageBl,
                transitWastageAl: calculatedValues.transitWastageAl,

                // User tracking
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
            action: 'REG76_CREATE',
            entityType: 'REG76',
            entityId: entry.id.toString(),
            metadata: {
                permitNo: entry.permitNo,
                vehicleNo: entry.vehicleNo,
                receivedAl: entry.receivedAl,
                wastageAl: entry.transitWastageAl,
                isChargeable: calculatedValues.isChargeable
            }
        });

        res.status(201).json({
            success: true,
            entry,
            calculated: {
                transitDays: calculatedValues.transitDays,
                allowableWastage: calculatedValues.allowableWastage,
                chargeableWastage: calculatedValues.chargeableWastage,
                isChargeable: calculatedValues.isChargeable,
                percentageWastage: calculatedValues.percentageWastage
            }
        });

    } catch (error) {
        console.error('Reg-76 Create Error:', error);
        res.status(500).json({
            error: 'Failed to create Reg-76 entry',
            details: error.message
        });
    }
});

// ============================================================================
// READ ALL - GET /api/registers/reg76
// ============================================================================

router.get('/', verifyToken, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            sortBy = 'receiptDate',
            sortOrder = 'desc',
            startDate,
            endDate,
            vehicleNo,
            distillery,
            storageVat
        } = req.query;

        // Build where clause
        const where = {};

        // Date range filter
        if (startDate || endDate) {
            where.receiptDate = {};
            if (startDate) {
                where.receiptDate.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.receiptDate.lte = end;
            }
        }

        // Vehicle number filter
        if (vehicleNo) {
            where.vehicleNo = {
                contains: vehicleNo,
                mode: 'insensitive'
            };
        }

        // Distillery filter
        if (distillery) {
            where.exportingDistillery = {
                contains: distillery,
                mode: 'insensitive'
            };
        }

        // Storage vat filter
        if (storageVat) {
            where.storageVat = storageVat;
        }

        // Get total count
        const total = await prisma.reg76Entry.count({ where });

        // Get entries
        const entries = await prisma.reg76Entry.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                [sortBy]: sortOrder
            },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        res.json({
            success: true,
            entries,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Reg-76 List Error:', error);
        res.status(500).json({
            error: 'Failed to fetch Reg-76 entries',
            details: error.message
        });
    }
});

// ============================================================================
// READ ONE - GET /api/registers/reg76/:id
// ============================================================================

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await prisma.reg76Entry.findUnique({
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
            return res.status(404).json({
                error: 'Reg-76 entry not found'
            });
        }

        res.json({
            success: true,
            entry
        });

    } catch (error) {
        console.error('Reg-76 Get Error:', error);
        res.status(500).json({
            error: 'Failed to fetch Reg-76 entry',
            details: error.message
        });
    }
});

// ============================================================================
// UPDATE - PUT /api/registers/reg76/:id
// ============================================================================

router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Check if entry exists
        const existing = await prisma.reg76Entry.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Reg-76 entry not found'
            });
        }

        // Validate entry data
        const validation = validateReg76Entry(data);
        if (!validation.isValid) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.errors
            });
        }

        // Calculate all values
        const calculatedValues = calculateAllReg76Values(data);

        // Update entry
        const entry = await prisma.reg76Entry.update({
            where: { id: parseInt(id) },
            data: {
                // Basic Information
                receiptDate: new Date(data.receiptDate),
                arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
                permitNo: data.permitNo,
                permitDate: data.permitDate ? new Date(data.permitDate) : null,
                exportingDistillery: data.exportingDistillery,
                invoiceNo: data.invoiceNo,
                invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
                vehicleNo: data.vehicleNo,
                tankerMakeModel: data.tankerMakeModel || null,
                natureOfSpirit: data.natureOfSpirit,
                storageVat: data.storageVat,

                // Advised Quantities
                advisedBl: parseFloat(data.advisedBl),
                advisedAl: parseFloat(data.advisedAl),
                advisedStrength: parseFloat(data.advisedStrength),
                advisedMassKg: parseFloat(data.advisedMassKg),

                // Measurement Data
                ladenWeightKg: parseFloat(data.ladenWeightKg),
                unladenWeightKg: parseFloat(data.unladenWeightKg),
                avgDensity: parseFloat(data.avgDensity),
                avgTemperature: parseFloat(data.avgTemperature),

                // Received Values
                receivedStrength: parseFloat(data.receivedStrength),
                remarks: data.remarks || null,

                // Auto-calculated fields
                receivedMass: calculatedValues.receivedMass,
                receivedBl: calculatedValues.receivedBl,
                receivedAl: calculatedValues.receivedAl,
                transitWastageBl: calculatedValues.transitWastageBl,
                transitWastageAl: calculatedValues.transitWastageAl
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
            action: 'REG76_UPDATE',
            entityType: 'REG76',
            entityId: entry.id.toString(),
            metadata: {
                permitNo: entry.permitNo,
                vehicleNo: entry.vehicleNo,
                changes: 'Entry updated'
            }
        });

        res.json({
            success: true,
            entry,
            calculated: {
                transitDays: calculatedValues.transitDays,
                allowableWastage: calculatedValues.allowableWastage,
                chargeableWastage: calculatedValues.chargeableWastage,
                isChargeable: calculatedValues.isChargeable,
                percentageWastage: calculatedValues.percentageWastage
            }
        });

    } catch (error) {
        console.error('Reg-76 Update Error:', error);
        res.status(500).json({
            error: 'Failed to update Reg-76 entry',
            details: error.message
        });
    }
});

// ============================================================================
// DELETE - DELETE /api/registers/reg76/:id
// ============================================================================

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if entry exists
        const existing = await prisma.reg76Entry.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({
                error: 'Reg-76 entry not found'
            });
        }

        // Delete entry
        await prisma.reg76Entry.delete({
            where: { id: parseInt(id) }
        });

        // Log audit
        await logAudit({
            userId: req.user.id,
            action: 'REG76_DELETE',
            entityType: 'REG76',
            entityId: id.toString(),
            metadata: {
                permitNo: existing.permitNo,
                vehicleNo: existing.vehicleNo
            }
        });

        res.json({
            success: true,
            message: 'Reg-76 entry deleted successfully'
        });

    } catch (error) {
        console.error('Reg-76 Delete Error:', error);
        res.status(500).json({
            error: 'Failed to delete Reg-76 entry',
            details: error.message
        });
    }
});

// ============================================================================
// CALCULATE - POST /api/registers/reg76/calculate
// ============================================================================

router.post('/calculate', verifyToken, async (req, res) => {
    try {
        const data = req.body;

        // Calculate all values without saving
        const calculatedValues = calculateAllReg76Values(data);

        res.json({
            success: true,
            calculated: calculatedValues
        });

    } catch (error) {
        console.error('Reg-76 Calculate Error:', error);
        res.status(500).json({
            error: 'Failed to calculate values',
            details: error.message
        });
    }
});

// ============================================================================
// SUMMARY - GET /api/registers/reg76/summary
// ============================================================================

router.get('/summary/stats', verifyToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = {};
        if (startDate || endDate) {
            where.receiptDate = {};
            if (startDate) where.receiptDate.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.receiptDate.lte = end;
            }
        }

        // Get all entries in range
        const entries = await prisma.reg76Entry.findMany({ where });

        // Calculate summary
        const summary = {
            totalEntries: entries.length,
            totalAdvisedAl: entries.reduce((sum, e) => sum + e.advisedAl, 0),
            totalReceivedAl: entries.reduce((sum, e) => sum + e.receivedAl, 0),
            totalWastageAl: entries.reduce((sum, e) => sum + e.transitWastageAl, 0),
            avgWastagePercent: 0,
            entriesWithChargeableWastage: 0
        };

        if (summary.totalAdvisedAl > 0) {
            summary.avgWastagePercent = (summary.totalWastageAl / summary.totalAdvisedAl) * 100;
        }

        // Count chargeable wastage entries (wastage > 0.5%)
        summary.entriesWithChargeableWastage = entries.filter(e => {
            const wastagePercent = (e.transitWastageAl / e.advisedAl) * 100;
            return wastagePercent > 0.5;
        }).length;

        res.json({
            success: true,
            summary: {
                ...summary,
                totalAdvisedAl: Math.round(summary.totalAdvisedAl * 100) / 100,
                totalReceivedAl: Math.round(summary.totalReceivedAl * 100) / 100,
                totalWastageAl: Math.round(summary.totalWastageAl * 100) / 100,
                avgWastagePercent: Math.round(summary.avgWastagePercent * 100) / 100
            }
        });

    } catch (error) {
        console.error('Reg-76 Summary Error:', error);
        res.status(500).json({
            error: 'Failed to generate summary',
            details: error.message
        });
    }
});

module.exports = router;
