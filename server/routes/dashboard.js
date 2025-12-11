const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET: Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const documentCount = await prisma.document.count();
        const registerCount = await prisma.registerLink.count();

        res.json({
            documents: documentCount,
            registers: registerCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

module.exports = router;
