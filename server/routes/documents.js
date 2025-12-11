const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Supabase (for Storage)
// If env vars are missing, this might throw, but we rely on .env being set now
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Configure Multer (Memory Storage so we can upload to Supabase directly)
const upload = multer({ storage: multer.memoryStorage() });

// Helper to get public URL
const getFileUrl = (path) => {
    if (!supabase) return ''; // Fallback?
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    return data.publicUrl;
}

// Debug: Check bucket
router.get('/check-bucket', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' });
    const { data, error } = await supabase.storage.listBuckets();
    res.json({ buckets: data, error, config: { url: supabaseUrl ? 'Set' : 'Missing', key: supabaseKey ? 'Set' : 'Missing' } });
});

// GET: List Documents
router.get('/', async (req, res) => {
    try {
        const { search, department, folderId, sort } = req.query;

        const where = {};
        if (department && department !== 'All') where.department = department;
        if (folderId && folderId !== 'All') {
            if (folderId === 'Unsorted') where.folderId = null;
            else where.folderId = parseInt(folderId);
        }
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { filename: { contains: search } }
            ];
        }

        let orderBy = { uploadedAt: 'desc' };
        if (sort === 'oldest') orderBy = { uploadedAt: 'asc' };
        if (sort === 'alpha_asc') orderBy = { title: 'asc' };

        const docs = await prisma.document.findMany({
            where,
            orderBy,
            include: { user: { select: { name: true } }, folder: true }
        });

        res.json(docs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch' });
    }
});

// POST: Upload to Supabase Storage
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        if (!supabase) return res.status(500).json({ error: 'Storage not configured' });

        const { title, description, department, folderId, userId } = req.body;
        // Simplify filename construction to ensure no invalid chars
        const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${Date.now()}_${safeName}`;

        // Upload to Supabase - Explicit Bucket Name
        const { data, error } = await supabase.storage
            .from('documents')
            .upload(filename, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) {
            console.error("Supabase Upload Error Object:", JSON.stringify(error, null, 2));
            return res.status(500).json({ error: 'Supabase Error: ' + error.message, details: error });
        }

        // console.log("Skipping Supabase Upload for Debugging...");
        // const filename = "debug_file.txt"; // Don't redeclare, reuse existing or logic

        // Save metadata to local SQLite DB (stores the Supabase Path/URL)
        const publicUrl = getFileUrl(filename);

        const doc = await prisma.document.create({
            data: {
                filename: req.file.originalname,
                path: publicUrl, // Storing the full URL for easy access
                type: req.file.originalname.split('.').pop(),
                title: title || req.file.originalname,
                description: description,
                department: department || 'General',
                folderId: folderId ? parseInt(folderId) : null,
                userId: parseInt(userId) || 1
            },
            include: { user: true }
        });

        res.json(doc);
    } catch (error) {
        console.error("Critical Upload Error:", error);
        res.status(500).json({ error: 'Database Save Failed: ' + error.message, details: error });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const doc = await prisma.document.findUnique({ where: { id: parseInt(id) } });
        if (!doc) return res.status(404).json({ error: 'Not found' });

        // Try to delete from Supabase (extract path from URL or if we stored filename?)
        // We stored full URL, so we need to extract the path.
        // URL format: https://.../storage/v1/object/public/documents/FILENAME
        const pathParts = doc.path.split('/documents/');
        if (pathParts.length > 1 && supabase) {
            const storagePath = pathParts[1];
            await supabase.storage.from('documents').remove([storagePath]);
        }

        await prisma.document.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Delete failed' });
    }
});

module.exports = router;
