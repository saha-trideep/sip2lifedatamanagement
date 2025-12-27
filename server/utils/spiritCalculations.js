/**
 * Spirit Calculations Utility
 * 
 * Core calculation functions for excise register system
 * Used across Reg-76, Reg-74, Reg-A, Reg-B, and Excise Duty registers
 * 
 * All calculations follow official excise regulations
 */

// ============================================================================
// CORE SPIRIT CALCULATIONS
// ============================================================================

/**
 * Calculate Bulk Liters (BL) from mass and density
 * Formula: BL = Mass (kg) / Density (gm/cc)
 * 
 * @param {number} massKg - Mass in kilograms
 * @param {number} densityGmCc - Density in gm/cc
 * @returns {number} Bulk Liters (BL), rounded to 2 decimal places
 * 
 * @example
 * calculateBL(10000, 0.9650) // Returns 10362.69 BL
 */
function calculateBL(massKg, densityGmCc) {
    if (!massKg || !densityGmCc || massKg <= 0 || densityGmCc <= 0) {
        return 0;
    }

    const bl = massKg / densityGmCc;
    return Math.round(bl * 100) / 100;
}

/**
 * Calculate Absolute Liters (AL) from BL and strength
 * Formula: AL = BL × (Strength % / 100)
 * 
 * @param {number} bl - Bulk Liters
 * @param {number} strengthPercent - Alcohol strength percentage (0-100)
 * @returns {number} Absolute Liters (AL), rounded to 2 decimal places
 * 
 * @example
 * calculateAL(10000, 96.5) // Returns 9650 AL
 */
function calculateAL(bl, strengthPercent) {
    if (!bl || !strengthPercent || bl <= 0 || strengthPercent <= 0) {
        return 0;
    }

    const al = bl * (strengthPercent / 100);
    return Math.round(al * 100) / 100;
}

/**
 * Calculate Strength percentage from AL and BL
 * Formula: Strength % = (AL / BL) × 100
 * 
 * @param {number} al - Absolute Liters
 * @param {number} bl - Bulk Liters
 * @returns {number} Strength percentage, rounded to 2 decimal places
 * 
 * @example
 * calculateStrength(9650, 10000) // Returns 96.50%
 */
function calculateStrength(al, bl) {
    if (!al || !bl || bl <= 0) {
        return 0;
    }

    const strength = (al / bl) * 100;
    return Math.round(strength * 100) / 100;
}

/**
 * Calculate Mass from BL and density
 * Formula: Mass (kg) = BL × Density (gm/cc)
 * 
 * @param {number} bl - Bulk Liters
 * @param {number} densityGmCc - Density in gm/cc
 * @returns {number} Mass in kilograms, rounded to 2 decimal places
 * 
 * @example
 * calculateMass(10000, 0.9650) // Returns 9650 kg
 */
function calculateMass(bl, densityGmCc) {
    if (!bl || !densityGmCc || bl <= 0 || densityGmCc <= 0) {
        return 0;
    }

    const mass = bl * densityGmCc;
    return Math.round(mass * 100) / 100;
}

// ============================================================================
// TEMPERATURE CORRECTIONS
// ============================================================================

/**
 * Apply temperature correction to BL
 * Corrects volume to standard temperature (20°C)
 * Uses simplified correction factor: 0.001 per degree Celsius
 * 
 * @param {number} bl - Bulk Liters at current temperature
 * @param {number} currentTemp - Current temperature in °C
 * @param {number} targetTemp - Target temperature in °C (default: 20°C)
 * @returns {number} Corrected BL at target temperature
 * 
 * @example
 * temperatureCorrection(10000, 25, 20) // Returns 9950 BL (corrected to 20°C)
 */
function temperatureCorrection(bl, currentTemp, targetTemp = 20) {
    if (!bl || currentTemp === undefined || bl <= 0) {
        return bl || 0;
    }

    const tempDiff = currentTemp - targetTemp;
    const correctionFactor = 1 - (tempDiff * 0.001);
    const correctedBl = bl * correctionFactor;

    return Math.round(correctedBl * 100) / 100;
}

