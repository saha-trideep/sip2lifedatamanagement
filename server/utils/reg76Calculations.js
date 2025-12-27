/**
 * Reg-76 Calculation Utilities
 * 
 * Specific calculations for Spirit Receipt Register (Reg-76)
 * Handles transit wastage, BL/AL calculations, and validation
 */

const {
    calculateBL,
    calculateAL,
    calculateTransitWastage
} = require('./spiritCalculations');

/**
 * Calculate all received values from weigh bridge data
 * 
 * @param {Object} data - Input data
 * @param {number} data.ladenWeightKg - Laden weight in kg
 * @param {number} data.unladenWeightKg - Unladen weight in kg
 * @param {number} data.avgDensity - Average density in gm/cc
 * @param {number} data.receivedStrength - Received strength %
 * @returns {Object} Calculated values
 */
function calculateReceivedValues(data) {
    const {
        ladenWeightKg,
        unladenWeightKg,
        avgDensity,
        receivedStrength
    } = data;

    // Calculate received mass
    const receivedMass = ladenWeightKg - unladenWeightKg;

    // Calculate received BL
    const receivedBl = calculateBL(receivedMass, avgDensity);

    // Calculate received AL
    const receivedAl = calculateAL(receivedBl, receivedStrength);

    return {
        receivedMass: Math.round(receivedMass * 100) / 100,
        receivedBl: Math.round(receivedBl * 100) / 100,
        receivedAl: Math.round(receivedAl * 100) / 100
    };
}

/**
 * Calculate transit wastage for Reg-76
 * Uses 0.5% threshold as per excise regulations
 * 
 * @param {Object} data - Input data
 * @param {number} data.advisedBl - Advised BL (as per pass)
 * @param {number} data.advisedAl - Advised AL (as per pass)
 * @param {number} data.receivedBl - Received BL (actual)
 * @param {number} data.receivedAl - Received AL (actual)
 * @returns {Object} Wastage details
 */
function calculateReg76Wastage(data) {
    const {
        advisedBl,
        advisedAl,
        receivedBl,
        receivedAl
    } = data;

    // Calculate BL wastage
    const wastageBl = advisedBl - receivedBl;

    // Calculate AL wastage (using 0.5% threshold)
    const wastageDetails = calculateTransitWastage(advisedAl, receivedAl, 0.005);

    return {
        transitWastageBl: Math.round(wastageBl * 100) / 100,
        transitWastageAl: wastageDetails.wastageAl,
        allowableWastage: wastageDetails.allowableWastage,
        chargeableWastage: wastageDetails.chargeableWastage,
        isChargeable: wastageDetails.isChargeable,
        percentageWastage: wastageDetails.percentageWastage
    };
}

/**
 * Calculate days in transit
 * 
 * @param {Date|string} dispatchDate - Dispatch date
 * @param {Date|string} arrivalDate - Arrival date
 * @returns {number} Number of days in transit
 */
function calculateTransitDays(dispatchDate, arrivalDate) {
    if (!dispatchDate || !arrivalDate) {
        return 0;
    }

    const dispatch = new Date(dispatchDate);
    const arrival = new Date(arrivalDate);

    const diffTime = Math.abs(arrival - dispatch);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Validate Reg-76 entry data
 * 
 * @param {Object} data - Entry data to validate
 * @returns {Object} Validation result
 */
function validateReg76Entry(data) {
    const errors = [];

    // Mandatory fields
    const mandatoryFields = [
        'receiptDate',
        'permitNo',
        'exportingDistillery',
        'invoiceNo',
        'vehicleNo',
        'natureOfSpirit',
        'storageVat',
        'advisedBl',
        'advisedAl',
        'advisedStrength',
        'advisedMassKg',
        'ladenWeightKg',
        'unladenWeightKg',
        'avgDensity',
        'avgTemperature',
        'receivedStrength'
    ];

    for (const field of mandatoryFields) {
        if (!data[field] && data[field] !== 0) {
            errors.push(`${field} is required`);
        }
    }

    // Validate numeric values are positive
    const numericFields = [
        'advisedBl',
        'advisedAl',
        'advisedStrength',
        'advisedMassKg',
        'ladenWeightKg',
        'unladenWeightKg',
        'avgDensity',
        'receivedStrength'
    ];

    for (const field of numericFields) {
        if (data[field] !== undefined && data[field] < 0) {
            errors.push(`${field} cannot be negative`);
        }
    }

    // Validate strength is between 0 and 100
    if (data.advisedStrength > 100) {
        errors.push('Advised strength cannot exceed 100%');
    }
    if (data.receivedStrength > 100) {
        errors.push('Received strength cannot exceed 100%');
    }

    // Validate laden weight > unladen weight
    if (data.ladenWeightKg && data.unladenWeightKg &&
        data.ladenWeightKg <= data.unladenWeightKg) {
        errors.push('Laden weight must be greater than unladen weight');
    }

    // Validate dates
    if (data.receiptDate) {
        const receiptDate = new Date(data.receiptDate);
        if (isNaN(receiptDate.getTime())) {
            errors.push('Invalid receipt date');
        }
    }

    if (data.arrivalDate && data.receiptDate) {
        const arrivalDate = new Date(data.arrivalDate);
        const receiptDate = new Date(data.receiptDate);
        if (arrivalDate > receiptDate) {
            errors.push('Arrival date cannot be after receipt date');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Calculate all Reg-76 values at once
 * Combines received values and wastage calculations
 * 
 * @param {Object} data - Complete entry data
 * @returns {Object} All calculated values
 */
function calculateAllReg76Values(data) {
    // Calculate received values
    const receivedValues = calculateReceivedValues(data);

    // Calculate wastage
    const wastageValues = calculateReg76Wastage({
        advisedBl: data.advisedBl,
        advisedAl: data.advisedAl,
        receivedBl: receivedValues.receivedBl,
        receivedAl: receivedValues.receivedAl
    });

    // Calculate transit days if dates provided
    let transitDays = 0;
    if (data.dispatchDate && data.arrivalDate) {
        transitDays = calculateTransitDays(data.dispatchDate, data.arrivalDate);
    }

    return {
        ...receivedValues,
        ...wastageValues,
        transitDays
    };
}

module.exports = {
    calculateReceivedValues,
    calculateReg76Wastage,
    calculateTransitDays,
    validateReg76Entry,
    calculateAllReg76Values
};
