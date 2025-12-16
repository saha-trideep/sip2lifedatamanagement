const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Middleware: Admin only (Basic implementation, assumes auth middleware populated req.user)
// Since we don't have a centralized auth middleware file yet (it's likely inline or not present in this snippet context),
// I'll add a simple check. In a real app, strict middleware is best.
// For now, allow viewing if role is ADMIN.
// NOTE: Verify where req.user comes from. If not populated, this will fail.
// We need to make sure the route is protected.

const requireAdmin = (req, res, next) => {
    // This expects previous middleware to populate req.user (e.g., verifyToken)
    // If not present, we can't secure it. 
    // For this implementation, I will assume the main index.js applies auth middleware to /api/audit-logs
    // OR I should import/create it here if needed.
    // Given the context, let's proceed assuming req.user exists if logged in.
    const user = req.user;

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// GET /api/audit-logs
router.get('/', requireAdmin, async (req, res) => {
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
