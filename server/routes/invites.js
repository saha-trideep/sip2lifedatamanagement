const express = require('express');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();
const prisma = new PrismaClient();

// Generate secure random token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Hash token for storage
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/admin/invites - Create invite
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { email, name, role } = req.body;

        // Validate input
        if (!email || !role) {
            return res.status(400).json({ error: 'Email and role are required' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Check if there's a pending invite
        const pendingInvite = await prisma.userInvite.findFirst({
            where: {
                email,
                usedAt: null,
                expiresAt: { gt: new Date() }
            }
        });

        if (pendingInvite) {
            return res.status(400).json({ error: 'Pending invite already exists for this email' });
        }

        // Generate token
        const token = generateToken();
        const tokenHash = hashToken(token);

        // Set expiry (72 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 72);

        // Create invite
        const invite = await prisma.userInvite.create({
            data: {
                email,
                name,
                role,
                tokenHash,
                expiresAt,
                invitedById: req.user.id
            },
            include: {
                invitedBy: {
                    select: { name: true, email: true }
                }
            }
        });

        // Audit log
        await logAudit({
            userId: req.user.id,
            action: 'INVITE_CREATED',
            entityType: 'USER_INVITE',
            entityId: invite.id,
            metadata: { email, role }
        });

        // Generate invite URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const inviteUrl = `${frontendUrl}/register?token=${token}`;

        res.json({
            invite: {
                ...invite,
                tokenHash: undefined // Don't send hash to client
            },
            inviteUrl
        });

    } catch (error) {
        console.error('Create invite error:', error);
        res.status(500).json({ error: 'Failed to create invite' });
    }
});

// GET /api/admin/invites - List all invites
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const invites = await prisma.userInvite.findMany({
            include: {
                invitedBy: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Categorize invites
        const now = new Date();
        const categorized = {
            pending: invites.filter(i => !i.usedAt && i.expiresAt > now),
            accepted: invites.filter(i => i.usedAt),
            expired: invites.filter(i => !i.usedAt && i.expiresAt <= now)
        };

        res.json(categorized);

    } catch (error) {
        console.error('List invites error:', error);
        res.status(500).json({ error: 'Failed to fetch invites' });
    }
});

// DELETE /api/admin/invites/:id - Revoke invite
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const invite = await prisma.userInvite.findUnique({ where: { id } });

        if (!invite) {
            return res.status(404).json({ error: 'Invite not found' });
        }

        if (invite.usedAt) {
            return res.status(400).json({ error: 'Cannot revoke used invite' });
        }

        await prisma.userInvite.delete({ where: { id } });

        // Audit log
        await logAudit({
            userId: req.user.id,
            action: 'INVITE_REVOKED',
            entityType: 'USER_INVITE',
            entityId: id,
            metadata: { email: invite.email }
        });

        res.json({ message: 'Invite revoked successfully' });

    } catch (error) {
        console.error('Revoke invite error:', error);
        res.status(500).json({ error: 'Failed to revoke invite' });
    }
});

module.exports = router;
