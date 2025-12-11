const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/folders - List all folders (supports optional filtering by department)
router.get('/', async (req, res) => {
    const { department } = req.query;
    try {
        const where = {};
        if (department && department !== 'All') {
            where.department = department;
        }

        const folders = await prisma.folder.findMany({
            where,
            include: { user: { select: { name: true } }, _count: { select: { documents: true } } },
            orderBy: { name: 'asc' }
        });
        res.json(folders);
    } catch (error) {
        console.error("Error fetching folders:", error);
        res.status(500).json({ error: "Failed to fetch folders" });
    }
});

// POST /api/folders - Create new folder
router.post('/', async (req, res) => {
    const { name, department, userId } = req.body; // userId passed from frontend for now (in prod, use auth token)

    try {
        const folder = await prisma.folder.create({
            data: {
                name,
                department,
                userId: parseInt(userId) || 1 
            }
        });
        res.json(folder);
    } catch (error) {
        console.error("Error creating folder:", error);
        res.status(500).json({ error: "Failed to create folder" });
    }
});

// DELETE /api/folders/:id - Delete folder (and update documents to remove folder association or delete them?)
// Policy: Do not delete valid documents, just un-folder them or block delete if not empty.
// Let's allow delete and set documents' folderId to null.
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Unlink documents first
        await prisma.document.updateMany({
            where: { folderId: parseInt(id) },
            data: { folderId: null }
        });

        await prisma.folder.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: "Folder deleted" });
    } catch (error) {
        console.error("Delete failed:", error);
        res.status(500).json({ error: "Failed to delete folder" });
    }
});

module.exports = router;
