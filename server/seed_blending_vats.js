const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const vats = [
        { vatCode: 'BRT-11', capacityBl: 10000 },
        { vatCode: 'BRT-12', capacityBl: 10000 },
        { vatCode: 'BRT-13', capacityBl: 10000 },
        { vatCode: 'BRT-14', capacityBl: 10000 },
        { vatCode: 'BRT-15', capacityBl: 5000 },
        { vatCode: 'BRT-16', capacityBl: 5000 },
        { vatCode: 'BRT-17', capacityBl: 2500 },
    ];

    for (const vat of vats) {
        await prisma.blendingVat.upsert({
            where: { vatCode: vat.vatCode },
            update: {},
            create: vat,
        });
    }

    console.log('Blending Vats seeded successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
