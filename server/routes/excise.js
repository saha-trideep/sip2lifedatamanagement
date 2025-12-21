const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/excise/vats
router.get('/vats', async (req, res) => {
    try {
        const vats = await prisma.vat.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(vats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vats' });
    }
});

// GET /api/excise/reg76
router.get('/reg76', async (req, res) => {
    const { startDate, endDate, vat, spiritType, search } = req.query;

    let where = {};
    if (startDate && endDate) {
        where.receiptDate = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    } else if (startDate) {
        where.receiptDate = { gte: new Date(startDate) };
    } else if (endDate) {
        where.receiptDate = { lte: new Date(endDate) };
    }

    if (vat) where.storageVat = vat;
    if (spiritType) where.natureOfSpirit = spiritType;
    if (search) {
        where.OR = [
            { permitNo: { contains: search, mode: 'insensitive' } },
            { vehicleNo: { contains: search, mode: 'insensitive' } },
            { exportingDistillery: { contains: search, mode: 'insensitive' } },
            { invoiceNo: { contains: search, mode: 'insensitive' } }
        ];
    }

    try {
        const entries = await prisma.reg76Entry.findMany({
            where,
            orderBy: { receiptDate: 'desc' },
            include: { user: { select: { name: true } } }
        });
        res.json(entries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch reg76 entries' });
    }
});

// POST /api/excise/reg76
router.post('/reg76', verifyToken, async (req, res) => {
    const data = req.body;

    // Server-side validation and calculation
    const receivedMass = data.ladenWeightKg - data.unladenWeightKg;
    const receivedBl = data.avgDensity > 0 ? (receivedMass / data.avgDensity) : 0;
    const receivedAl = (receivedBl * data.receivedStrength) / 100;
    const transitWastageBl = data.advisedBl - receivedBl;
    const transitWastageAl = data.advisedAl - receivedAl;

    try {
        const entry = await prisma.reg76Entry.create({
            data: {
                receiptDate: new Date(data.receiptDate),
                arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
                permitNo: data.permitNo,
                permitDate: data.permitDate ? new Date(data.permitDate) : null,
                exportingDistillery: data.exportingDistillery,
                invoiceNo: data.invoiceNo,
                invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
                vehicleNo: data.vehicleNo,
                tankerMakeModel: data.tankerMakeModel,
                natureOfSpirit: data.natureOfSpirit,
                storageVat: data.storageVat,
                advisedBl: parseFloat(data.advisedBl),
                advisedAl: parseFloat(data.advisedAl),
                advisedStrength: parseFloat(data.advisedStrength),
                advisedMassKg: parseFloat(data.advisedMassKg),
                ladenWeightKg: parseFloat(data.ladenWeightKg),
                unladenWeightKg: parseFloat(data.unladenWeightKg),
                avgDensity: parseFloat(data.avgDensity),
                avgTemperature: parseFloat(data.avgTemperature),
                receivedStrength: parseFloat(data.receivedStrength),
                remarks: data.remarks,
                receivedMass,
                receivedBl,
                receivedAl,
                transitWastageBl,
                transitWastageAl,
                createdBy: req.user.id
            }
        });

        await logAudit({
            userId: req.user.id,
            action: 'REG76_CREATE',
            entityType: 'REG76',
            entityId: entry.id,
            metadata: { entry }
        });

        res.json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create reg76 entry', details: error.message });
    }
});

// PUT /api/excise/reg76/:id (Admin only)
router.put('/reg76/:id', verifyToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { newData, reason } = req.body;

    if (!reason) {
        return res.status(400).json({ error: 'Reason for edit is mandatory' });
    }

    try {
        const oldEntry = await prisma.reg76Entry.findUnique({ where: { id: parseInt(id) } });
        if (!oldEntry) return res.status(404).json({ error: 'Entry not found' });

        // Merge and Recalculate
        const combined = { ...oldEntry, ...newData };
        const receivedMass = combined.ladenWeightKg - combined.unladenWeightKg;
        const receivedBl = combined.avgDensity > 0 ? (receivedMass / combined.avgDensity) : 0;
        const receivedAl = (receivedBl * combined.receivedStrength) / 100;
        const transitWastageBl = combined.advisedBl - receivedBl;
        const transitWastageAl = combined.advisedAl - receivedAl;

        // Prepare update data (handle dates specifically)
        const updateData = {};
        for (const key in newData) {
            if (key.endsWith('Date') && newData[key]) {
                updateData[key] = new Date(newData[key]);
            } else {
                updateData[key] = newData[key];
            }
        }

        const updatedEntry = await prisma.reg76Entry.update({
            where: { id: parseInt(id) },
            data: {
                ...updateData,
                receivedMass,
                receivedBl,
                receivedAl,
                transitWastageBl,
                transitWastageAl,
                updatedAt: new Date()
            }
        });

        await logAudit({
            userId: req.user.id,
            action: 'REG76_UPDATE',
            entityType: 'REG76',
            entityId: id,
            metadata: {
                reason,
                oldValues: oldEntry,
                newValues: newData
            }
        });

        res.json(updatedEntry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update entry', details: error.message });
    }
});

module.exports = router;