/**
 * Calculate density at a specific temperature
 * Applies temperature correction to density
 * 
 * @param {number} density - Density at measured temperature
 * @param {number} measuredTemp - Temperature at which density was measured
 * @param {number} targetTemp - Target temperature (default: 20°C)
 * @returns {number} Corrected density at target temperature
 */
function densityAtTemperature(density, measuredTemp, targetTemp = 20) {
    if (!density || measuredTemp === undefined || density <= 0) {
        return density || 0;
    }

    const tempDiff = measuredTemp - targetTemp;
    const correctionFactor = 1 + (tempDiff * 0.001);
    const correctedDensity = density * correctionFactor;

    return Math.round(correctedDensity * 10000) / 10000; // 4 decimal places for density
}

// ============================================================================
// BOTTLE CONVERSIONS
// ============================================================================

/**
 * Convert bottle counts to Bulk Liters (BL)
 * Supports 6 standard bottle sizes: 750ml, 600ml, 500ml, 375ml, 300ml, 180ml
 * 
 * @param {Object} bottleCounts - Object with bottle sizes as keys and counts as values
 * @returns {number} Total BL, rounded to 2 decimal places
 * 
 * @example
 * bottlesToBL({ 750: 100, 600: 50, 500: 200 })
 * // Returns 105 BL (75 + 30 + 100)
 */
function bottlesToBL(bottleCounts) {
    if (!bottleCounts || typeof bottleCounts !== 'object') {
        return 0;
    }

    const bottleSizes = {
        750: 0.75,  // 750ml = 0.75 liters
        600: 0.60,  // 600ml = 0.60 liters
        500: 0.50,  // 500ml = 0.50 liters
        375: 0.375, // 375ml = 0.375 liters
        300: 0.30,  // 300ml = 0.30 liters
        180: 0.18   // 180ml = 0.18 liters
    };

    let totalBl = 0;

    for (const [size, count] of Object.entries(bottleCounts)) {
        const sizeNum = parseInt(size);
        const countNum = parseInt(count) || 0;

        if (bottleSizes[sizeNum] && countNum > 0) {
            totalBl += bottleSizes[sizeNum] * countNum;
        }
    }

    return Math.round(totalBl * 100) / 100;
}

/**
 * Calculate number of bottles from BL for a specific bottle size
 * 
 * @param {number} bl - Bulk Liters
 * @param {number} bottleSize - Bottle size in ml (750, 600, 500, 375, 300, 180)
 * @returns {number} Number of bottles (rounded down to whole number)
 * 
 * @example
 * blToBottles(75, 750) // Returns 100 bottles
 */
function blToBottles(bl, bottleSize) {
    if (!bl || !bottleSize || bl <= 0 || bottleSize <= 0) {
        return 0;
    }

    const litersPerBottle = bottleSize / 1000;
    const bottles = bl / litersPerBottle;

    return Math.floor(bottles); // Round down to whole bottles
}

/**
 * Convert bottle counts to Absolute Liters (AL)
 * Combines bottle-to-BL conversion with AL calculation
 * 
 * @param {Object} bottleCounts - Object with bottle sizes as keys and counts as values
 * @param {number} strengthPercent - Alcohol strength percentage
 * @returns {number} Total AL, rounded to 2 decimal places
 * 
 * @example
 * bottlesToAL({ 750: 100, 600: 50 }, 42.8)
 * // Returns 44.94 AL
 */
function bottlesToAL(bottleCounts, strengthPercent) {
    const bl = bottlesToBL(bottleCounts);
    return calculateAL(bl, strengthPercent);
}

// ============================================================================
// WASTAGE CALCULATIONS
// ============================================================================

/**
 * Calculate transit wastage (Reg-76)
 * Allowable threshold: 0.5% of advised AL
 * 
 * @param {number} advisedAl - Advised Absolute Liters (as per pass)
 * @param {number} receivedAl - Received Absolute Liters (actual)
 * @param {number} threshold - Allowable wastage percentage (default: 0.5%)
 * @returns {Object} Wastage details
 * 
 * @example
 * calculateTransitWastage(10000, 9950, 0.005)
 * // Returns { wastageAl: 50, allowable: 50, chargeable: 0, isChargeable: false }
 */
