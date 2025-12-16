const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();


// GET /api/audit-logs
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            action,
            userId,
            entityType,
            startDate,
            endDate
        } = req.query;

        const where = {};
        if (action) where.action = action;
        if (userId) where.userId = parseInt(userId);
        if (entityType) where.entityType = entityType;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: parseInt(limit)
        });

        const total = await prisma.auditLog.count({ where });

        res.json({
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Audit Log Fetch Error:", error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

module.exports = router;
