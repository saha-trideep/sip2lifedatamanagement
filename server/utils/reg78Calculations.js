/**
 * Reg-78 Specific Calculations Utility
 * 
 * Handles Master Spirit Ledger calculations, aggregating data from all registers
 * to track daily spirit inventory movements.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Aggregate data from all registers for a specific date
 * 
 * @param {Date} date - The date to aggregate data for
 * @returns {Object} Aggregated values for opening, receipts, issues, wastage, and closing
 */
async function aggregateFromAllRegisters(date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get previous day's closing as opening balance
    const previousDate = new Date(startOfDay);
    previousDate.setDate(previousDate.getDate() - 1);

    const previousEntry = await prisma.reg78Entry.findUnique({
        where: { entryDate: previousDate }
    });

    const openingBl = previousEntry ? previousEntry.closingBl : 0;
    const openingAl = previousEntry ? previousEntry.closingAl : 0;

    // 1. RECEIPTS: Sum from Reg-76 (Spirit Receipt Register)
    const reg76Entries = await prisma.reg76Entry.findMany({
        where: {
            receiptDate: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    const receiptBl = reg76Entries.reduce((sum, entry) => sum + (entry.receivedBl || 0), 0);
    const receiptAl = reg76Entries.reduce((sum, entry) => sum + (entry.receivedAl || 0), 0);

    // 2. ISSUES: Sum from Reg-A (Production) + Reg-B (Country Liquor Issues)

    // Reg-A: Bottled spirit issued to Reg-B
    const regAEntries = await prisma.regAEntry.findMany({
        where: {
            productionDate: {
                gte: startOfDay,
                lte: endOfDay
            },
            status: 'COMPLETED'
        }
    });

    const regAIssueBl = regAEntries.reduce((sum, entry) => sum + (entry.spiritBottledBl || 0), 0);
    const regAIssueAl = regAEntries.reduce((sum, entry) => sum + (entry.spiritBottledAl || 0), 0);

    // Reg-B: Country liquor issued to market
    const regBEntries = await prisma.regBEntry.findMany({
        where: {
            entryDate: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    const regBIssueBl = regBEntries.reduce((sum, entry) => sum + (entry.totalIssueBl || 0), 0);
    const regBIssueAl = regBEntries.reduce((sum, entry) => sum + (entry.totalIssueAl || 0), 0);

    const issueBl = regAIssueBl + regBIssueBl;
    const issueAl = regAIssueAl + regBIssueAl;

    // 3. WASTAGE: Sum from Reg-74 (Storage), Reg-A (Production), Reg-B (Breakage)

    // Reg-74: Storage wastage from vat operations
    const reg74Events = await prisma.reg74Event.findMany({
        where: {
            eventDateTime: {
                gte: startOfDay,
                lte: endOfDay
            },
            eventType: {
                in: ['ADJUSTMENT', 'PRODUCTION']
            }
        }
    });

    let reg74WastageBl = 0;
    let reg74WastageAl = 0;

    reg74Events.forEach(event => {
        if (event.adjustmentData && event.adjustmentData.type === 'WAST') {
            reg74WastageBl += event.adjustmentData.qtyBl || 0;
            reg74WastageAl += event.adjustmentData.qtyAl || 0;
        }
        if (event.productionData && event.productionData.deadStockAl) {
            reg74WastageAl += event.productionData.deadStockAl || 0;
        }
    });

    // Reg-A: Production wastage
    const regAWastageBl = regAEntries.reduce((sum, entry) => {
        // Calculate wastage from MFM vs Bottled difference
        const wastage = (entry.chargeableWastage || 0) + (entry.productionWastage || 0);
        return sum + wastage;
    }, 0);

    const regAWastageAl = regAEntries.reduce((sum, entry) => {
        return sum + (entry.chargeableWastage || 0);
    }, 0);

    // Reg-B: Breakage/wastage
    const regBWastageBl = regBEntries.reduce((sum, entry) => sum + (entry.totalWastageBl || 0), 0);
    const regBWastageAl = regBEntries.reduce((sum, entry) => sum + (entry.totalWastageAl || 0), 0);

    const wastageBl = reg74WastageBl + regAWastageBl + regBWastageBl;
    const wastageAl = reg74WastageAl + regAWastageAl + regBWastageAl;

    // 4. CLOSING BALANCE: Opening + Receipts - Issues - Wastage
    const closingBl = openingBl + receiptBl - issueBl - wastageBl;
    const closingAl = openingAl + receiptAl - issueAl - wastageAl;

    return {
        openingBl,
        openingAl,
        receiptBl,
        receiptAl,
        issueBl,
        issueAl,
        wastageBl,
        wastageAl,
        closingBl,
        closingAl,
        // Source data for drill-down
        sourceData: {
            reg76Count: reg76Entries.length,
            regACount: regAEntries.length,
            regBCount: regBEntries.length,
            reg74Count: reg74Events.length
        }
    };
}

/**
 * Calculate variance between calculated and actual values
 * 
 * @param {number} calculated - Calculated closing balance
 * @param {number} actual - Actual closing balance (from physical verification)
 * @returns {number} Variance percentage
 */
function calculateVariance(calculated, actual) {
    if (calculated === 0) return 0;
    return ((actual - calculated) / calculated) * 100;
}

/**
 * Determine if reconciliation is needed based on variance threshold
 * 
 * @param {number} variance - Variance percentage
 * @param {number} threshold - Acceptable variance threshold (default 1.0%)
 * @returns {boolean} True if variance is within acceptable limits
 */
function determineReconciliationStatus(variance, threshold = 1.0) {
    return Math.abs(variance) <= threshold;
}

/**
 * Validate Reg-78 entry data
 * 
 * @param {Object} data - Reg-78 entry data
 * @returns {Object} Validation result
 */
function validateReg78Entry(data) {
    const errors = [];

    if (!data.entryDate) {
        errors.push("Entry date is required.");
    }

    // Ensure numeric values are valid
    const numericFields = [
        'openingBl', 'openingAl', 'receiptBl', 'receiptAl',
        'issueBl', 'issueAl', 'wastageBl', 'wastageAl',
        'closingBl', 'closingAl'
    ];

    numericFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
            const value = parseFloat(data[field]);
            if (isNaN(value) || value < 0) {
                errors.push(`${field} must be a non-negative number.`);
            }
        }
    });

    // Validate balance equation: Closing = Opening + Receipts - Issues - Wastage
    if (data.openingBl !== undefined && data.receiptBl !== undefined &&
        data.issueBl !== undefined && data.wastageBl !== undefined &&
        data.closingBl !== undefined) {

        const expectedClosingBl = data.openingBl + data.receiptBl - data.issueBl - data.wastageBl;
        const difference = Math.abs(expectedClosingBl - data.closingBl);

        if (difference > 0.01) { // Allow 0.01 BL tolerance for rounding
            errors.push(`Balance equation mismatch (BL): Expected ${expectedClosingBl.toFixed(2)}, got ${data.closingBl}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Get drill-down data for a specific date
 * Shows detailed breakdown of all source register entries
 * 
 * @param {Date} date - The date to get drill-down data for
 * @returns {Object} Detailed breakdown by register
 */
async function getDrillDownData(date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get all source entries
    const reg76Entries = await prisma.reg76Entry.findMany({
        where: {
            receiptDate: { gte: startOfDay, lte: endOfDay }
        },
        select: {
            id: true,
            permitNo: true,
            exportingDistillery: true,
            receivedBl: true,
            receivedAl: true,
            storageVat: true
        }
    });

    const regAEntries = await prisma.regAEntry.findMany({
        where: {
            productionDate: { gte: startOfDay, lte: endOfDay },
            status: 'COMPLETED'
        },
        include: {
            batch: {
                include: { brand: true }
            }
        }
    });

    const regBEntries = await prisma.regBEntry.findMany({
        where: {
            entryDate: { gte: startOfDay, lte: endOfDay }
        },
        include: {
            batch: {
                include: { brand: true }
            }
        }
    });

    const reg74Events = await prisma.reg74Event.findMany({
        where: {
            eventDateTime: { gte: startOfDay, lte: endOfDay },
            eventType: { in: ['ADJUSTMENT', 'PRODUCTION'] }
        },
        include: {
            vat: true
        }
    });

    return {
        receipts: {
            reg76: reg76Entries.map(e => ({
                id: e.id,
                permitNo: e.permitNo,
                distillery: e.exportingDistillery,
                bl: e.receivedBl,
                al: e.receivedAl,
                vat: e.storageVat
            })),
            totalBl: reg76Entries.reduce((sum, e) => sum + (e.receivedBl || 0), 0),
            totalAl: reg76Entries.reduce((sum, e) => sum + (e.receivedAl || 0), 0)
        },
        issues: {
            regA: regAEntries.map(e => ({
                id: e.id,
                batchNo: e.batch?.baseBatchNo,
                brand: e.batch?.brand?.name,
                bl: e.spiritBottledBl,
                al: e.spiritBottledAl
            })),
            regB: regBEntries.map(e => ({
                id: e.id,
                batchNo: e.batch?.baseBatchNo,
                bl: e.totalIssueBl,
                al: e.totalIssueAl
            })),
            totalBl: regAEntries.reduce((sum, e) => sum + (e.spiritBottledBl || 0), 0) +
                regBEntries.reduce((sum, e) => sum + (e.totalIssueBl || 0), 0),
            totalAl: regAEntries.reduce((sum, e) => sum + (e.spiritBottledAl || 0), 0) +
                regBEntries.reduce((sum, e) => sum + (e.totalIssueAl || 0), 0)
        },
        wastage: {
            reg74: reg74Events.filter(e =>
                (e.adjustmentData && e.adjustmentData.type === 'WAST') ||
                (e.productionData && e.productionData.deadStockAl)
            ).map(e => ({
                id: e.id,
                vatCode: e.vat?.vatCode,
                eventType: e.eventType,
                bl: e.adjustmentData?.qtyBl || 0,
                al: e.adjustmentData?.qtyAl || (e.productionData?.deadStockAl || 0)
            })),
            regA: regAEntries.filter(e => e.chargeableWastage > 0).map(e => ({
                id: e.id,
                batchNo: e.batch?.baseBatchNo,
                wastageAl: e.chargeableWastage
            })),
            regB: regBEntries.filter(e => (e.totalWastageBl || 0) > 0).map(e => ({
                id: e.id,
                batchNo: e.batch?.baseBatchNo,
                bl: e.totalWastageBl,
                al: e.totalWastageAl
            }))
        }
    };
}

module.exports = {
    aggregateFromAllRegisters,
    calculateVariance,
    determineReconciliationStatus,
    validateReg78Entry,
    getDrillDownData
};
