/**
 * Excise Duty Register API Routes
 * 
 * Handles all API endpoints for the Excise Duty Register (Phase 3)
 * 
 * Endpoints:
 * - Duty Rates: 4 endpoints (CRUD)
 * - Duty Ledger: 5 endpoints (CRUD + list)
 * - Challans: 4 endpoints (record, list, verify, delete)
 * - Auto-Generation & Reports: 3 endpoints
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const {
    getCurrentDutyRate,
    calculateDutyAccrued,
    calculateClosingBalance,
    determineStatus,
    validateDutyEntry,
    validateChallan,
    calculateAllDutyValues
} = require('../utils/exciseDutyCalculations');

// Middleware to verify authentication (assuming it exists)
// const { verifyToken } = require('../middleware/auth');
// router.use(verifyToken);

// ============================================
// DUTY RATES ENDPOINTS (4 endpoints)
// ============================================

/**
 * GET /api/excise-duty/rates
 * List all duty rates with optional filters
 */
router.get('/rates', async (req, res) => {
    try {
        const { category, subcategory, isActive, page = 1, limit = 50 } = req.query;

        const where = {};
        if (category) where.category = category;
        if (subcategory) where.subcategory = subcategory;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [rates, total] = await Promise.all([
            prisma.dutyRate.findMany({
                where,
                orderBy: [
                    { category: 'asc' },
                    { subcategory: 'asc' },
                    { effectiveFrom: 'desc' }
                ],
                skip,
                take: parseInt(limit)
            }),
            prisma.dutyRate.count({ where })
        ]);

        res.json({
            success: true,
            data: rates,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching duty rates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch duty rates',
            message: error.message
        });
    }
});

/**
 * POST /api/excise-duty/rates
 * Create a new duty rate
 */
router.post('/rates', async (req, res) => {
    try {
        const { category, subcategory, ratePerAl, effectiveFrom, effectiveTo, state, remarks } = req.body;

        // Validation
        if (!category || !ratePerAl || !effectiveFrom) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: category, ratePerAl, effectiveFrom'
            });
        }

        if (ratePerAl <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Rate must be positive'
            });
        }

        // Create duty rate
        const rate = await prisma.dutyRate.create({
            data: {
                category,
                subcategory,
                ratePerAl: parseFloat(ratePerAl),
                effectiveFrom: new Date(effectiveFrom),
                effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
                state: state || 'West Bengal',
                isActive: true,
                remarks
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id || 1, // TODO: Get from auth middleware
                action: 'CREATE_DUTY_RATE',
                entityType: 'DutyRate',
                entityId: rate.id.toString(),
                metadata: { category, subcategory, ratePerAl }
            }
        });

        res.status(201).json({
            success: true,
            data: rate,
            message: 'Duty rate created successfully'
        });
    } catch (error) {
        console.error('Error creating duty rate:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create duty rate',
            message: error.message
        });
    }
});

/**
 * PUT /api/excise-duty/rates/:id
 * Update an existing duty rate
 */
router.put('/rates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ratePerAl, effectiveFrom, effectiveTo, isActive, remarks } = req.body;

        // Check if rate exists
        const existingRate = await prisma.dutyRate.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingRate) {
            return res.status(404).json({
                success: false,
                error: 'Duty rate not found'
            });
        }

        // Update rate
        const updateData = {};
        if (ratePerAl !== undefined) updateData.ratePerAl = parseFloat(ratePerAl);
        if (effectiveFrom !== undefined) updateData.effectiveFrom = new Date(effectiveFrom);
        if (effectiveTo !== undefined) updateData.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (remarks !== undefined) updateData.remarks = remarks;

        const rate = await prisma.dutyRate.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id || 1,
                action: 'UPDATE_DUTY_RATE',
                entityType: 'DutyRate',
                entityId: rate.id.toString(),
                metadata: updateData
            }
        });

        res.json({
            success: true,
            data: rate,
            message: 'Duty rate updated successfully'
        });
    } catch (error) {
        console.error('Error updating duty rate:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update duty rate',
            message: error.message
        });
    }
});

