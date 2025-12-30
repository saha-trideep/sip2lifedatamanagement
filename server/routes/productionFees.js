const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
    calculateBlFromCounts,
    aggregateRegAProduction
} = require('../utils/productionFeeCalculations');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

/**
 * GET /api/production-fees/ledger
 * List all entries with optional date filtering
 */
router.get('/ledger', async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 100 } = req.query;

        const where = {};
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [entries, total] = await Promise.all([
            prisma.productionFeeEntry.findMany({
                where,
                orderBy: { date: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.productionFeeEntry.count({ where })
        ]);

        res.json({
            success: true,
            data: entries,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching production fees:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/production-fees/auto-generate
 * Pull data from Reg-A and create/update a daily entry
 */
router.post('/auto-generate', async (req, res) => {
    try {
        const { date } = req.body;
        if (!date) return res.status(400).json({ success: false, error: 'Date is required' });

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        // 1. Aggregate from Reg-A
        const productionData = await aggregateRegAProduction(targetDate);
        if (!productionData) {
            return res.status(404).json({ success: false, error: 'No production data found in Reg-A for this date' });
        }

        // 2. Calculate BL and Fees
        const totalProductionBl = calculateBlFromCounts(productionData);
        const feesDebited = totalProductionBl * 3.0;

        // 3. Get Previous Day Closing Balance for Opening
        const prevDate = new Date(targetDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevEntry = await prisma.productionFeeEntry.findUnique({
            where: { date: prevDate }
        });
        const openingBalance = prevEntry ? prevEntry.closingBalance : 0;

        // 4. Upsert the Register Entry
        const entry = await prisma.productionFeeEntry.upsert({
            where: { date: targetDate },
            update: {
                ...productionData,
                totalProductionBl,
                feesDebited,
                openingBalance,
                totalCredited: openingBalance + (prevEntry?.depositAmount || 0), // Note: Deposits should stay as they were if updating
                closingBalance: (openingBalance + (prevEntry?.depositAmount || 0)) - feesDebited
            },
            create: {
                date: targetDate,
                ...productionData,
                totalProductionBl,
                feesDebited,
                openingBalance,
                depositAmount: 0,
                totalCredited: openingBalance,
                closingBalance: openingBalance - feesDebited,
                createdBy: req.user.id
            }
        });

        res.json({ success: true, message: 'Production fee entry generated/updated successfully', data: entry });
    } catch (error) {
        console.error('Error generating production fees:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/production-fees/ledger
 * Create or Update a manual entry (e.g. to record a deposit)
 */
router.post('/ledger', async (req, res) => {
    try {
        const {
            date, openingBalance, depositAmount, challanNo, challanDate,
            remarks, ...productionCounts
        } = req.body;

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        // Recalculate totals
        const totalProductionBl = calculateBlFromCounts(productionCounts);
        const feesDebited = totalProductionBl * 3.0;
        const totalCredited = (openingBalance || 0) + (depositAmount || 0);
        const closingBalance = totalCredited - feesDebited;

        const entry = await prisma.productionFeeEntry.upsert({
            where: { date: targetDate },
            update: {
                openingBalance, depositAmount, challanNo,
                challanDate: challanDate ? new Date(challanDate) : null,
                ...productionCounts,
                totalProductionBl, feesDebited, totalCredited, closingBalance,
                remarks
            },
            create: {
                date: targetDate,
                openingBalance, depositAmount, challanNo,
                challanDate: challanDate ? new Date(challanDate) : null,
                ...productionCounts,
                totalProductionBl, feesDebited, totalCredited, closingBalance,
                remarks,
                createdBy: req.user.id
            }
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE_OR_UPDATE_PRODUCTION_FEE',
                entityId: entry.id.toString(),
                entityType: 'ProductionFeeEntry',
                details: `Entry for ${date}: Credited ${totalCredited}, Debited ${feesDebited}`,
                userId: req.user.id
            }
        });

        res.json({ success: true, data: entry });
    } catch (error) {
        console.error('Error saving production fee entry:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/production-fees/summary
 * Summary for dashboard
 */
router.get('/summary', async (req, res) => {
    try {
        const totalEntries = await prisma.productionFeeEntry.count();
        const latestEntry = await prisma.productionFeeEntry.findFirst({
            orderBy: { date: 'desc' }
        });

        // Aggregate last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const thirtyDayStats = await prisma.productionFeeEntry.aggregate({
            where: { date: { gte: thirtyDaysAgo } },
            _sum: {
                feesDebited: true,
                depositAmount: true,
                totalProductionBl: true
            }
        });

        res.json({
            success: true,
            data: {
                totalEntries,
                currentBalance: latestEntry ? latestEntry.closingBalance : 0,
                lastEntryDate: latestEntry ? latestEntry.date : null,
                thirtyDayTotalFees: thirtyDayStats._sum.feesDebited || 0,
                thirtyDayTotalDeposits: thirtyDayStats._sum.depositAmount || 0,
                thirtyDayTotalProductionBl: thirtyDayStats._sum.totalProductionBl || 0
            }
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
