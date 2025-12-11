const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET: Fetch all register links
router.get('/', async (req, res) => {
    try {
        const links = await prisma.registerLink.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } }
        });
        res.json(links);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch register links' });
    }
});

// POST: Add new register link
router.post('/', async (req, res) => {
    const { name, url } = req.body;
    const userId = 1; // Default admin for now

    try {
        const newLink = await prisma.registerLink.create({
            data: {
                name,
                url,
                userId
            }
        });
        res.json(newLink);
    } catch (error) {
        console.error("Error creating link:", error);
        res.status(500).json({ error: 'Failed to create link', details: error.message });
    }
});

// DELETE: Remove a link
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.registerLink.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

module.exports = router;