/**
 * DELETE /api/excise-duty/rates/:id
 * Deactivate a duty rate (soft delete)
 */
router.delete('/rates/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if rate exists
        const existingRate = await prisma.dutyRate.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingRate) {
            return res.status(404).json({
                success: false,
                error: 'Duty rate not found'
            });
        }

        // Deactivate rate (soft delete)
        const rate = await prisma.dutyRate.update({
            where: { id: parseInt(id) },
            data: {
                isActive: false,
                effectiveTo: new Date() // Set end date to now
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id || 1,
                action: 'DEACTIVATE_DUTY_RATE',
                entityType: 'DutyRate',
                entityId: rate.id.toString(),
                metadata: { category: rate.category, subcategory: rate.subcategory }
            }
        });

        res.json({
            success: true,
            data: rate,
            message: 'Duty rate deactivated successfully'
        });
    } catch (error) {
        console.error('Error deactivating duty rate:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to deactivate duty rate',
            message: error.message
        });
    }
});

// ============================================
// DUTY LEDGER ENDPOINTS (5 endpoints)
// ============================================

/**
 * GET /api/excise-duty/ledger
 * List all duty ledger entries with filters
 */
router.get('/ledger', async (req, res) => {
    try {
        const {
            category,
            subcategory,
            status,
            startMonth,
            endMonth,
            page = 1,
            limit = 50
        } = req.query;

        const where = {};
        if (category) where.category = category;
        if (subcategory) where.subcategory = subcategory;
        if (status) where.status = status;
        if (startMonth || endMonth) {
            where.monthYear = {};
            if (startMonth) where.monthYear.gte = new Date(startMonth);
            if (endMonth) where.monthYear.lte = new Date(endMonth);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [entries, total] = await Promise.all([
            prisma.exciseDutyEntry.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, email: true }
                    },
                    challans: {
                        select: {
                            id: true,
                            challanNumber: true,
                            challanDate: true,
                            amountPaid: true,
                            verificationStatus: true
                        }
                    }
                },
                orderBy: [
                    { monthYear: 'desc' },
                    { category: 'asc' },
                    { subcategory: 'asc' }
                ],
                skip,
                take: parseInt(limit)
            }),
            prisma.exciseDutyEntry.count({ where })
        ]);

        res.json({
            success: true,
            data: entries,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching duty ledger:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch duty ledger',
            message: error.message
        });
    }
});

/**
 * GET /api/excise-duty/ledger/:id
 * Get a single duty ledger entry
 */
router.get('/ledger/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await prisma.exciseDutyEntry.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                challans: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    },
                    orderBy: { challanDate: 'desc' }
                }
            }
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                error: 'Duty entry not found'
            });
        }

        res.json({
            success: true,
            data: entry
        });
    } catch (error) {
        console.error('Error fetching duty entry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch duty entry',
            message: error.message
        });
    }
});

/**
 * POST /api/excise-duty/ledger
 * Create a new duty ledger entry (with optional auto-fill from Reg-B)
 */