function calculateTransitWastage(advisedAl, receivedAl, threshold = 0.005) {
    if (!advisedAl || !receivedAl) {
        return {
            wastageAl: 0,
            allowableWastage: 0,
            chargeableWastage: 0,
            isChargeable: false,
            percentageWastage: 0
        };
    }

    const wastageAl = advisedAl - receivedAl;
    const allowableWastage = advisedAl * threshold;
    const chargeableWastage = Math.max(0, wastageAl - allowableWastage);
    const percentageWastage = (wastageAl / advisedAl) * 100;

    return {
        wastageAl: Math.round(wastageAl * 100) / 100,
        allowableWastage: Math.round(allowableWastage * 100) / 100,
        chargeableWastage: Math.round(chargeableWastage * 100) / 100,
        isChargeable: chargeableWastage > 0,
        percentageWastage: Math.round(percentageWastage * 100) / 100
    };
}

/**
 * Calculate storage wastage (Reg-74)
 * Allowable threshold: 0.3% of opening AL
 * 
 * @param {number} openingAl - Opening stock AL
 * @param {number} closingAl - Closing stock AL (after accounting for receipts/issues)
 * @param {number} threshold - Allowable wastage percentage (default: 0.3%)
 * @returns {Object} Wastage details
 */
function calculateStorageWastage(openingAl, closingAl, threshold = 0.003) {
    if (!openingAl) {
        return {
            wastageAl: 0,
            allowableWastage: 0,
            chargeableWastage: 0,
            isChargeable: false,
            percentageWastage: 0
        };
    }

    const wastageAl = openingAl - closingAl;
    const allowableWastage = openingAl * threshold;
    const chargeableWastage = Math.max(0, wastageAl - allowableWastage);
    const percentageWastage = (wastageAl / openingAl) * 100;

    return {
        wastageAl: Math.round(wastageAl * 100) / 100,
        allowableWastage: Math.round(allowableWastage * 100) / 100,
        chargeableWastage: Math.round(chargeableWastage * 100) / 100,
        isChargeable: chargeableWastage > 0,
        percentageWastage: Math.round(percentageWastage * 100) / 100
    };
}

/**
 * Calculate production wastage (Reg-A)
 * Allowable threshold: 0.1% of MFM AL
 * 
 * @param {number} mfmAl - MFM-II reading AL
 * @param {number} bottledAl - Actual bottled AL
 * @param {number} threshold - Allowable wastage percentage (default: 0.1%)
 * @returns {Object} Wastage details
 */
function calculateProductionWastage(mfmAl, bottledAl, threshold = 0.001) {
    if (!mfmAl || !bottledAl) {
        return {
            wastageAl: 0,
            allowableWastage: 0,
            chargeableWastage: 0,
            isChargeable: false,
            percentageWastage: 0,
            isIncrease: false
        };
    }

    const differenceAl = mfmAl - bottledAl;
    const allowableWastage = mfmAl * threshold;
    const chargeableWastage = Math.max(0, differenceAl - allowableWastage);
    const percentageWastage = (Math.abs(differenceAl) / mfmAl) * 100;

    return {
        wastageAl: differenceAl > 0 ? Math.round(differenceAl * 100) / 100 : 0,
        increaseAl: differenceAl < 0 ? Math.round(Math.abs(differenceAl) * 100) / 100 : 0,
        allowableWastage: Math.round(allowableWastage * 100) / 100,
        chargeableWastage: Math.round(chargeableWastage * 100) / 100,
        isChargeable: chargeableWastage > 0,
        isIncrease: differenceAl < 0,
        percentageWastage: Math.round(percentageWastage * 100) / 100
    };
}

// ============================================================================
// DUTY CALCULATIONS
// ============================================================================

/**
 * Get strength category for duty calculation
 * Categories: 50UP, 60UP, 70UP, 80UP
 * 
 * @param {number} strengthPercent - Alcohol strength percentage
 * @returns {string} Strength category
 * 
 * @example
 * getStrengthCategory(28.5) // Returns "50UP"
 * getStrengthCategory(42.8) // Returns "60UP"
 */
