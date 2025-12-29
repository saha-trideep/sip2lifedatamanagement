/**
 * Excise Duty Calculation Utilities
 * 
 * Handles all calculations for the Excise Duty Register (Phase 3)
 * Based on strength-based duty rates for Country Liquor (IML)
 * 
 * Duty Formula: Duty = BL × Rate (based on strength)
 * Strengths: 50° U.P., 60° U.P., 70° U.P., 80° U.P.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get the current active duty rate for a specific category and strength
 * @param {string} category - Category (e.g., 'CL' for Country Liquor)
 * @param {string} subcategory - Strength (e.g., '50° U.P.', '60° U.P.')
 * @param {Date} date - Date to check (defaults to today)
 * @returns {Promise<Object|null>} - Duty rate object or null if not found
 */
async function getCurrentDutyRate(category, subcategory, date = new Date()) {
    try {
        const rate = await prisma.dutyRate.findFirst({
            where: {
                category,
                subcategory,
                isActive: true,
                effectiveFrom: {
                    lte: date // Rate must be effective on or before the date
                },
                OR: [
                    { effectiveTo: null }, // No end date (currently active)
                    { effectiveTo: { gte: date } } // End date is on or after the date
                ]
            },
            orderBy: {
                effectiveFrom: 'desc' // Get the most recent rate
            }
        });

        return rate;
    } catch (error) {
        console.error('Error fetching duty rate:', error);
        throw new Error(`Failed to fetch duty rate for ${category} - ${subcategory}`);
    }
}

/**
 * Calculate duty accrued based on BL issued and applicable rate
 * @param {number} blIssued - Bulk Liters issued
 * @param {number} rate - Duty rate per BL (₹/BL)
 * @returns {number} - Duty amount in ₹
 */
function calculateDutyAccrued(blIssued, rate) {
    if (typeof blIssued !== 'number' || typeof rate !== 'number') {
        throw new Error('BL issued and rate must be numbers');
    }

    if (blIssued < 0 || rate < 0) {
        throw new Error('BL issued and rate must be positive');
    }

    // Duty = BL × Rate
    const duty = blIssued * rate;

    // Round to 2 decimal places
    return Math.round(duty * 100) / 100;
}

/**
 * Calculate closing balance based on opening balance, accrued duty, and payments
 * @param {number} openingBalance - Opening balance in ₹
 * @param {number} dutyAccrued - Duty accrued this period in ₹
 * @param {number} totalPayments - Total payments made in ₹
 * @returns {number} - Closing balance in ₹
 */
function calculateClosingBalance(openingBalance, dutyAccrued, totalPayments) {
    if (typeof openingBalance !== 'number' || typeof dutyAccrued !== 'number' || typeof totalPayments !== 'number') {
        throw new Error('All balance parameters must be numbers');
    }

    // Closing Balance = Opening Balance + Duty Accrued - Payments
    const closingBalance = openingBalance + dutyAccrued - totalPayments;

    // Round to 2 decimal places
    return Math.round(closingBalance * 100) / 100;
}

/**
 * Determine payment status based on closing balance and total liability
 * @param {number} closingBalance - Current closing balance in ₹
 * @param {number} totalLiability - Total liability (opening + accrued) in ₹
 * @returns {string} - Status: 'PENDING', 'PARTIAL_PAID', 'FULLY_PAID'
 */
function determineStatus(closingBalance, totalLiability) {
    if (typeof closingBalance !== 'number' || typeof totalLiability !== 'number') {
        throw new Error('Balance and liability must be numbers');
    }

    // Fully paid if closing balance is 0 or negative (overpaid)
    if (closingBalance <= 0) {
        return 'FULLY_PAID';
    }

    // Pending if no payments made (closing balance equals total liability)
    if (Math.abs(closingBalance - totalLiability) < 0.01) {
        return 'PENDING';
    }

    // Partial payment if some payment made but balance remains
    if (closingBalance > 0 && closingBalance < totalLiability) {
        return 'PARTIAL_PAID';
    }

    return 'PENDING';
}

/**
 * Validate duty entry data before saving
 * @param {Object} data - Duty entry data
 * @returns {Object} - Validation result { valid: boolean, errors: string[] }
 */
