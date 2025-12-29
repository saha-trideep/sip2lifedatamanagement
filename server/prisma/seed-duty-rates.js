const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding initial duty rates...');

    // Strength-based duty rates for Country Liquor (IML)
    // Rates are per BL (Bulk Liter), not per AL
    const rates = [
        {
            category: 'CL',
            subcategory: '50° U.P.',
            ratePerAl: 50.00, // ₹50 per BL (field name kept for schema compatibility)
            effectiveFrom: new Date('2024-04-01'),
            remarks: '50° U.P. (28.5% v/v) - Standard Rate 2024'
        },
        {
            category: 'CL',
            subcategory: '60° U.P.',
            ratePerAl: 50.00, // ₹50 per BL
            effectiveFrom: new Date('2024-04-01'),
            remarks: '60° U.P. (22.8% v/v) - Standard Rate 2024'
        },
        {
            category: 'CL',
            subcategory: '70° U.P.',
            ratePerAl: 20.00, // ₹20 per BL
            effectiveFrom: new Date('2024-04-01'),
            remarks: '70° U.P. (17.1% v/v) - Standard Rate 2024'
        },
        {
            category: 'CL',
            subcategory: '80° U.P.',
            ratePerAl: 17.00, // ₹17 per BL
            effectiveFrom: new Date('2024-04-01'),
            remarks: '80° U.P. (11.4% v/v) - Standard Rate 2024'
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
                subcategory: rate.subcategory,
                effectiveFrom: rate.effectiveFrom
            }
        });

        if (!existing) {
            await prisma.dutyRate.create({ data: rate });
            console.log(`Created rate for ${rate.category} - ${rate.subcategory}`);
        } else {
            console.log(`Rate for ${rate.category} - ${rate.subcategory} already exists`);
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
