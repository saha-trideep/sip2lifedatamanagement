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

// GET /api/reg74/brands
router.get('/brands', verifyToken, async (req, res) => {
    try {
        const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
        res.json(brands);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
});

// POST /api/reg74/brands
router.post('/brands', verifyToken, async (req, res) => {
    try {
        const { name, category } = req.body;
        const brand = await prisma.brand.create({ data: { name, category } });
        res.json(brand);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create brand' });
    }
});

// GET /api/reg74/batches
router.get('/batches', verifyToken, async (req, res) => {
    const { status, vatId } = req.query;
    try {
        const where = {};
        if (status) where.status = status;
        if (vatId) where.vatId = parseInt(vatId);

        const batches = await prisma.batchMaster.findMany({
            where,
            include: { brand: true, vat: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(batches);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch batches' });
    }
});

// POST /api/reg74/batches
router.post('/batches', verifyToken, async (req, res) => {
    try {
        const { baseBatchNo, brandId, vatId, startDate, totalVolumeBl, totalVolumeAl } = req.body;
        const batch = await prisma.batchMaster.create({
            data: {
                baseBatchNo,
                brandId: parseInt(brandId),
                vatId: parseInt(vatId),
                startDate: new Date(startDate),
                totalVolumeBl: parseFloat(totalVolumeBl),
                totalVolumeAl: parseFloat(totalVolumeAl),
                status: 'OPEN'
            }
        });
        res.json(batch);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create batch' });
    }
});

// POST /api/reg74/event
router.post('/event', verifyToken, async (req, res) => {
    const {
        vatId, eventDateTime, eventType,
        openingData, receiptData, issueData,
        adjustmentData, productionData, closingData,
        remarks, batchId
    } = req.body;

    try {
        // Auto-calculate AL for snapshots if missing
        if (openingData && openingData.volumeBl && openingData.strength && !openingData.volumeAl) {
            openingData.volumeAl = (openingData.volumeBl * openingData.strength / 100);
        }
        if (closingData && closingData.finalBl && closingData.finalStrength && !closingData.finalAl) {
            closingData.finalAl = (closingData.finalBl * closingData.finalStrength / 100);
        }

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
                batchId: batchId ? parseInt(batchId) : null,
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
            action: `REG74_${eventType}_CREATE`,
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

// PUT /api/reg74/event/:id
router.put('/event/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const {
        eventDateTime, eventType,
        openingData, receiptData, issueData,
        adjustmentData, productionData, closingData,
        remarks, batchId
    } = req.body;

    try {
        // Auto-calculate AL for snapshots if missing
        if (openingData && openingData.volumeBl && openingData.strength && !openingData.volumeAl) {
            openingData.volumeAl = (openingData.volumeBl * openingData.strength / 100);
        }
        if (closingData && closingData.finalBl && closingData.finalStrength && !closingData.finalAl) {
            closingData.finalAl = (closingData.finalBl * closingData.finalStrength / 100);
        }

        const event = await prisma.reg74Event.update({
            where: { id: parseInt(id) },
            data: {
                eventDateTime: new Date(eventDateTime),
                eventType,
                openingData: openingData || null,
                receiptData: receiptData || null,
                issueData: issueData || null,
                adjustmentData: adjustmentData || null,
                productionData: productionData || null,
                closingData: closingData || null,
                batchId: batchId ? parseInt(batchId) : null,
                remarks
            }
        });

        await logAudit({
            userId: req.user.id,
            action: `REG74_${eventType}_UPDATE`,
            entityType: 'REG74',
            entityId: event.id,
            metadata: { event }
        });

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// DELETE /api/reg74/event/:id
router.delete('/event/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const event = await prisma.reg74Event.delete({
            where: { id: parseInt(id) }
        });

        await logAudit({
            userId: req.user.id,
            action: `REG74_EVENT_DELETE`,
            entityType: 'REG74',
            entityId: event.id,
            metadata: { event }
        });

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// GET /api/reg74/generate
router.get('/generate', verifyToken, async (req, res) => {
    const { vatId, startDate, endDate } = req.query;
    if (!vatId) return res.status(400).json({ error: 'vatId is required' });

    try {
        const where = { vatId: parseInt(vatId) };
        if (startDate && endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            where.eventDateTime = {
                gte: new Date(startDate),
                lte: end
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
                    const bl = parseFloat(e.receiptData.qtyBl) || 0;
                    const str = parseFloat(e.receiptData.strength) || 0;
                    balanceBl += bl;
                    balanceAl += (bl * str / 100);
                }
                if (e.issueData) {
                    const bl = parseFloat(e.issueData.qtyBl) || 0;
                    const str = parseFloat(e.issueData.strength) || 0;
                    balanceBl -= bl;
                    balanceAl -= (bl * str / 100);
                }
                if (e.adjustmentData) {
                    const bl = parseFloat(e.adjustmentData.qtyBl) || 0;
                    const str = parseFloat(e.adjustmentData.strength) || 0;
                    const al = parseFloat(e.adjustmentData.qtyAl) || (bl * str / 100);

                    if (e.adjustmentData.type === 'INCREASE') {
                        balanceBl += bl;
                        balanceAl += al;
                    } else {
                        balanceBl -= bl;
                        balanceAl -= al;
                    }
                }
                if (e.productionData) {
                    const bl = parseFloat(e.productionData.mfmBl) || 0;
                    const str = parseFloat(e.productionData.mfmStrength) || parseFloat(e.productionData.strength) || 0;
                    balanceBl -= bl;
                    balanceAl -= (bl * str / 100);
                }
            });

            return {
                ...vat,
                balanceBl: Math.round(balanceBl * 100) / 100,
                balanceAl: Math.round(balanceAl * 100) / 100
            };
        }));

        res.json(vatStatus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to calculate status' });
    }
});

module.exports = router;
