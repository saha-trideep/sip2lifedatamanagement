const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');
const { format } = require('date-fns');
const {
    calculateAllRegAValues,
    analyzeRegAWastage,
    validateRegAEntry
} = require('../utils/regACalculations');
const { logAudit } = require('../utils/auditLogger');

// GET all Reg-A entries
router.get('/entries', verifyToken, async (req, res) => {
    try {
        const entries = await prisma.regAEntry.findMany({
            include: {
                batch: {
                    include: { brand: true, vat: true }
                },
                verifier: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE a new planned entry with auto-fetched details and session support
router.post('/plan', verifyToken, async (req, res) => {
    const { batchId, sessionNo = 1 } = req.body;
    try {
        const batch = await prisma.batchMaster.findUnique({
            where: { id: parseInt(batchId) },
            include: { vat: true, brand: true }
        });

        if (!batch) return res.status(404).json({ error: "Batch not found" });

        // Check if session already exists
        const existing = await prisma.regAEntry.findFirst({
            where: { batchId: batch.id, sessionNo: parseInt(sessionNo) }
        });
        if (existing) return res.status(400).json({ error: `Session ${sessionNo} for this batch already exists.` });

        const data = {
            batchId: batch.id,
            sessionNo: parseInt(sessionNo),
            status: 'PLANNED',
            batchNoDate: `${batch.baseBatchNo} (${format(new Date(), 'dd MMM')})`,
            productionDate: new Date(),
        };

        // Only fill Receipt/Blending pillars for Session 1
        if (parseInt(sessionNo) === 1) {
            data.receiptFromVat = batch.sourceVatCode || "SST";
            data.receiptStrength = batch.receiptStrength || null;
            data.receiptBl = batch.receiptBl || null;
            data.receiptAl = batch.receiptAl || null;

            data.blendingToVat = batch.vat.vatCode;
            data.blendingStrength = batch.totalVolumeBl && batch.totalVolumeAl ? (batch.totalVolumeAl / batch.totalVolumeBl * 100) : (batch.brand.category === 'IMFL' ? 42.8 : null);
            data.blendingBl = batch.totalVolumeBl || null;
            data.blendingAl = batch.totalVolumeAl || null;

            data.avgStrength = batch.brand.category === 'IMFL' ? 42.8 : null;
        }

        const entry = await prisma.regAEntry.create({ data });
        res.status(201).json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE Manual Declaration Data
router.put('/declaration/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const updateData = req.body; // Manual receipts, blending, bottling counts

    try {
        // Auto-calculate bottled BL/AL if counts are present
        const calculated = calculateAllRegAValues(updateData);

        const entry = await prisma.regAEntry.update({
            where: { id: parseInt(id) },
            data: {
                ...updateData,
                ...calculated,
                status: 'ACTIVE'
            }
        });

        await logAudit({
            userId: req.user.id,
            action: 'REGA_DECLARATION_UPDATE',
            entityType: 'REGA',
            entityId: id,
            metadata: { updateData, calculated }
        });

        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST Calculate Preview (Real-time feedback for UI)
router.post('/calculate', verifyToken, async (req, res) => {
    try {
        const results = calculateAllRegAValues(req.body);
        res.json(results);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// LINK Reg-74 MFM-II Data (System-Verified)
router.get('/link-mfm/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const entry = await prisma.regAEntry.findUnique({
            where: { id: parseInt(id) }
        });

        const events = await prisma.reg74Event.findMany({
            where: { batchId: entry.batchId, eventType: 'PRODUCTION' }
        });

        if (events.length === 0) {
            return res.status(404).json({ error: "No MFM-II production logs found in Reg-74 for this batch." });
        }

        // Aggregate MFM Data
        let mfmData = {
            mfmDensity: 0,
            mfmTemp: 0,
            mfmStrength: 0,
            mfmTotalBl: 0,
            mfmTotalAl: 0
        };

        events.forEach(e => {
            const prd = e.productionData;
            mfmData.mfmDensity = prd.density || mfmData.mfmDensity;
            mfmData.mfmStrength = prd.mfmStrength || prd.strength || mfmData.mfmStrength;
            mfmData.mfmTotalBl += prd.mfmBl || 0;
            mfmData.mfmTotalAl += prd.mfmAl || (prd.mfmBl * (prd.mfmStrength || prd.strength) / 100);
        });

        // Set average density/strength if multiple events
        if (events.length > 1) {
            const lastPrd = events[events.length - 1].productionData;
            mfmData.mfmDensity = lastPrd.density;
            mfmData.mfmStrength = lastPrd.mfmStrength || lastPrd.strength;
        }

        const updated = await prisma.regAEntry.update({
            where: { id: parseInt(id) },
            data: updatedData = {
                ...mfmData,
                productionDate: events[0].eventDateTime
            }
        });

        res.json({ message: "MFM-II data linked successfully", entry: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// FINALIZE Batch (COMPLETED) with 0.1% MFM Wastage Rule
router.post('/finalize/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const entry = await prisma.regAEntry.findUnique({
            where: { id: parseInt(id) }
        });

        if (!entry.mfmTotalAl) {
            return res.status(400).json({ error: "Cannot finalize without linked MFM-II data." });
        }

        if (req.user.role !== 'ADMIN' && req.user.role !== 'EXCISE') {
            return res.status(403).json({ error: "Only Admin or Excise roles can finalize production records." });
        }

        // Production Wastage Rule: 0.1% threshold for MFM vs Bottles
        const mfmAl = entry.mfmTotalAl;
        const bottledAl = entry.spiritBottledAl || 0;

        // Use centralized calculation utility
        const wastage = analyzeRegAWastage(mfmAl, bottledAl);

        const finalized = await prisma.regAEntry.update({
            where: { id: parseInt(id) },
            data: {
                status: 'COMPLETED',
                verifiedBy: req.user.id,
                differenceFoundAl: wastage.differenceFoundAl,
                productionWastage: wastage.productionWastage,
                productionIncrease: wastage.productionIncrease,
                allowableWastage: wastage.allowableWastage,
                chargeableWastage: wastage.chargeableWastage
            }
        });

        await logAudit({
            userId: req.user.id,
            action: 'REGA_FINALIZE',
            entityType: 'REGA',
            entityId: id,
            metadata: { wastage }
        });

        res.json({ message: "Production session finalized and verified", entry: finalized });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