router.post('/ledger', async (req, res) => {
    try {
        const {
            monthYear,
            category,
            subcategory,
            totalBlIssued,
            totalAlIssued,
            openingBalance,
            remarks,
            autoFillFromRegB = false
        } = req.body;

        // Validation
        const validation = validateDutyEntry({
            monthYear: monthYear ? new Date(monthYear) : undefined,
            category,
            subcategory,
            totalBlIssued: totalBlIssued || 0,
            totalAlIssued: totalAlIssued || 0,
            applicableRate: 0, // Will be fetched
            dutyAccrued: 0 // Will be calculated
        });

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                errors: validation.errors
            });
        }

        // Check for duplicate entry
        const existing = await prisma.exciseDutyEntry.findFirst({
            where: {
                monthYear: new Date(monthYear),
                category,
                subcategory
            }
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                error: 'Duty entry already exists for this month and strength'
            });
        }

        // Get previous month's closing balance for opening balance
        const previousMonth = new Date(monthYear);
        previousMonth.setMonth(previousMonth.getMonth() - 1);

        const previousEntry = await prisma.exciseDutyEntry.findFirst({
            where: {
                monthYear: previousMonth,
                category,
                subcategory
            }
        });

        const calculatedOpeningBalance = previousEntry?.closingBalance || openingBalance || 0;

        // Calculate all values
        const entryData = await calculateAllDutyValues({
            monthYear: new Date(monthYear),
            category,
            subcategory,
            totalBlIssued: totalBlIssued || 0,
            totalAlIssued: totalAlIssued || 0,
            openingBalance: calculatedOpeningBalance,
            totalPayments: 0,
            createdBy: req.user?.id || 1
        });

        // Create entry
        const entry = await prisma.exciseDutyEntry.create({
            data: {
                ...entryData,
                remarks,
                createdBy: req.user?.id || 1
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id || 1,
                action: 'CREATE_DUTY_ENTRY',
                entityType: 'ExciseDutyEntry',
                entityId: entry.id.toString(),
                metadata: {
                    monthYear,
                    category,
                    subcategory,
                    dutyAccrued: entry.dutyAccrued
                }
            }
        });

        res.status(201).json({
            success: true,
            data: entry,
            message: 'Duty entry created successfully'
        });
    } catch (error) {
        console.error('Error creating duty entry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create duty entry',
            message: error.message
        });
    }
});

/**
 * PUT /api/excise-duty/ledger/:id
 * Update an existing duty ledger entry
 */
router.put('/ledger/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { totalBlIssued, totalAlIssued, remarks } = req.body;

        // Check if entry exists
        const existingEntry = await prisma.exciseDutyEntry.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingEntry) {
            return res.status(404).json({
                success: false,
                error: 'Duty entry not found'
            });
        }

        // Recalculate if BL/AL changed
        let updateData = { remarks };

        if (totalBlIssued !== undefined || totalAlIssued !== undefined) {
            const recalculated = await calculateAllDutyValues({
                ...existingEntry,
                totalBlIssued: totalBlIssued !== undefined ? totalBlIssued : existingEntry.totalBlIssued,
                totalAlIssued: totalAlIssued !== undefined ? totalAlIssued : existingEntry.totalAlIssued
            });

            updateData = {
                ...updateData,
                totalBlIssued: recalculated.totalBlIssued,
                totalAlIssued: recalculated.totalAlIssued,
                applicableRate: recalculated.applicableRate,
                dutyAccrued: recalculated.dutyAccrued,
                closingBalance: recalculated.closingBalance,
                status: recalculated.status
            };
        }

        const entry = await prisma.exciseDutyEntry.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                challans: true
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id || 1,
                action: 'UPDATE_DUTY_ENTRY',
                entityType: 'ExciseDutyEntry',
                entityId: entry.id.toString(),
                metadata: updateData
            }
        });

        res.json({
            success: true,
            data: entry,
            message: 'Duty entry updated successfully'
        });
    } catch (error) {
        console.error('Error updating duty entry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update duty entry',
            message: error.message
        });
    }
});

/**
 * DELETE /api/excise-duty/ledger/:id
 * Delete a duty ledger entry
 */
