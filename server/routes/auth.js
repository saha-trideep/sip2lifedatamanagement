const express = require('express');
const bcrypt = require('bcryptjs'); // Need to install this, used bcryptjs for ease
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || 'secret';

// Register (Seed/Admin use mostly)
router.post('/register', async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name, role },
        });
        res.json({ message: 'User created successfully', user: { id: user.id, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
});

const { logAudit } = require('../utils/auditLogger');
// ... imports

// Login - Optimized for performance
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Select only necessary fields to reduce query overhead
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                name: true,
                role: true
            }
        });

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1d' });

        // Non-blocking audit log - fire and forget
        logAudit({
            userId: user.id,
            action: 'LOGIN',
            entityType: 'AUTH',
            metadata: { email: user.email }
        });

        // Send response immediately without waiting for audit log
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// GET /api/auth/validate-invite - Validate invite token
router.get('/validate-invite', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        // Hash the token to find it in DB
        const crypto = require('crypto');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const invite = await prisma.userInvite.findUnique({
            where: { tokenHash }
        });

        if (!invite) {
            return res.status(404).json({ error: 'Invalid invite token' });
        }

        if (invite.usedAt) {
            return res.status(400).json({ error: 'This invite has already been used' });
        }

        if (new Date() > invite.expiresAt) {
            return res.status(400).json({ error: 'This invite has expired' });
        }

        // Return invite details (without sensitive data)
        res.json({
            email: invite.email,
            name: invite.name,
            role: invite.role
        });

    } catch (error) {
        console.error('Validate invite error:', error);
        res.status(500).json({ error: 'Failed to validate invite' });
    }
});

// POST /api/auth/complete-registration - Complete registration with invite token
router.post('/complete-registration', async (req, res) => {
    try {
        const { token, password, name } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }

        // Hash the token to find it in DB
        const crypto = require('crypto');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const invite = await prisma.userInvite.findUnique({
            where: { tokenHash }
        });

        if (!invite) {
            return res.status(404).json({ error: 'Invalid invite token' });
        }

        if (invite.usedAt) {
            return res.status(400).json({ error: 'This invite has already been used' });
        }

        if (new Date() > invite.expiresAt) {
            return res.status(400).json({ error: 'This invite has expired' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: invite.email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email: invite.email,
                password: hashedPassword,
                name: name || invite.name,
                role: invite.role
            }
        });

        // Mark invite as used
        await prisma.userInvite.update({
            where: { id: invite.id },
            data: { usedAt: new Date() }
        });

        // Audit logs
        await logAudit({
            userId: user.id,
            action: 'USER_REGISTERED',
            entityType: 'AUTH',
            metadata: { email: user.email, role: user.role }
        });

        await logAudit({
            userId: invite.invitedById,
            action: 'INVITE_ACCEPTED',
            entityType: 'USER_INVITE',
            entityId: invite.id,
            metadata: { email: invite.email }
        });

        res.json({
            message: 'Registration completed successfully',
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });

    } catch (error) {
        console.error('Complete registration error:', error);
        res.status(500).json({ error: 'Failed to complete registration' });
    }
});

module.exports = router;
