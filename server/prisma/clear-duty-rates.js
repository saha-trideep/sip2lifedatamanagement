const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Clearing old duty rates...');

    // Delete all existing duty rates
    const deleted = await prisma.dutyRate.deleteMany({});
    console.log(`Deleted ${deleted.count} old duty rates`);

    console.log('Clearing complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
