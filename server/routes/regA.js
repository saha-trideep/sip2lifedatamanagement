const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');
const { format } = require('date-fns');

// Get all Reg-A entries
router.get('/entries', verifyToken, async (req, res) => {
    try {
        const entries = await prisma.regAEntry.findMany({
            include: {
                batch: {
                    include: {
                        brand: true,
                        vat: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create or update Reg-A entry (Handled primarily by internal sync or manual bottling update)
router.post('/entry', verifyToken, async (req, res) => {
    const { id, batchId, ...data } = req.body;
    try {
        if (id) {
            const updated = await prisma.regAEntry.update({
                where: { id: parseInt(id) },
                data: data
            });
            return res.json(updated);
        } else {
            const created = await prisma.regAEntry.create({
                data: {
                    ...data,
                    batchId: parseInt(batchId)
                }
            });
            return res.status(201).json(created);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// SYNC Reg-A Data from Reg-74 Events
router.get('/sync/:batchId', verifyToken, async (req, res) => {
    const batchId = parseInt(req.params.batchId);
    try {
        const events = await prisma.reg74Event.findMany({
            where: { batchId },
            orderBy: { eventDateTime: 'asc' }
        });

        const batch = await prisma.batchMaster.findUnique({
            where: { id: batchId },
            include: { vat: true }
        });

        if (!batch) return res.status(404).json({ error: "Batch not found" });

        // Logic to map events to Reg-A columns
        let syncData = {
            batchId,
            receiptFromVat: '',
            receiptStrength: 0,
            receiptBl: 0,
            receiptAl: 0,
            blendingToVat: batch.vat.vatCode,
            blendingStrength: 0,
            blendingBl: 0,
            blendingAl: 0,
            mfmDensity: 0,
            mfmTemp: 0,
            mfmStrength: 0,
            mfmTotalBl: 0,
            mfmTotalAl: 0,
            batchNoDate: `${batch.baseBatchNo} (${format(new Date(batch.startDate), 'dd-MM-yy')})`,
            productionDate: null
        };

        events.forEach(e => {
            // Receipt Phase (Internal Transfer to this VAT for this batch)
            if (e.eventType === 'INTERNAL_TRANSFER' && e.receiptData) {
                syncData.receiptFromVat = e.receiptData.source || '';
                syncData.receiptStrength = e.receiptData.strength || 0;
                syncData.receiptBl += e.receiptData.qtyBl || 0;
                syncData.receiptAl += e.receiptData.qtyAl || (e.receiptData.qtyBl * e.receiptData.strength / 100);
            }

            // Blending Phase
            if (e.eventType === 'BLENDING' && e.productionData) {
                syncData.blendingStrength = e.productionData.strength || 0;
                syncData.blendingBl = e.productionData.rltBl || 0;
                syncData.blendingAl = e.productionData.rltAl || (e.productionData.rltBl * e.productionData.strength / 100);
                syncData.totalBatchBl = syncData.blendingBl;
                syncData.totalBatchAl = syncData.blendingAl;
            }

            // Production Phase (MFM)
            if (e.eventType === 'PRODUCTION' && e.productionData) {
                syncData.productionDate = e.eventDateTime;
                syncData.mfmDensity = e.productionData.density || 0;
                syncData.mfmTemp = 0; // Temp not in schema yet but in image
                syncData.mfmStrength = e.productionData.mfmStrength || e.productionData.strength || 0;
                syncData.mfmTotalBl += e.productionData.mfmBl || 0;
                syncData.mfmTotalAl += e.productionData.mfmAl || (e.productionData.mfmBl * (e.productionData.mfmStrength || e.productionData.strength) / 100);
            }
        });

        // Upsert RegAEntry
        const existing = await prisma.regAEntry.findFirst({ where: { batchId } });
        let result;
        if (existing) {
            result = await prisma.regAEntry.update({
                where: { id: existing.id },
                data: syncData
            });
        } else {
            result = await prisma.regAEntry.create({
                data: syncData
            });
        }

        res.json({ message: "Sync successful", entry: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