router.delete('/ledger/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if entry exists
        const existingEntry = await prisma.exciseDutyEntry.findUnique({
            where: { id: parseInt(id) },
            include: { challans: true }
        });

        if (!existingEntry) {
            return res.status(404).json({
                success: false,
                error: 'Duty entry not found'
            });
        }

        // Check if there are challans linked
        if (existingEntry.challans.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete entry with linked challans. Delete challans first.'
            });
        }

        // Delete entry
        await prisma.exciseDutyEntry.delete({
            where: { id: parseInt(id) }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id || 1,
                action: 'DELETE_DUTY_ENTRY',
                entityType: 'ExciseDutyEntry',
                entityId: id.toString(),
                metadata: {
                    monthYear: existingEntry.monthYear,
                    category: existingEntry.category,
                    subcategory: existingEntry.subcategory
                }
            }
        });

        res.json({
            success: true,
            message: 'Duty entry deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting duty entry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete duty entry',
            message: error.message
        });
    }
});

// ============================================
// CHALLAN ENDPOINTS (4 endpoints)
// ============================================

/**
 * POST /api/excise-duty/challans
 * Record a new treasury challan payment
 */
router.post('/challans', async (req, res) => {
    try {
        const {
            dutyEntryId,
            challanNumber,
            challanDate,
            amountPaid,
            bankName,
            branchName,
            documentUrl,
            documentId,
            remarks
        } = req.body;

        // Validation
        const validation = validateChallan({
            dutyEntryId,
            challanNumber,
            challanDate: challanDate ? new Date(challanDate) : undefined,
            amountPaid
        });

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                errors: validation.errors
            });
        }

        // Check if duty entry exists
        const dutyEntry = await prisma.exciseDutyEntry.findUnique({
            where: { id: parseInt(dutyEntryId) }
        });

        if (!dutyEntry) {
            return res.status(404).json({
                success: false,
                error: 'Duty entry not found'
            });
        }

        // Check for duplicate challan number
        const existingChallan = await prisma.treasuryChallan.findUnique({
            where: { challanNumber }
        });

        if (existingChallan) {
            return res.status(409).json({
                success: false,
                error: 'Challan number already exists'
            });
        }

        // Create challan
        const challan = await prisma.treasuryChallan.create({
            data: {
                dutyEntryId: parseInt(dutyEntryId),
                challanNumber,
                challanDate: new Date(challanDate),
                amountPaid: parseFloat(amountPaid),
                bankName,
                branchName,
                documentUrl,
                documentId: documentId ? parseInt(documentId) : null,
                verificationStatus: 'PENDING',
                remarks,
                createdBy: req.user?.id || 1
            },
            include: {
                dutyEntry: true,
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        // Update duty entry balances
        const newTotalPayments = dutyEntry.totalPayments + parseFloat(amountPaid);
        const newClosingBalance = calculateClosingBalance(
            dutyEntry.openingBalance,
            dutyEntry.dutyAccrued,
            newTotalPayments
        );
        const newStatus = determineStatus(
            newClosingBalance,
            dutyEntry.openingBalance + dutyEntry.dutyAccrued
        );

        await prisma.exciseDutyEntry.update({
            where: { id: parseInt(dutyEntryId) },
            data: {
                totalPayments: newTotalPayments,
                closingBalance: newClosingBalance,
                status: newStatus
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id || 1,
                action: 'RECORD_CHALLAN',
                entityType: 'TreasuryChallan',
                entityId: challan.id.toString(),
                metadata: {
                    challanNumber,
                    amountPaid,
                    dutyEntryId
                }
            }
        });

        res.status(201).json({
            success: true,
            data: challan,
            message: 'Challan recorded successfully'
        });
    } catch (error) {
        console.error('Error recording challan:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record challan',
            message: error.message
        });
    }
});

/**
 * GET /api/excise-duty/challans
 * List all treasury challans with filters
 */
