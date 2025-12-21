const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reg74/status
router.get('/status', verifyToken, async (req, res) => {
    try {
        const vats = await prisma.blendingVat.findMany();

        const vatStatus = await Promise.all(vats.map(async (vat) => {
            // Get latest closing or opening as base
            const [lastClosing, lastOpening] = await Promise.all([
                prisma.reg74ClosingSnapshot.findFirst({ where: { vatId: vat.id }, orderBy: { dateTime: 'desc' } }),
                prisma.reg74OpeningSnapshot.findFirst({ where: { vatId: vat.id }, orderBy: { dateTime: 'desc' } })
            ]);

            let balanceBl = 0;
            let balanceAl = 0;
            let lastEventDate = new Date(0);

            if (lastClosing && (!lastOpening || lastClosing.dateTime > lastOpening.dateTime)) {
                balanceBl = lastClosing.finalVolumeBl;
                balanceAl = lastClosing.finalQtyAl;
                lastEventDate = lastClosing.dateTime;
            } else if (lastOpening) {
                balanceBl = lastOpening.volumeBl;
                balanceAl = lastOpening.volumeAl;
                lastEventDate = lastOpening.dateTime;
            }

            // Add receipts and adjustments since last snapshot
            const [receipts, adjustments, issues] = await Promise.all([
                prisma.reg74ReceiptMfm1.findMany({ where: { vatId: vat.id, dateTime: { gt: lastEventDate } } }),
                prisma.reg74Adjustment.findMany({ where: { vatId: vat.id, dateTime: { gt: lastEventDate } } }),
                prisma.reg74IssueMfm2.findMany({ where: { vatId: vat.id, dateTime: { gt: lastEventDate } } })
            ]);

            receipts.forEach(r => { balanceBl += r.qtyBl; balanceAl += r.qtyAl; });
            adjustments.forEach(a => {
                if (a.adjustmentType === 'INCREASE') {
                    balanceBl += a.qtyBl; balanceAl += a.qtyAl;
                } else {
                    balanceBl -= a.qtyBl; balanceAl -= a.qtyAl;
                }
            });
            issues.forEach(i => { balanceBl -= i.qtyBl; balanceAl -= i.qtyAl; });

            return {
                ...vat,
                balanceBl: Math.max(0, balanceBl),
                balanceAl: Math.max(0, balanceAl)
            };
        }));

        res.json(vatStatus);
    } catch (error) {
        res.status(500).json({ error: 'Failed to calculate vat status' });
    }
});

