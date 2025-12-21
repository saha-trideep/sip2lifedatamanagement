const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reg74/vats
router.get('/vats', verifyToken, async (req, res) => {
    try {
        const vats = await prisma.vatMaster.findMany({
            orderBy: [{ vatType: 'desc' }, { vatCode: 'asc' }]
        });
        res.json(vats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vats' });
    }
});

// POST /api/reg74/event
router.post('/event', verifyToken, async (req, res) => {
    const {
        vatId, eventDateTime, eventType,
        openingData, receiptData, issueData,
        adjustmentData, productionData, closingData,
        remarks
    } = req.body;

    try {
        const event = await prisma.reg74Event.create({
            data: {
                vatId: parseInt(vatId),
                eventDateTime: new Date(eventDateTime),
                eventType,
                openingData: openingData || null,
                receiptData: receiptData || null,
                issueData: issueData || null,
                adjustmentData: adjustmentData || null,
                productionData: productionData || null,
                closingData: closingData || null,
                remarks,
                createdBy: req.user.id
            },
            include: { vat: true }
        });

        // Update VAT status based on event
        let newStatus = event.vat.status;
        if (eventType === 'UNLOADING' || eventType === 'RECEIPT') newStatus = 'FILLING';
        if (eventType === 'BLENDING') newStatus = 'BLENDING';
        if (eventType === 'PRODUCTION') newStatus = 'EMPTYING';
        if (eventType === 'CLOSING') newStatus = 'IDLE';

        await prisma.vatMaster.update({
            where: { id: parseInt(vatId) },
            data: { status: newStatus }
        });

        await logAudit({
            userId: req.user.id,
            action: `REG74_${eventType}`,
            entityType: 'REG74',
            entityId: event.id,
            metadata: { event }
        });

        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save event' });
    }
});

// GET /api/reg74/generate
router.get('/generate', verifyToken, async (req, res) => {
    const { vatId, startDate, endDate } = req.query;
    if (!vatId) return res.status(400).json({ error: 'vatId is required' });

    try {
        const where = { vatId: parseInt(vatId) };
        if (startDate && endDate) {
            where.eventDateTime = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const events = await prisma.reg74Event.findMany({
            where,
            orderBy: { eventDateTime: 'asc' },
            include: { user: { select: { name: true } } }
        });

        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate register' });
    }
});

// GET /api/reg74/status
router.get('/status', verifyToken, async (req, res) => {
    try {
        const vats = await prisma.vatMaster.findMany({
            orderBy: [{ vatType: 'desc' }, { vatCode: 'asc' }]
        });

        const vatStatus = await Promise.all(vats.map(async (vat) => {
            // Find latest closing or opening
            const lastSnapshot = await prisma.reg74Event.findFirst({
                where: {
                    vatId: vat.id,
                    eventType: { in: ['OPENING', 'CLOSING'] }
                },
                orderBy: { eventDateTime: 'desc' }
            });

            let balanceBl = 0;
            let balanceAl = 0;
            let sinceDate = new Date(0);

            if (lastSnapshot) {
                const data = lastSnapshot.eventType === 'OPENING' ? lastSnapshot.openingData : lastSnapshot.closingData;
                balanceBl = data.volumeBl || data.finalBl || 0;
                balanceAl = data.volumeAl || data.finalAl || 0;
                sinceDate = lastSnapshot.eventDateTime;
            }

            const eventsSince = await prisma.reg74Event.findMany({
                where: {
                    vatId: vat.id,
                    eventDateTime: { gt: sinceDate }
                }
            });

            eventsSince.forEach(e => {
                if (e.receiptData) {
                    balanceBl += e.receiptData.qtyBl || 0;
                    balanceAl += e.receiptData.qtyAl || 0;
                }
                if (e.issueData) {
                    balanceBl -= e.issueData.qtyBl || 0;
                    // Note: AL column handled in calculation logic, but for simple balance:
                    balanceAl -= (e.issueData.qtyBl * (e.issueData.strength / 100)) || 0;
                }
                if (e.adjustmentData) {
                    if (e.adjustmentData.type === 'INCREASE') {
                        balanceBl += e.adjustmentData.qtyBl || 0;
                        balanceAl += e.adjustmentData.qtyAl || 0;
                    } else {
                        balanceBl -= e.adjustmentData.qtyBl || 0;
                        balanceAl -= e.adjustmentData.qtyAl || 0;
                    }
                }
                if (e.productionData) {
                    balanceBl -= e.productionData.mfmBl || 0;
                    balanceAl -= e.productionData.mfmAl || 0;
                }
            });

            return {
                ...vat,
                balanceBl: Math.max(0, balanceBl),
                balanceAl: Math.max(0, balanceAl)
            };
        }));

        res.json(vatStatus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to calculate status' });
    }
});

module.exports = router;
