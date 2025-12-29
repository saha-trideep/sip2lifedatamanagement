/**
 * Unit Tests for Excise Duty Calculation Utilities
 * 
 * Run with: node server/utils/test_exciseDutyCalculations.js
 */

const {
    calculateDutyAccrued,
    calculateClosingBalance,
    determineStatus,
    validateDutyEntry,
    validateChallan
} = require('./exciseDutyCalculations');

// Test counter
let passed = 0;
let failed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`✅ ${description}`);
        passed++;
    } catch (error) {
        console.error(`❌ ${description}`);
        console.error(`   Error: ${error.message}`);
        failed++;
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}\n   Expected: ${expected}\n   Got: ${actual}`);
    }
}

function assertClose(actual, expected, tolerance = 0.01, message) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`${message}\n   Expected: ${expected}\n   Got: ${actual}`);
    }
}

console.log('\n🧪 Testing Excise Duty Calculation Utilities\n');

// ============================================
// Test: calculateDutyAccrued
// ============================================
console.log('📊 Testing calculateDutyAccrued()...\n');

test('Calculate duty for 50° U.P. (100 BL × ₹50/BL)', () => {
    const duty = calculateDutyAccrued(100, 50);
    assertEqual(duty, 5000, 'Duty should be ₹5000');
});

test('Calculate duty for 60° U.P. (200 BL × ₹50/BL)', () => {
    const duty = calculateDutyAccrued(200, 50);
    assertEqual(duty, 10000, 'Duty should be ₹10000');
});

test('Calculate duty for 70° U.P. (150 BL × ₹20/BL)', () => {
    const duty = calculateDutyAccrued(150, 20);
    assertEqual(duty, 3000, 'Duty should be ₹3000');
});

test('Calculate duty for 80° U.P. (300 BL × ₹17/BL)', () => {
    const duty = calculateDutyAccrued(300, 17);
    assertEqual(duty, 5100, 'Duty should be ₹5100');
});

test('Calculate duty with decimal BL (123.45 BL × ₹50/BL)', () => {
    const duty = calculateDutyAccrued(123.45, 50);
    assertClose(duty, 6172.50, 0.01, 'Duty should be ₹6172.50');
});

test('Calculate duty with zero BL', () => {
    const duty = calculateDutyAccrued(0, 50);
    assertEqual(duty, 0, 'Duty should be ₹0');
});

test('Reject negative BL', () => {
    try {
        calculateDutyAccrued(-100, 50);
        throw new Error('Should have thrown error for negative BL');
    } catch (error) {
        if (!error.message.includes('positive')) {
            throw error;
        }
    }
});

test('Reject negative rate', () => {
    try {
        calculateDutyAccrued(100, -50);
        throw new Error('Should have thrown error for negative rate');
    } catch (error) {
        if (!error.message.includes('positive')) {
            throw error;
        }
    }
});

// ============================================
// Test: calculateClosingBalance
// ============================================
console.log('\n📊 Testing calculateClosingBalance()...\n');

test('Calculate closing balance with no payments', () => {
    const closing = calculateClosingBalance(1000, 5000, 0);
    assertEqual(closing, 6000, 'Closing should be ₹6000 (1000 + 5000 - 0)');
});

test('Calculate closing balance with partial payment', () => {
    const closing = calculateClosingBalance(1000, 5000, 3000);
    assertEqual(closing, 3000, 'Closing should be ₹3000 (1000 + 5000 - 3000)');
});

test('Calculate closing balance with full payment', () => {
    const closing = calculateClosingBalance(1000, 5000, 6000);
    assertEqual(closing, 0, 'Closing should be ₹0 (1000 + 5000 - 6000)');
});

test('Calculate closing balance with overpayment', () => {
    const closing = calculateClosingBalance(1000, 5000, 7000);
    assertEqual(closing, -1000, 'Closing should be -₹1000 (1000 + 5000 - 7000)');
});

test('Calculate closing balance with zero opening', () => {
    const closing = calculateClosingBalance(0, 5000, 2000);
    assertEqual(closing, 3000, 'Closing should be ₹3000 (0 + 5000 - 2000)');
});

// ============================================
// Test: determineStatus
// ============================================
console.log('\n📊 Testing determineStatus()...\n');

test('Status is PENDING when no payments made', () => {
    const status = determineStatus(6000, 6000);
    assertEqual(status, 'PENDING', 'Status should be PENDING');
});

test('Status is PARTIAL_PAID when some payment made', () => {
    const status = determineStatus(3000, 6000);
    assertEqual(status, 'PARTIAL_PAID', 'Status should be PARTIAL_PAID');
});

test('Status is FULLY_PAID when fully paid', () => {
    const status = determineStatus(0, 6000);
    assertEqual(status, 'FULLY_PAID', 'Status should be FULLY_PAID');
});

test('Status is FULLY_PAID when overpaid', () => {
    const status = determineStatus(-1000, 6000);
    assertEqual(status, 'FULLY_PAID', 'Status should be FULLY_PAID');
});

test('Status is PARTIAL_PAID with small remaining balance', () => {
    const status = determineStatus(100, 6000);
    assertEqual(status, 'PARTIAL_PAID', 'Status should be PARTIAL_PAID');
});

// ============================================
// Test: validateDutyEntry
// ============================================
console.log('\n📊 Testing validateDutyEntry()...\n');

test('Valid duty entry passes validation', () => {
    const result = validateDutyEntry({
        monthYear: new Date('2024-12-01'),
        category: 'CL',
        subcategory: '50° U.P.',
        totalBlIssued: 100,
        totalAlIssued: 28.5,
        applicableRate: 50,
        dutyAccrued: 5000,
        openingBalance: 1000,
        totalPayments: 3000,
        closingBalance: 3000
    });
    assertEqual(result.valid, true, 'Entry should be valid');
    assertEqual(result.errors.length, 0, 'Should have no errors');
});

test('Missing monthYear fails validation', () => {
    const result = validateDutyEntry({
        category: 'CL',
        subcategory: '50° U.P.',
        totalBlIssued: 100,
        applicableRate: 50,
        dutyAccrued: 5000
    });
    assertEqual(result.valid, false, 'Entry should be invalid');
    assertEqual(result.errors.some(e => e.includes('Month/Year')), true, 'Should have monthYear error');
});

test('Missing category fails validation', () => {
    const result = validateDutyEntry({
        monthYear: new Date('2024-12-01'),
        subcategory: '50° U.P.',
        totalBlIssued: 100,
        applicableRate: 50,
        dutyAccrued: 5000
    });
    assertEqual(result.valid, false, 'Entry should be invalid');
    assertEqual(result.errors.some(e => e.includes('Category')), true, 'Should have category error');
});

test('Missing subcategory fails validation', () => {
    const result = validateDutyEntry({
        monthYear: new Date('2024-12-01'),
        category: 'CL',
        totalBlIssued: 100,
        applicableRate: 50,
        dutyAccrued: 5000
    });
    assertEqual(result.valid, false, 'Entry should be invalid');
    assertEqual(result.errors.some(e => e.includes('Subcategory')), true, 'Should have subcategory error');
});

test('Negative BL fails validation', () => {
    const result = validateDutyEntry({
        monthYear: new Date('2024-12-01'),
        category: 'CL',
        subcategory: '50° U.P.',
        totalBlIssued: -100,
        applicableRate: 50,
        dutyAccrued: 5000
    });
    assertEqual(result.valid, false, 'Entry should be invalid');
    assertEqual(result.errors.some(e => e.includes('BL')), true, 'Should have BL error');
});

test('Incorrect closing balance fails validation', () => {
    const result = validateDutyEntry({
        monthYear: new Date('2024-12-01'),
        category: 'CL',
        subcategory: '50° U.P.',
        totalBlIssued: 100,
        applicableRate: 50,
        dutyAccrued: 5000,
        openingBalance: 1000,
        totalPayments: 3000,
        closingBalance: 9999 // Should be 3000
    });
    assertEqual(result.valid, false, 'Entry should be invalid');
    assertEqual(result.errors.some(e => e.includes('mismatch')), true, 'Should have balance mismatch error');
});

// ============================================
// Test: validateChallan
// ============================================
console.log('\n📊 Testing validateChallan()...\n');

test('Valid challan passes validation', () => {
    const result = validateChallan({
        challanNumber: 'TR/2024/12345',
        challanDate: new Date('2024-12-15'),
        dutyEntryId: 1,
        amountPaid: 5000
    });
    assertEqual(result.valid, true, 'Challan should be valid');
    assertEqual(result.errors.length, 0, 'Should have no errors');
});

test('Missing challan number fails validation', () => {
    const result = validateChallan({
        challanDate: new Date('2024-12-15'),
        dutyEntryId: 1,
        amountPaid: 5000
    });
    assertEqual(result.valid, false, 'Challan should be invalid');
    assertEqual(result.errors.some(e => e.includes('Challan number')), true, 'Should have challan number error');
});

test('Missing challan date fails validation', () => {
    const result = validateChallan({
        challanNumber: 'TR/2024/12345',
        dutyEntryId: 1,
        amountPaid: 5000
    });
    assertEqual(result.valid, false, 'Challan should be invalid');
    assertEqual(result.errors.some(e => e.includes('Challan date')), true, 'Should have challan date error');
});

test('Missing duty entry ID fails validation', () => {
    const result = validateChallan({
        challanNumber: 'TR/2024/12345',
        challanDate: new Date('2024-12-15'),
        amountPaid: 5000
    });
    assertEqual(result.valid, false, 'Challan should be invalid');
    assertEqual(result.errors.some(e => e.includes('Duty entry ID')), true, 'Should have duty entry ID error');
});

test('Zero amount fails validation', () => {
    const result = validateChallan({
        challanNumber: 'TR/2024/12345',
        challanDate: new Date('2024-12-15'),
        dutyEntryId: 1,
        amountPaid: 0
    });
    assertEqual(result.valid, false, 'Challan should be invalid');
    assertEqual(result.errors.some(e => e.includes('Amount')), true, 'Should have amount error');
});

test('Negative amount fails validation', () => {
    const result = validateChallan({
        challanNumber: 'TR/2024/12345',
        challanDate: new Date('2024-12-15'),
        dutyEntryId: 1,
        amountPaid: -5000
    });
    assertEqual(result.valid, false, 'Challan should be invalid');
    assertEqual(result.errors.some(e => e.includes('Amount')), true, 'Should have amount error');
});

test('Future date fails validation', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const result = validateChallan({
        challanNumber: 'TR/2024/12345',
        challanDate: futureDate,
        dutyEntryId: 1,
        amountPaid: 5000
    });
    assertEqual(result.valid, false, 'Challan should be invalid');
    assertEqual(result.errors.some(e => e.includes('future')), true, 'Should have future date error');
});

// ============================================
// Summary
// ============================================
console.log('\n' + '='.repeat(50));
console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total:  ${passed + failed}\n`);

if (failed === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
} else {
    console.log('⚠️  Some tests failed!\n');
    process.exit(1);
}