// GET /api/reg74/vats
router.get('/vats', verifyToken, async (req, res) => {
    try {
        const vats = await prisma.blendingVat.findMany({
            orderBy: { vatCode: 'asc' }
        });
        res.json(vats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch blending vats' });
    }
});

// POST /api/reg74/opening
router.post('/opening', verifyToken, async (req, res) => {
    const data = req.body;
    try {
        const snapshot = await prisma.reg74OpeningSnapshot.create({
            data: {
                dateTime: new Date(data.dateTime),
                vatId: parseInt(data.vatId),
                dipCm: parseFloat(data.dipCm),
                temperatureC: parseFloat(data.temperatureC),
                alcoholmeterIndication: parseFloat(data.alcoholmeterIndication),
                strengthVv: parseFloat(data.strengthVv),
                volumeBl: parseFloat(data.volumeBl),
                volumeAl: parseFloat(data.volumeAl),
                rltDipCm: parseFloat(data.rltDipCm),
                rltVolumeBl: parseFloat(data.rltVolumeBl),
                createdBy: req.user.id
            }
        });
        await logAudit({
            userId: req.user.id,
            action: 'REG74_OPENING',
            entityType: 'REG74',
            entityId: snapshot.id,
            metadata: { snapshot }
        });
        res.json(snapshot);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create opening snapshot' });
    }
});

// POST /api/reg74/receipt
router.post('/receipt', verifyToken, async (req, res) => {
    const data = req.body;
    try {
        const receipt = await prisma.reg74ReceiptMfm1.create({
            data: {
                dateTime: new Date(data.dateTime),
                vatId: parseInt(data.vatId),
                sourceVat: data.sourceVat,
                qtyBl: parseFloat(data.qtyBl),
                avgStrengthVv: parseFloat(data.avgStrengthVv),
                qtyAl: parseFloat(data.qtyAl),
                avgDensity: parseFloat(data.avgDensity),
                linkedReg76Id: data.linkedReg76Id ? parseInt(data.linkedReg76Id) : null,
                createdBy: req.user.id
            }
        });
        await logAudit({
            userId: req.user.id,
            action: 'REG74_RECEIPT',
            entityType: 'REG74',
            entityId: receipt.id,
            metadata: { receipt }
        });
        res.json(receipt);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create receipt record' });
    }
});

// POST /api/reg74/adjustment
router.post('/adjustment', verifyToken, async (req, res) => {
    const data = req.body;
    try {
        const adjustment = await prisma.reg74Adjustment.create({
            data: {
                dateTime: new Date(data.dateTime),
                vatId: parseInt(data.vatId),
                adjustmentType: data.adjustmentType,
                reason: data.reason,
                qtyBl: parseFloat(data.qtyBl),
                qtyAl: parseFloat(data.qtyAl),
                rltDipCm: data.rltDipCm ? parseFloat(data.rltDipCm) : null,
                rltVolumeBl: data.rltVolumeBl ? parseFloat(data.rltVolumeBl) : null,
                createdBy: req.user.id
            }
        });
        await logAudit({
            userId: req.user.id,
            action: 'REG74_ADJUSTMENT',
            entityType: 'REG74',
            entityId: adjustment.id,
            metadata: { adjustment }
        });
        res.json(adjustment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create adjustment record' });
    }
});

// POST /api/reg74/qc-clearance
router.post('/qc-clearance', verifyToken, async (req, res) => {
    const data = req.body;
    try {
        const qc = await prisma.reg74QCClearance.create({
            data: {
                qcDateTime: new Date(data.qcDateTime),
                vatId: parseInt(data.vatId),
                finalStrengthVv: parseFloat(data.finalStrengthVv),
                approvedBy: data.approvedBy,
                remarks: data.remarks,
                createdBy: req.user.id
            }
        });
        // Update vat status if needed
        await prisma.blendingVat.update({
            where: { id: parseInt(data.vatId) },
            data: { status: 'READY' }
        });
        await logAudit({
            userId: req.user.id,
            action: 'REG74_QC',
            entityType: 'REG74',
            entityId: qc.id,
            metadata: { qc }
        });
        res.json(qc);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create QC record' });
    }
});

// POST /api/reg74/issue
router.post('/issue', verifyToken, async (req, res) => {
    const data = req.body;
    try {
        // Check for QC clearance before issue
        const lastQC = await prisma.reg74QCClearance.findFirst({
            where: { vatId: parseInt(data.vatId) },
            orderBy: { qcDateTime: 'desc' }
        });

        if (!lastQC) {
            return res.status(400).json({ error: 'QC Clearance required before issue' });
        }

        const issue = await prisma.reg74IssueMfm2.create({
            data: {
                dateTime: new Date(data.dateTime),
                vatId: parseInt(data.vatId),
                destination: data.destination,
                qtyBl: parseFloat(data.qtyBl),
                avgDensity: parseFloat(data.avgDensity),
                strengthVv: parseFloat(data.strengthVv),
                qtyAl: parseFloat(data.qtyAl),
                deadStockAl: parseFloat(data.deadStockAl),
                createdBy: req.user.id
            }
        });
        await logAudit({
            userId: req.user.id,
            action: 'REG74_ISSUE',
            entityType: 'REG74',
            entityId: issue.id,
            metadata: { issue }
        });
        res.json(issue);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create issue record' });
    }
});

// POST /api/reg74/closing
router.post('/closing', verifyToken, async (req, res) => {
    const data = req.body;
    try {
        const snapshot = await prisma.reg74ClosingSnapshot.create({
            data: {
                dateTime: new Date(data.dateTime),
                vatId: parseInt(data.vatId),
                finalDipCm: parseFloat(data.finalDipCm),
                finalVolumeBl: parseFloat(data.finalVolumeBl),
                finalStrengthVv: parseFloat(data.finalStrengthVv),
                finalQtyAl: parseFloat(data.finalQtyAl),
                remarks: data.remarks,
                createdBy: req.user.id
            }
        });
        await logAudit({
            userId: req.user.id,
            action: 'REG74_CLOSING',
            entityType: 'REG74',
            entityId: snapshot.id,
            metadata: { snapshot }
        });
        res.json(snapshot);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create closing snapshot' });
    }
});

// GET /api/reg74/generate
router.get('/generate', verifyToken, async (req, res) => {
    const { vatId, startDate, endDate } = req.query;
    if (!vatId) return res.status(400).json({ error: 'vatId is required' });

    try {
        const whereVat = { vatId: parseInt(vatId) };
        if (startDate && endDate) {
            whereVat.dateTime = { gte: new Date(startDate), lte: new Date(endDate) };
        }

        // Fetch all events for this VAT
        const [openings, receipts, adjustments, qcs, issues, closings] = await Promise.all([
            prisma.reg74OpeningSnapshot.findMany({ where: whereVat, orderBy: { dateTime: 'asc' } }),
            prisma.reg74ReceiptMfm1.findMany({ where: whereVat, orderBy: { dateTime: 'asc' } }),
            prisma.reg74Adjustment.findMany({ where: whereVat, orderBy: { dateTime: 'asc' } }),
            prisma.reg74QCClearance.findMany({ where: { vatId: parseInt(vatId), qcDateTime: whereVat.dateTime }, orderBy: { qcDateTime: 'asc' } }),
            prisma.reg74IssueMfm2.findMany({ where: whereVat, orderBy: { dateTime: 'asc' } }),
            prisma.reg74ClosingSnapshot.findMany({ where: whereVat, orderBy: { dateTime: 'asc' } })
        ]);

        // Merge and sort events by time
        const events = [
            ...openings.map(e => ({ ...e, type: 'OPENING' })),
            ...receipts.map(e => ({ ...e, type: 'RECEIPT' })),
            ...adjustments.map(e => ({ ...e, type: 'ADJUSTMENT' })),
            ...qcs.map(e => ({ ...e, type: 'QC', dateTime: e.qcDateTime })),
            ...issues.map(e => ({ ...e, type: 'ISSUE' })),
            ...closings.map(e => ({ ...e, type: 'CLOSING' }))
        ].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate register' });
    }
});

module.exports = router;
