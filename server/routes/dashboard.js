const express = require('express');
const prisma = require('../utils/prisma');

const router = express.Router();

// GET: Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const documentCount = await prisma.document.count();
        const registerCount = await prisma.registerLink.count();

        // Get department-wise document counts with latest descriptions
        const departmentCounts = await prisma.document.groupBy({
            by: ['department'],
            _count: {
                id: true
            }
        });

        // For each department, get the latest document's description
        const departmentStats = await Promise.all(
            departmentCounts.map(async (dept) => {
                const latestDoc = await prisma.document.findFirst({
                    where: { department: dept.department },
                    orderBy: { uploadedAt: 'desc' },
                    select: { description: true }
                });

                return {
                    department: dept.department,
                    count: dept._count.id,
                    latestDescription: latestDoc?.description || null
                };
            })
        );

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
            departmentCounts: departmentStats,
            registerList: registers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

module.exports = router;