function validateDutyEntry(data) {
    const errors = [];

    // Required fields
    if (!data.monthYear) {
        errors.push('Month/Year is required');
    }

    if (!data.category) {
        errors.push('Category is required');
    }

    if (!data.subcategory) {
        errors.push('Subcategory (strength) is required');
    }

    // Numeric validations
    if (typeof data.totalBlIssued !== 'number' || data.totalBlIssued < 0) {
        errors.push('Total BL issued must be a positive number');
    }

    if (typeof data.applicableRate !== 'number' || data.applicableRate < 0) {
        errors.push('Applicable rate must be a positive number');
    }

    if (typeof data.dutyAccrued !== 'number' || data.dutyAccrued < 0) {
        errors.push('Duty accrued must be a positive number');
    }

    // Balance validation
    const calculatedClosing = calculateClosingBalance(
        data.openingBalance || 0,
        data.dutyAccrued || 0,
        data.totalPayments || 0
    );

    if (data.closingBalance !== undefined && Math.abs(data.closingBalance - calculatedClosing) > 0.01) {
        errors.push(`Closing balance mismatch. Expected: ₹${calculatedClosing}, Got: ₹${data.closingBalance}`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate treasury challan data
 * @param {Object} data - Challan data
 * @returns {Object} - Validation result { valid: boolean, errors: string[] }
 */
function validateChallan(data) {
    const errors = [];

    // Required fields
    if (!data.challanNumber || data.challanNumber.trim() === '') {
        errors.push('Challan number is required');
    }

    if (!data.challanDate) {
        errors.push('Challan date is required');
    }

    if (!data.dutyEntryId) {
        errors.push('Duty entry ID is required');
    }

    // Amount validation
    if (typeof data.amountPaid !== 'number' || data.amountPaid <= 0) {
        errors.push('Amount paid must be a positive number');
    }

    // Date validation - challan date should not be in the future
    if (data.challanDate && new Date(data.challanDate) > new Date()) {
        errors.push('Challan date cannot be in the future');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Calculate duty breakdown by strength from Reg-B data
 * @param {Object} regBData - Reg-B entry data with bottle counts by strength
 * @returns {Promise<Object>} - Duty breakdown by strength
 */
async function calculateDutyBreakdown(regBData) {
    try {
        const breakdown = {
            '50': { bl: 0, al: 0, rate: 0, duty: 0 },
            '60': { bl: 0, al: 0, rate: 0, duty: 0 },
            '70': { bl: 0, al: 0, rate: 0, duty: 0 },
            '80': { bl: 0, al: 0, rate: 0, duty: 0 }
        };

        // Get duty rates for all strengths
        const rates = {
            '50': await getCurrentDutyRate('CL', '50° U.P.', regBData.entryDate),
            '60': await getCurrentDutyRate('CL', '60° U.P.', regBData.entryDate),
            '70': await getCurrentDutyRate('CL', '70° U.P.', regBData.entryDate),
            '80': await getCurrentDutyRate('CL', '80° U.P.', regBData.entryDate)
        };

        // Calculate for each strength
        for (const strength of ['50', '60', '70', '80']) {
            const rate = rates[strength];
            if (!rate) {
                console.warn(`No duty rate found for ${strength}° U.P.`);
                continue;
            }

            // Extract BL and AL for this strength from Reg-B totals
            // This would come from Reg-B summary endpoint
            // For now, we'll use the total fields if available
            breakdown[strength].rate = rate.ratePerAl; // Actually rate per BL

            // Note: In actual implementation, we'll need to call Reg-B API
            // to get BL/AL breakdown by strength
        }

        return breakdown;
    } catch (error) {
        console.error('Error calculating duty breakdown:', error);
        throw new Error('Failed to calculate duty breakdown');
    }
}

/**
 * Calculate all values for a duty entry (helper function)
 * @param {Object} data - Partial duty entry data
 * @returns {Promise<Object>} - Complete duty entry with all calculated values
 */
async function calculateAllDutyValues(data) {
    try {
        // Get applicable rate
        const rate = await getCurrentDutyRate(
            data.category,
            data.subcategory,
            data.monthYear || new Date()
        );

        if (!rate) {
            throw new Error(`No duty rate found for ${data.category} - ${data.subcategory}`);
        }

        // Calculate duty accrued
        const dutyAccrued = calculateDutyAccrued(data.totalBlIssued || 0, rate.ratePerAl);

        // Calculate closing balance
        const closingBalance = calculateClosingBalance(
            data.openingBalance || 0,
            dutyAccrued,
            data.totalPayments || 0
        );

        // Determine status
        const totalLiability = (data.openingBalance || 0) + dutyAccrued;
        const status = determineStatus(closingBalance, totalLiability);

        return {
            ...data,
            applicableRate: rate.ratePerAl,
            dutyAccrued,
            closingBalance,
            status
        };
    } catch (error) {
        console.error('Error calculating duty values:', error);
        throw error;
    }
}

module.exports = {
    getCurrentDutyRate,
    calculateDutyAccrued,
    calculateClosingBalance,
    determineStatus,
    validateDutyEntry,
    validateChallan,
    calculateDutyBreakdown,
    calculateAllDutyValues
};
