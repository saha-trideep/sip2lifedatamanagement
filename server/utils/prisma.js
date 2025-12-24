const { PrismaClient } = require('@prisma/client');

// Singleton pattern for Prisma Client to avoid multiple instances
let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({
        log: ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient({
            log: ['query', 'error', 'warn'],
        });
    }
    prisma = global.prisma;
}

module.exports = prisma;