router.get('/challans', async (req, res) => {
    try {
        const {
            dutyEntryId,
            verificationStatus,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        const where = {};
        if (dutyEntryId) where.dutyEntryId = parseInt(dutyEntryId);
        if (verificationStatus) where.verificationStatus = verificationStatus;
        if (startDate || endDate) {
            where.challanDate = {};
            if (startDate) where.challanDate.gte = new Date(startDate);
            if (endDate) where.challanDate.lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [challans, total] = await Promise.all([
            prisma.treasuryChallan.findMany({
                where,
                include: {
                    dutyEntry: {
                        select: {
                            id: true,
                            monthYear: true,
                            category: true,
                            subcategory: true
                        }
                    },
                    user: {
                        select: { id: true, name: true, email: true }
                    }
                },
                orderBy: { challanDate: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.treasuryChallan.count({ where })
        ]);

        res.json({
            success: true,
            data: challans,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching challans:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch challans',
            message: error.message
        });
    }
});

/**
 * PUT /api/excise-duty/challans/:id/verify
 * Verify a treasury challan
 */
router.put('/challans/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationStatus, remarks } = req.body;

        if (!['VERIFIED', 'REJECTED'].includes(verificationStatus)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid verification status. Must be VERIFIED or REJECTED'
            });
        }

        // Check if challan exists
        const existingChallan = await prisma.treasuryChallan.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingChallan) {
            return res.status(404).json({
                success: false,
                error: 'Challan not found'
            });
        }

        // Update challan
        const challan = await prisma.treasuryChallan.update({
            where: { id: parseInt(id) },
            data: {
                verificationStatus,
                verifiedBy: req.user?.id || 1,
                verifiedAt: new Date(),
                remarks: remarks || existingChallan.remarks
            },
            include: {
                dutyEntry: true,
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id || 1,
                action: 'VERIFY_CHALLAN',
                entityType: 'TreasuryChallan',
                entityId: challan.id.toString(),
                metadata: {
                    verificationStatus,
                    challanNumber: challan.challanNumber
                }
            }
        });

        res.json({
            success: true,
            data: challan,
            message: `Challan ${verificationStatus.toLowerCase()} successfully`
        });
    } catch (error) {
        console.error('Error verifying challan:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify challan',
            message: error.message
        });
    }
});

/**
 * DELETE /api/excise-duty/challans/:id
 * Delete a treasury challan
 */
router.delete('/challans/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if challan exists
        const existingChallan = await prisma.treasuryChallan.findUnique({
            where: { id: parseInt(id) },
            include: { dutyEntry: true }
        });

        if (!existingChallan) {
            return res.status(404).json({
                success: false,
                error: 'Challan not found'
            });
        }

        // Update duty entry balances before deleting
        const dutyEntry = existingChallan.dutyEntry;
        const newTotalPayments = dutyEntry.totalPayments - existingChallan.amountPaid;
        const newClosingBalance = calculateClosingBalance(
            dutyEntry.openingBalance,
            dutyEntry.dutyAccrued,
            newTotalPayments
        );
        const newStatus = determineStatus(
            newClosingBalance,
            dutyEntry.openingBalance + dutyEntry.dutyAccrued
        );

        await prisma.exciseDutyEntry.update({
            where: { id: dutyEntry.id },
            data: {
                totalPayments: newTotalPayments,
                closingBalance: newClosingBalance,
                status: newStatus
            }
        });

        // Delete challan
        await prisma.treasuryChallan.delete({
            where: { id: parseInt(id) }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id || 1,
                action: 'DELETE_CHALLAN',
                entityType: 'TreasuryChallan',
                entityId: id.toString(),
                metadata: {
                    challanNumber: existingChallan.challanNumber,
                    amountPaid: existingChallan.amountPaid
                }
            }
        });

        res.json({
            success: true,
            message: 'Challan deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting challan:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete challan',
            message: error.message
        });
    }
});

// ============================================
// AUTO-GENERATION & REPORTS (3 endpoints)
// ============================================

/**
 * POST /api/excise-duty/generate-monthly
 * Auto-generate monthly duty entries from Reg-B data
 */
