require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    console.log('--- Creating Admin User ---');

    try {
        // Check if admin exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@sip2life.com' }
        });

        if (existingAdmin) {
            console.log('✅ Admin user already exists:', existingAdmin);
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin', 10);
        const admin = await prisma.user.create({
            data: {
                email: 'admin@sip2life.com',
                password: hashedPassword,
                name: 'Admin User',
                role: 'ADMIN'
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@sip2life.com');
        console.log('Password: admin');
        console.log('User details:', admin);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
