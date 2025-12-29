const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./utils/prisma');
const path = require('path');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const registerRoutes = require('./routes/registers');
const dashboardRoutes = require('./routes/dashboard');

dotenv.config();

const app = express();
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
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/admin/invites', require('./routes/invites'));
app.use('/api/excise', require('./routes/excise'));
app.use('/api/reg74', require('./routes/reg74'));
app.use('/api/rega', require('./routes/regA'));
app.use('/api/reg78', require('./routes/reg78'));
app.use('/api/registers/reg76', require('./routes/reg76')); // Reg-76 Spirit Receipt Register
app.use('/api/registers/regb', require('./routes/regB')); // Reg-B Issue of Country Liquor
app.use('/api/excise-duty', require('./routes/exciseDuty')); // Phase 3: Excise Duty Register

// Database Initialization Endpoint (for production without shell access)
let dbInitialized = false;
app.get('/api/init-db', async (req, res) => {
    if (dbInitialized) {
        return res.json({ message: 'Database already initialized' });
    }

    try {
        const bcrypt = require('bcryptjs');

        // Step 1: Create tables using raw SQL (one at a time)
        console.log('Creating database tables...');
        try {
            // Create User table first
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "User" (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    name TEXT,
                    role TEXT DEFAULT 'EMPLOYEE',
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create Folder table
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "Folder" (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    department TEXT,
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    "userId" INTEGER NOT NULL REFERENCES "User"(id)
                );
            `);

            // Create Document table
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "Document" (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    path TEXT NOT NULL,
                    type TEXT NOT NULL,
                    description TEXT,
                    department TEXT NOT NULL,
                    "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    "userId" INTEGER NOT NULL REFERENCES "User"(id),
                    "folderId" INTEGER REFERENCES "Folder"(id)
                );
            `);

            // Create RegisterLink table
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "RegisterLink" (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    url TEXT NOT NULL,
                    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    "userId" INTEGER NOT NULL REFERENCES "User"(id)
                );
            `);

            console.log('Tables created successfully');
        } catch (dbError) {
            console.error('Table Creation Error:', dbError);
            return res.status(500).json({
                error: 'Failed to create tables',
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
