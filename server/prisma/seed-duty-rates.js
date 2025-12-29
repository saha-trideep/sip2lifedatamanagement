const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding initial duty rates...');

    const rates = [
        {
            category: 'IMFL',
            ratePerAl: 150.00,
            effectiveFrom: new Date('2024-04-01'),
            remarks: 'Standard Rate 2024'
        },
        {
            category: 'Beer',
            ratePerAl: 50.00,
            effectiveFrom: new Date('2024-04-01'),
            remarks: 'Standard Rate 2024'
        },
        {
            category: 'Wine',
            ratePerAl: 80.00,
            effectiveFrom: new Date('2024-04-01'),
            remarks: 'Standard Rate 2024'
        },
        {
            category: 'CL',
            ratePerAl: 30.00,
            effectiveFrom: new Date('2024-04-01'),
            remarks: 'Standard Rate 2024'
        }
    ];

    for (const rate of rates) {
        await prisma.dutyRate.upsert({
            where: { id: 0 }, // This is a trick to always create or we can use createMany
            // Better to check by category and effectiveFrom
            create: rate,
            update: rate,
            // But DutyRate doesn't have a unique constraint on category yet in the draft
            // Let's just use create or check first.
        });
    }

    // Robust seeding: check if they exist
    for (const rate of rates) {
        const existing = await prisma.dutyRate.findFirst({
            where: {
                category: rate.category,
                effectiveFrom: rate.effectiveFrom
            }
        });

        if (!existing) {
            await prisma.dutyRate.create({ data: rate });
            console.log(`Created rate for ${rate.category}`);
        } else {
            console.log(`Rate for ${rate.category} already exists`);
        }
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
