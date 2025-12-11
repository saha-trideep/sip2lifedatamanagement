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

// Basic Health Check
app.get('/', (req, res) => {
    res.json({ message: 'SIP2LIFE Server is running' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
