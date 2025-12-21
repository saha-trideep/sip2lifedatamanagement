const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');
const { format } = require('date-fns');

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

// CREATE a new planned entry
router.post('/plan', verifyToken, async (req, res) => {
    const { batchId } = req.body;
    try {
        const batch = await prisma.batchMaster.findUnique({
            where: { id: parseInt(batchId) },
            include: { vat: true }
        });

        if (!batch) return res.status(404).json({ error: "Batch not found" });

        const entry = await prisma.regAEntry.create({
            data: {
                batchId: batch.id,
                status: 'PLANNED',
                batchNoDate: `${batch.baseBatchNo} (${format(new Date(batch.startDate), 'dd MMM')})`
            }
        });
        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE Manual Declaration Data
router.put('/declaration/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const updateData = req.body; // Manual receipts, blending, bottling counts

    try {
        const entry = await prisma.regAEntry.update({
            where: { id: parseInt(id) },
            data: {
                ...updateData,
                status: 'ACTIVE'
            }
        });
        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// FINALIZE Batch (COMPLETED)
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

        // Final Calculations
        const bottledAl = entry.spiritBottledAl || 0;
        const mfmAl = entry.mfmTotalAl;
        const diffAl = mfmAl - bottledAl;
        const allowWastage = mfmAl * 0.01; // 1% Rule

        const finalized = await prisma.regAEntry.update({
            where: { id: parseInt(id) },
            data: {
                status: 'COMPLETED',
                verifiedBy: req.user.id,
                differenceFoundAl: diffAl,
                productionWastage: diffAl > 0 ? diffAl : 0,
                productionIncrease: diffAl < 0 ? Math.abs(diffAl) : 0,
                allowableWastage: allowWastage,
                chargeableWastage: (diffAl > allowWastage) ? (diffAl - allowWastage) : 0
            }
        });

        res.json({ message: "Batch production finalized and verified", entry: finalized });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
