/**
 * Reg-A Specific Calculations Utility
 * 
 * Handles bottling production calculations and wastage verification
 * for the Blending & Bottling Register (Form Reg-A).
 */

const { bottlesToBL, calculateAL, calculateProductionWastage } = require('./spiritCalculations');

/**
 * Calculate total spirit bottled from bottle counts
 * 
 * @param {Object} bottleCounts - Counts for 750, 600, 500, 375, 300, 180ml
 * @param {number} strength - Average strength % of the bottled spirit
 * @returns {Object} Calculated BL and AL
 */
function calculateSpiritBottled(bottleCounts, strength) {
    const bl = bottlesToBL(bottleCounts);
    const al = calculateAL(bl, strength);

    return {
        spiritBottledBl: bl,
        spiritBottledAl: al
    };
}

/**
 * Perform full Reg-A wastage analysis (0.1% threshold)
 * 
 * @param {number} mfmAl - Absolute Liters recorded by MFM-II
 * @param {number} bottledAl - Absolute Liters calculated from bottle counts
 * @returns {Object} Full wastage breakdown
 */
function analyzeRegAWastage(mfmAl, bottledAl) {
    const analysis = calculateProductionWastage(mfmAl, bottledAl, 0.001); // 0.1% threshold

    return {
        differenceFoundAl: mfmAl - bottledAl,
        productionWastage: analysis.wastageAl,
        productionIncrease: analysis.increaseAl,
        allowableWastage: analysis.allowableWastage,
        chargeableWastage: analysis.chargeableWastage,
        isChargeable: analysis.isChargeable,
        percentageWastage: analysis.percentageWastage
    };
}

/**
 * Validate Reg-A entry data before calculation or finalization
 * 
 * @param {Object} data - Reg-A entry data
 * @returns {Object} Validation result
 */
function validateRegAEntry(data) {
    const errors = [];

    if (!data.batchId) errors.push("Batch ID is required.");

    const countFields = ['bottling750', 'bottling600', 'bottling500', 'bottling375', 'bottling300', 'bottling180'];
    const hasCounts = countFields.some(f => data[f] && parseInt(data[f]) > 0);

    if (!hasCounts) errors.push("At least one bottle count must be greater than zero.");

    if (!data.avgStrength || data.avgStrength <= 0) {
        errors.push("Average strength must be greater than zero.");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Calculate all Reg-A values combined
 * Used for the /calculate preview endpoint
 */
function calculateAllRegAValues(data) {
    const bottleCounts = {
        750: data.bottling750 || 0,
        600: data.bottling600 || 0,
        500: data.bottling500 || 0,
        375: data.bottling375 || 0,
        300: data.bottling300 || 0,
        180: data.bottling180 || 0
    };

    const bottling = calculateSpiritBottled(bottleCounts, data.avgStrength || 0);

    let wastage = null;
    if (data.mfmTotalAl) {
        wastage = analyzeRegAWastage(data.mfmTotalAl, bottling.spiritBottledAl);
    }

    return {
        ...bottling,
        wastagePreview: wastage
    };
}

module.exports = {
    calculateSpiritBottled,
    analyzeRegAWastage,
    validateRegAEntry,
    calculateAllRegAValues
};
