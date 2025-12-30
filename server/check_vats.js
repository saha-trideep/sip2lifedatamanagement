const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVats() {
    try {
        const vats = await prisma.vatMaster.findMany({
            orderBy: [{ vatType: 'desc' }, { vatCode: 'asc' }]
        });

        console.log(`\n✅ Found ${vats.length} vats in database:\n`);
        vats.forEach(v => {
            console.log(`  ${v.vatCode} - ${v.vatType} (${v.capacityBl} BL) - Status: ${v.status}`);
        });

        if (vats.length === 0) {
            console.log('\n❌ No vats found! Run seed_vats_master.js first.');
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkVats();
