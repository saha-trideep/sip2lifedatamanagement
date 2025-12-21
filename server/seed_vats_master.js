const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const vats = [
        // SST Vats - 60,000 BL Capacity
        { vatCode: 'SST-5', vatType: 'SST', capacityBl: 60000 },
        { vatCode: 'SST-6', vatType: 'SST', capacityBl: 60000 },
        { vatCode: 'SST-7', vatType: 'SST', capacityBl: 60000 },
        { vatCode: 'SST-8', vatType: 'SST', capacityBl: 60000 },
        { vatCode: 'SST-9', vatType: 'SST', capacityBl: 60000 },
        { vatCode: 'SST-10', vatType: 'SST', capacityBl: 60000 },

        // BRT Vats - 25,000 BL Capacity
        { vatCode: 'BRT-11', vatType: 'BRT', capacityBl: 25000 },
        { vatCode: 'BRT-12', vatType: 'BRT', capacityBl: 25000 },
        { vatCode: 'BRT-13', vatType: 'BRT', capacityBl: 25000 },
        { vatCode: 'BRT-14', vatType: 'BRT', capacityBl: 25000 },
        { vatCode: 'BRT-15', vatType: 'BRT', capacityBl: 25000 },
        { vatCode: 'BRT-16', vatType: 'BRT', capacityBl: 25000 },
        { vatCode: 'BRT-17', vatType: 'BRT', capacityBl: 25000 },
    ];

    for (const vat of vats) {
        await prisma.vatMaster.upsert({
            where: { vatCode: vat.vatCode },
            update: { vatType: vat.vatType, capacityBl: vat.capacityBl },
            create: vat,
        });
    }

    console.log('VatMaster updated with SST (60k) and BRT (25k) capacities');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
