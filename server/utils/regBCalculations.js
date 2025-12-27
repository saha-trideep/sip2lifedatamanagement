/**
 * Reg-B Specific Calculations Utility
 * 
 * Handles bottle inventory calculations for the Issue of Country Liquor Register (Form Reg-B).
 * Manages 6 bottle sizes × 4 strength categories = 24 combinations per section.
 */

const { bottlesToBL, bottlesToAL, calculateProductionFees } = require('./spiritCalculations');

/**
 * Bottle sizes in ml
 */
const BOTTLE_SIZES = {
    750: 0.75,
    600: 0.60,
    500: 0.50,
    375: 0.375,
    300: 0.30,
    180: 0.18
};

/**
 * Strength categories in degrees UP (Under Proof)
 * 50UP = 28.5% v/v, 60UP = 22.8% v/v, 70UP = 17.1% v/v, 80UP = 11.4% v/v
 */
const STRENGTH_CATEGORIES = {
    50: 28.5,
    60: 22.8,
    70: 17.1,
    80: 11.4
};

/**
 * Calculate BL and AL for a section (opening, receipt, issue, or wastage)
 * 
 * @param {Object} bottleCounts - Object with keys like "750_50", "600_60", etc.
 * @returns {Object} { totalBl, totalAl }
 */
function calculateSectionTotals(bottleCounts) {
    let totalBl = 0;
    let totalAl = 0;

    // Iterate through all size-strength combinations
    Object.keys(BOTTLE_SIZES).forEach(size => {
        Object.keys(STRENGTH_CATEGORIES).forEach(strength => {
            const key = `${size}_${strength}`;
            const count = parseInt(bottleCounts[key]) || 0;

            if (count > 0) {
                const bl = BOTTLE_SIZES[size] * count;
                const al = bl * (STRENGTH_CATEGORIES[strength] / 100);

                totalBl += bl;
                totalAl += al;
            }
        });
    });

    return {
        totalBl: Math.round(totalBl * 100) / 100,
        totalAl: Math.round(totalAl * 100) / 100
    };
}

/**
 * Calculate all totals for a Reg-B entry
 * 
 * @param {Object} data - Reg-B entry data with opening, receipt, issue, wastage fields
 * @returns {Object} All calculated totals
 */
function calculateAllRegBTotals(data) {
    // Extract bottle counts for each section
    const sections = ['opening', 'receipt', 'issue', 'wastage'];
    const totals = {};

    sections.forEach(section => {
        const bottleCounts = {};

        // Extract all bottle counts for this section
        Object.keys(BOTTLE_SIZES).forEach(size => {
            Object.keys(STRENGTH_CATEGORIES).forEach(strength => {
                const fieldName = `${section}${size}_${strength}`;
                bottleCounts[`${size}_${strength}`] = data[fieldName] || 0;
            });
        });

        // Calculate totals for this section
        const sectionTotals = calculateSectionTotals(bottleCounts);
        totals[`total${section.charAt(0).toUpperCase() + section.slice(1)}Bl`] = sectionTotals.totalBl;
        totals[`total${section.charAt(0).toUpperCase() + section.slice(1)}Al`] = sectionTotals.totalAl;
    });

    // Calculate closing stock
    // Closing = Opening + Receipt - Issue - Wastage
    totals.totalClosingBl = Math.round((
        totals.totalOpeningBl +
        totals.totalReceiptBl -
        totals.totalIssueBl -
        totals.totalWastageBl
    ) * 100) / 100;

    totals.totalClosingAl = Math.round((
        totals.totalOpeningAl +
        totals.totalReceiptAl -
        totals.totalIssueAl -
        totals.totalWastageAl
    ) * 100) / 100;

    // Calculate production fees (₹3 per bottle issued)
    let totalIssuedBottles = 0;
    Object.keys(BOTTLE_SIZES).forEach(size => {
        Object.keys(STRENGTH_CATEGORIES).forEach(strength => {
            const fieldName = `issue${size}_${strength}`;
            totalIssuedBottles += parseInt(data[fieldName]) || 0;
        });
    });

    totals.productionFees = calculateProductionFees(totalIssuedBottles);

    return totals;
}

/**
 * Validate Reg-B entry balance
 * Opening + Receipt = Issue + Wastage + Closing
 * 
 * @param {Object} totals - Calculated totals
 * @returns {Object} Validation result
 */
function validateRegBBalance(totals) {
    const leftSide = totals.totalOpeningBl + totals.totalReceiptBl;
    const rightSide = totals.totalIssueBl + totals.totalWastageBl + totals.totalClosingBl;

    const difference = Math.abs(leftSide - rightSide);
    const isBalanced = difference < 0.01; // Allow 0.01 BL tolerance for rounding

    return {
        isBalanced,
        difference: Math.round(difference * 100) / 100,
        leftSide: Math.round(leftSide * 100) / 100,
        rightSide: Math.round(rightSide * 100) / 100
    };
}

/**
 * Auto-fill receipt section from Reg-A production data
 * 
 * @param {Object} regAEntry - Completed Reg-A entry
 * @returns {Object} Receipt bottle counts
 */
function autoFillFromRegA(regAEntry) {
    if (!regAEntry || regAEntry.status !== 'COMPLETED') {
        return null;
    }

    // Map Reg-A bottle counts to Reg-B receipt fields
    // Determine strength category based on avgStrength
    let strengthCategory = 50; // Default
    const avgStrength = regAEntry.avgStrength || 42.8;

    if (avgStrength >= 25 && avgStrength <= 30) strengthCategory = 50; // 28.5%
    else if (avgStrength >= 20 && avgStrength < 25) strengthCategory = 60; // 22.8%
    else if (avgStrength >= 15 && avgStrength < 20) strengthCategory = 70; // 17.1%
    else if (avgStrength >= 10 && avgStrength < 15) strengthCategory = 80; // 11.4%

    const receiptData = {};

    // Map bottle counts
    ['750', '600', '500', '375', '300', '180'].forEach(size => {
        const regAField = `bottling${size}`;
        const regBField = `receipt${size}_${strengthCategory}`;
        receiptData[regBField] = regAEntry[regAField] || 0;
    });

    return receiptData;
}

/**
 * Validate Reg-B entry data
 * 
 * @param {Object} data - Reg-B entry data
 * @returns {Object} Validation result
 */
function validateRegBEntry(data) {
    const errors = [];

    if (!data.entryDate) {
        errors.push("Entry date is required.");
    }

    // Check if at least one bottle count is provided
    const hasBottles = Object.keys(data).some(key =>
        (key.startsWith('opening') || key.startsWith('receipt') ||
            key.startsWith('issue') || key.startsWith('wastage')) &&
        parseInt(data[key]) > 0
    );

    if (!hasBottles) {
        errors.push("At least one bottle count must be greater than zero.");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    BOTTLE_SIZES,
    STRENGTH_CATEGORIES,
    calculateSectionTotals,
    calculateAllRegBTotals,
    validateRegBBalance,
    autoFillFromRegA,
    validateRegBEntry
};
