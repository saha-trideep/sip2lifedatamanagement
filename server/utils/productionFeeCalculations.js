const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculate Bulk Liters (BL) from bottle counts based on size and strength
 * Factors are: (Count * Volume_ML) / 1000
 */
function calculateBlFromCounts(entry) {
    let totalBl = 0;

    // 50 UP
    totalBl += (entry.count50_750 * 0.75) + (entry.count50_500 * 0.5) + (entry.count50_375 * 0.375) + (entry.count50_300 * 0.3) + (entry.count50_180 * 0.18);
    // 60 UP
    totalBl += (entry.count60_600 * 0.6) + (entry.count60_500 * 0.5) + (entry.count60_375 * 0.375) + (entry.count60_300 * 0.3) + (entry.count60_180 * 0.18);
    // 70 UP
    totalBl += (entry.count70_300 * 0.3);
    // 80 UP
    totalBl += (entry.count80_600 * 0.6) + (entry.count80_500 * 0.5) + (entry.count80_375 * 0.375) + (entry.count80_300 * 0.3) + (entry.count80_180 * 0.18);

    return Math.round(totalBl * 100) / 100;
}

/**
 * Determines the strength category based on average strength
 */
function getStrengthCategory(avgStrength) {
    if (!avgStrength) return null;
    if (avgStrength >= 25) return 50; // 28.5%
    if (avgStrength >= 20) return 60; // 22.8%
    if (avgStrength >= 15) return 70; // 17.1%
    return 80; // 11.4%
}

/**
 * Aggregates Reg-A production data for a specific date
 */
async function aggregateRegAProduction(targetDate) {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const regAEntries = await prisma.regAEntry.findMany({
        where: {
            productionDate: {
                gte: startOfDay,
                lte: endOfDay
            },
            status: 'COMPLETED'
        }
    });

    if (regAEntries.length === 0) return null;

    const summary = {
        count50_750: 0, count50_500: 0, count50_375: 0, count50_300: 0, count50_180: 0,
        count60_600: 0, count60_500: 0, count60_375: 0, count60_300: 0, count60_180: 0,
        count70_300: 0,
        count80_600: 0, count80_500: 0, count80_375: 0, count80_300: 0, count80_180: 0
    };

    regAEntries.forEach(entry => {
        const str = getStrengthCategory(entry.avgStrength);
        if (!str) return;

        const sizes = [750, 600, 500, 375, 300, 180];
        sizes.forEach(size => {
            const count = entry[`bottling${size}`] || 0;
            if (count > 0) {
                const fieldName = `count${str}_${size}`;
                if (summary[fieldName] !== undefined) {
                    summary[fieldName] += count;
                }
            }
        });
    });

    return summary;
}

module.exports = {
    calculateBlFromCounts,
    aggregateRegAProduction,
    getStrengthCategory
};