router.post('/generate-monthly', async (req, res) => {
    try {
        const { monthYear } = req.body;

        if (!monthYear) {
            return res.status(400).json({
                success: false,
                error: 'Month/Year is required'
            });
        }

        const targetMonth = new Date(monthYear);

        // TODO: Fetch Reg-B summary for this month
        // This will be implemented when Reg-B API is available
        // For now, return a placeholder response

        res.json({
            success: true,
            message: 'Auto-generation from Reg-B not yet implemented',
            note: 'This endpoint will fetch BL/AL data from Reg-B and create duty entries automatically'
        });
    } catch (error) {
        console.error('Error generating monthly entries:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate monthly entries',
            message: error.message
        });
    }
});

/**
 * POST /api/excise-duty/calculate
 * Preview duty calculation without saving
 */
router.post('/calculate', async (req, res) => {
    try {
        const { category, subcategory, totalBlIssued, monthYear } = req.body;

        if (!category || !subcategory || totalBlIssued === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: category, subcategory, totalBlIssued'
            });
        }

        // Get applicable rate
        const rate = await getCurrentDutyRate(
            category,
            subcategory,
            monthYear ? new Date(monthYear) : new Date()
        );

        if (!rate) {
            return res.status(404).json({
                success: false,
                error: `No duty rate found for ${category} - ${subcategory}`
            });
        }

        // Calculate duty
        const dutyAccrued = calculateDutyAccrued(totalBlIssued, rate.ratePerAl);

        res.json({
            success: true,
            data: {
                category,
                subcategory,
                totalBlIssued,
                applicableRate: rate.ratePerAl,
                dutyAccrued,
                rateDetails: {
                    id: rate.id,
                    effectiveFrom: rate.effectiveFrom,
                    effectiveTo: rate.effectiveTo,
                    remarks: rate.remarks
                }
            }
        });
    } catch (error) {
        console.error('Error calculating duty:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate duty',
            message: error.message
        });
    }
});

/**
 * GET /api/excise-duty/summary/stats
 * Get dashboard summary statistics
 */
router.get('/summary/stats', async (req, res) => {
    try {
        const { monthYear } = req.query;

        const where = {};
        if (monthYear) {
            where.monthYear = new Date(monthYear);
        }

        // Get all entries
        const entries = await prisma.exciseDutyEntry.findMany({
            where,
            include: {
                challans: {
                    where: { verificationStatus: 'VERIFIED' }
                }
            }
        });

        // Calculate statistics
        const stats = {
            totalDutyAccrued: 0,
            totalPayments: 0,
            outstandingBalance: 0,
            pendingEntries: 0,
            partialPaidEntries: 0,
            fullyPaidEntries: 0,
            byStrength: {
                '50': { bl: 0, duty: 0, payments: 0, balance: 0 },
                '60': { bl: 0, duty: 0, payments: 0, balance: 0 },
                '70': { bl: 0, duty: 0, payments: 0, balance: 0 },
                '80': { bl: 0, duty: 0, payments: 0, balance: 0 }
            }
        };

        entries.forEach(entry => {
            stats.totalDutyAccrued += entry.dutyAccrued;
            stats.totalPayments += entry.totalPayments;
            stats.outstandingBalance += entry.closingBalance;

            if (entry.status === 'PENDING') stats.pendingEntries++;
            if (entry.status === 'PARTIAL_PAID') stats.partialPaidEntries++;
            if (entry.status === 'FULLY_PAID') stats.fullyPaidEntries++;

            // Breakdown by strength
            const strength = entry.subcategory?.replace('° U.P.', '');
            if (strength && stats.byStrength[strength]) {
                stats.byStrength[strength].bl += entry.totalBlIssued;
                stats.byStrength[strength].duty += entry.dutyAccrued;
                stats.byStrength[strength].payments += entry.totalPayments;
                stats.byStrength[strength].balance += entry.closingBalance;
            }
        });

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching summary stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch summary statistics',
            message: error.message
        });
    }
});

module.exports = router;
