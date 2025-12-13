const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET: Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const documentCount = await prisma.document.count();
        const registerCount = await prisma.registerLink.count();

        // Get department-wise document counts
        const departmentCounts = await prisma.document.groupBy({
            by: ['department'],
            _count: {
                id: true
            }
        });

        // Get all register names
        const registers = await prisma.registerLink.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10 // Show latest 10 registers
        });

        res.json({
            documents: documentCount,
            registers: registerCount,
            departmentCounts: departmentCounts.map(d => ({
                department: d.department,
                count: d._count.id
            })),
            registerList: registers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

module.exports = router;