function getStrengthCategory(strengthPercent) {
    if (strengthPercent >= 25 && strengthPercent <= 30) return '50UP'; // 28.5% v/v
    if (strengthPercent >= 20 && strengthPercent < 25) return '60UP'; // 22.8% v/v
    if (strengthPercent >= 15 && strengthPercent < 20) return '70UP'; // 17.1% v/v
    if (strengthPercent >= 10 && strengthPercent < 15) return '80UP'; // 11.4% v/v

    return 'UNKNOWN';
}

/**
 * Get duty rate per BL for a strength category
 * Rates as per current excise regulations
 * 
 * @param {string} strengthCategory - Strength category (50UP, 60UP, 70UP, 80UP)
 * @returns {number} Duty rate in ₹ per BL
 */
function getDutyRate(strengthCategory) {
    const dutyRates = {
        '50UP': 50, // ₹50 per BL
        '60UP': 50, // ₹50 per BL
        '70UP': 20, // ₹20 per BL
        '80UP': 17  // ₹17 per BL
    };

    return dutyRates[strengthCategory] || 0;
}

/**
 * Calculate excise duty amount
 * 
 * @param {number} bl - Bulk Liters
 * @param {number} strengthPercent - Alcohol strength percentage
 * @returns {Object} Duty calculation details
 * 
 * @example
 * calculateDuty(1000, 42.8)
 * // Returns { category: '60UP', ratePerBl: 50, totalDuty: 50000 }
 */
function calculateDuty(bl, strengthPercent) {
    if (!bl || !strengthPercent || bl <= 0 || strengthPercent <= 0) {
        return {
            category: 'UNKNOWN',
            ratePerBl: 0,
            totalDuty: 0
        };
    }

    const category = getStrengthCategory(strengthPercent);
    const ratePerBl = getDutyRate(category);
    const totalDuty = bl * ratePerBl;

    return {
        category,
        ratePerBl,
        totalDuty: Math.round(totalDuty * 100) / 100
    };
}

/**
 * Calculate production fees
 * Standard rate: ₹3 per bottle
 * 
 * @param {number} bottleCount - Total number of bottles
 * @returns {number} Production fees in ₹
 */
function calculateProductionFees(bottleCount) {
    if (!bottleCount || bottleCount <= 0) {
        return 0;
    }

    const feePerBottle = 3; // ₹3 per bottle
    return bottleCount * feePerBottle;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate that a value is a positive number
 * 
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field (for error message)
 * @returns {Object} Validation result
 */
function validatePositiveNumber(value, fieldName = 'Value') {
    const num = parseFloat(value);

    if (isNaN(num)) {
        return {
            isValid: false,
            error: `${fieldName} must be a number`
        };
    }

    if (num < 0) {
        return {
            isValid: false,
            error: `${fieldName} cannot be negative`
        };
    }

    return {
        isValid: true,
        value: num
    };
}

/**
 * Validate strength percentage (must be between 0 and 100)
 * 
 * @param {number} strength - Strength percentage
 * @returns {Object} Validation result
 */
function validateStrength(strength) {
    const validation = validatePositiveNumber(strength, 'Strength');

    if (!validation.isValid) {
        return validation;
    }

    if (validation.value > 100) {
        return {
            isValid: false,
            error: 'Strength cannot exceed 100%'
        };
    }

    return {
        isValid: true,
        value: validation.value
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Core calculations
    calculateBL,
    calculateAL,
    calculateStrength,
    calculateMass,

    // Temperature corrections
    temperatureCorrection,
    densityAtTemperature,

    // Bottle conversions
    bottlesToBL,
    blToBottles,
    bottlesToAL,

    // Wastage calculations
    calculateTransitWastage,
    calculateStorageWastage,
    calculateProductionWastage,

    // Duty calculations
    getStrengthCategory,
    getDutyRate,
    calculateDuty,
    calculateProductionFees,

    // Validation helpers
    validatePositiveNumber,
    validateStrength
};
