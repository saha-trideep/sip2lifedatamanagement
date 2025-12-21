const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const brands = [
        { name: 'Imperial Blue', category: 'IMFL' },
        { name: 'Royal Stag', category: 'IMFL' },
        { name: 'MacDowell No. 1', category: 'IMFL' },
        { name: 'Officer Choice', category: 'IMFL' },
        { name: 'Old Monk', category: 'IMFL' },
    ];

    for (const brand of brands) {
        await prisma.brand.upsert({
            where: { name: brand.name },
            update: {},
            create: brand
        });
    }

    console.log('Brands seeded successfully');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
