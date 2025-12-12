const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const registerRoutes = require('./routes/registers');
const dashboardRoutes = require('./routes/dashboard');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/folders', require('./routes/folders'));
app.use('/api/registers', registerRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Database Initialization Endpoint (for production without shell access)
let dbInitialized = false;
app.get('/api/init-db', async (req, res) => {
    if (dbInitialized) {
        return res.json({ message: 'Database already initialized' });
    }

    try {
        const bcrypt = require('bcryptjs');
        const { execSync } = require('child_process');

        // Step 1: Create tables using Prisma
        console.log('Creating database tables...');
        try {
            execSync('npx prisma db push --accept-data-loss --skip-generate', {
                cwd: __dirname,
                stdio: 'inherit'
            });
        } catch (dbError) {
            console.error('DB Push Error:', dbError);
            return res.status(500).json({
                error: 'Failed to create database tables',
                details: dbError.message
            });
        }

        // Step 2: Check if admin exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@sip2life.com' }
        });

        if (!existingAdmin) {
            // Create admin user
            const hashedPassword = await bcrypt.hash('admin', 10);
            await prisma.user.create({
                data: {
                    email: 'admin@sip2life.com',
                    password: hashedPassword,
                    name: 'Admin User',
                    role: 'ADMIN'
                }
            });
            dbInitialized = true;
            return res.json({
                message: 'Database initialized successfully! Tables created and admin user added.',
                admin: { email: 'admin@sip2life.com', password: 'admin' }
            });
        } else {
            dbInitialized = true;
            return res.json({ message: 'Database already initialized. Admin user exists.' });
        }
    } catch (error) {
        console.error('DB Init Error:', error);
        return res.status(500).json({ error: 'Failed to initialize database', details: error.message });
    }
});


// Basic Health Check
app.get('/', (req, res) => {
    res.json({ message: 'SIP2LIFE Server is running' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
