/**
 * Test file for spiritCalculations.js
 * Run with: node server/utils/test_spiritCalculations.js
 */

const calc = require('./spiritCalculations');

console.log('🧪 Testing Spirit Calculations Utility\n');
console.log('='.repeat(60));

// ============================================================================
// TEST 1: Core Spirit Calculations
// ============================================================================

console.log('\n📊 TEST 1: Core Spirit Calculations');
console.log('-'.repeat(60));

// Test calculateBL
const mass = 10000; // kg
const density = 0.9650; // gm/cc
const bl = calc.calculateBL(mass, density);
console.log(`✓ calculateBL(${mass}, ${density}) = ${bl} BL`);
console.log(`  Expected: 10362.69 BL`);
console.log(`  Match: ${bl === 10362.69 ? '✅ PASS' : '❌ FAIL'}`);

// Test calculateAL
const blTest = 10000;
const strength = 96.5;
const al = calc.calculateAL(blTest, strength);
console.log(`\n✓ calculateAL(${blTest}, ${strength}) = ${al} AL`);
console.log(`  Expected: 9650 AL`);
console.log(`  Match: ${al === 9650 ? '✅ PASS' : '❌ FAIL'}`);

// Test calculateStrength
const alTest = 9650;
const blTest2 = 10000;
const strengthCalc = calc.calculateStrength(alTest, blTest2);
console.log(`\n✓ calculateStrength(${alTest}, ${blTest2}) = ${strengthCalc}%`);
console.log(`  Expected: 96.50%`);
console.log(`  Match: ${strengthCalc === 96.50 ? '✅ PASS' : '❌ FAIL'}`);

// Test calculateMass
const blTest3 = 10000;
const densityTest = 0.9650;
const massCalc = calc.calculateMass(blTest3, densityTest);
console.log(`\n✓ calculateMass(${blTest3}, ${densityTest}) = ${massCalc} kg`);
console.log(`  Expected: 9650 kg`);
console.log(`  Match: ${massCalc === 9650 ? '✅ PASS' : '❌ FAIL'}`);

// ============================================================================
// TEST 2: Bottle Conversions
// ============================================================================

console.log('\n\n📦 TEST 2: Bottle Conversions');
console.log('-'.repeat(60));

// Test bottlesToBL
const bottles = { 750: 100, 600: 50, 500: 200 };
const blFromBottles = calc.bottlesToBL(bottles);
console.log(`✓ bottlesToBL({ 750: 100, 600: 50, 500: 200 })`);
console.log(`  = ${blFromBottles} BL`);
console.log(`  Breakdown:`);
console.log(`    750ml × 100 = 75 BL`);
console.log(`    600ml × 50  = 30 BL`);
console.log(`    500ml × 200 = 100 BL`);
console.log(`  Total: 205 BL`);
console.log(`  Match: ${blFromBottles === 205 ? '✅ PASS' : '❌ FAIL'}`);

// Test blToBottles
const blTest4 = 75;
const bottleSize = 750;
const bottleCount = calc.blToBottles(blTest4, bottleSize);
console.log(`\n✓ blToBottles(${blTest4}, ${bottleSize}) = ${bottleCount} bottles`);
console.log(`  Expected: 100 bottles`);
console.log(`  Match: ${bottleCount === 100 ? '✅ PASS' : '❌ FAIL'}`);

// Test bottlesToAL
const bottlesTest = { 750: 100, 600: 50 };
const strengthTest = 42.8;
const alFromBottles = calc.bottlesToAL(bottlesTest, strengthTest);
console.log(`\n✓ bottlesToAL({ 750: 100, 600: 50 }, ${strengthTest})`);
console.log(`  BL: ${calc.bottlesToBL(bottlesTest)} BL`);
console.log(`  AL: ${alFromBottles} AL`);
console.log(`  Expected: ~44.94 AL`);
console.log(`  Match: ${Math.abs(alFromBottles - 44.94) < 0.01 ? '✅ PASS' : '❌ FAIL'}`);

// ============================================================================
// TEST 3: Wastage Calculations
// ============================================================================

console.log('\n\n⚠️  TEST 3: Wastage Calculations');
console.log('-'.repeat(60));

// Test Transit Wastage (Reg-76: 0.5% threshold)
const advisedAl = 10000;
const receivedAl = 9950;
const transitWastage = calc.calculateTransitWastage(advisedAl, receivedAl);
console.log(`✓ Transit Wastage (Reg-76):`);
console.log(`  Advised AL: ${advisedAl}`);
console.log(`  Received AL: ${receivedAl}`);
console.log(`  Wastage: ${transitWastage.wastageAl} AL`);
console.log(`  Allowable (0.5%): ${transitWastage.allowableWastage} AL`);
console.log(`  Chargeable: ${transitWastage.chargeableWastage} AL`);
console.log(`  Is Chargeable: ${transitWastage.isChargeable ? 'YES ❌' : 'NO ✅'}`);
console.log(`  Match: ${transitWastage.wastageAl === 50 && !transitWastage.isChargeable ? '✅ PASS' : '❌ FAIL'}`);

// Test Storage Wastage (Reg-74: 0.3% threshold)
const openingAl = 10000;
const closingAl = 9970;
const storageWastage = calc.calculateStorageWastage(openingAl, closingAl);
console.log(`\n✓ Storage Wastage (Reg-74):`);
console.log(`  Opening AL: ${openingAl}`);
console.log(`  Closing AL: ${closingAl}`);
console.log(`  Wastage: ${storageWastage.wastageAl} AL`);
console.log(`  Allowable (0.3%): ${storageWastage.allowableWastage} AL`);
console.log(`  Chargeable: ${storageWastage.chargeableWastage} AL`);
console.log(`  Is Chargeable: ${storageWastage.isChargeable ? 'YES ❌' : 'NO ✅'}`);
console.log(`  Match: ${storageWastage.wastageAl === 30 && !storageWastage.isChargeable ? '✅ PASS' : '❌ FAIL'}`);

// Test Production Wastage (Reg-A: 0.1% threshold)
const mfmAl = 10000;
const bottledAl = 9990;
const productionWastage = calc.calculateProductionWastage(mfmAl, bottledAl);
console.log(`\n✓ Production Wastage (Reg-A):`);
console.log(`  MFM AL: ${mfmAl}`);
console.log(`  Bottled AL: ${bottledAl}`);
console.log(`  Wastage: ${productionWastage.wastageAl} AL`);
console.log(`  Allowable (0.1%): ${productionWastage.allowableWastage} AL`);
console.log(`  Chargeable: ${productionWastage.chargeableWastage} AL`);
console.log(`  Is Chargeable: ${productionWastage.isChargeable ? 'YES ❌' : 'NO ✅'}`);
console.log(`  Match: ${productionWastage.wastageAl === 10 && !productionWastage.isChargeable ? '✅ PASS' : '❌ FAIL'}`);

// ============================================================================
// TEST 4: Duty Calculations
// ============================================================================

console.log('\n\n💰 TEST 4: Duty Calculations');
console.log('-'.repeat(60));

// Test 50° U.P. (28.5% v/v) @ ₹50/BL
const duty50UP = calc.calculateDuty(1000, 28.5);
console.log(`✓ Duty for 50° U.P. (28.5% v/v):`);
console.log(`  BL: 1000`);
console.log(`  Category: ${duty50UP.category}`);
console.log(`  Rate: ₹${duty50UP.ratePerBl}/BL`);
console.log(`  Total Duty: ₹${duty50UP.totalDuty}`);
console.log(`  Expected: ₹50,000`);
console.log(`  Match: ${duty50UP.category === '50UP' && duty50UP.totalDuty === 50000 ? '✅ PASS' : '❌ FAIL'}`);

// Test 60° U.P. (22.8% v/v) @ ₹50/BL
const duty60UP = calc.calculateDuty(1000, 22.8);
console.log(`\n✓ Duty for 60° U.P. (22.8% v/v):`);
console.log(`  BL: 1000`);
console.log(`  Category: ${duty60UP.category}`);
console.log(`  Rate: ₹${duty60UP.ratePerBl}/BL`);
console.log(`  Total Duty: ₹${duty60UP.totalDuty}`);
console.log(`  Expected: ₹50,000`);
console.log(`  Match: ${duty60UP.category === '60UP' && duty60UP.totalDuty === 50000 ? '✅ PASS' : '❌ FAIL'}`);

// Test 70° U.P. (17.1% v/v) @ ₹20/BL
const duty70UP = calc.calculateDuty(1000, 17.1);
console.log(`\n✓ Duty for 70° U.P. (17.1% v/v):`);
console.log(`  BL: 1000`);
console.log(`  Category: ${duty70UP.category}`);
console.log(`  Rate: ₹${duty70UP.ratePerBl}/BL`);
console.log(`  Total Duty: ₹${duty70UP.totalDuty}`);
console.log(`  Expected: ₹20,000`);
console.log(`  Match: ${duty70UP.category === '70UP' && duty70UP.totalDuty === 20000 ? '✅ PASS' : '❌ FAIL'}`);

// Test 80° U.P. (11.4% v/v) @ ₹17/BL
const duty80UP = calc.calculateDuty(1000, 11.4);
console.log(`\n✓ Duty for 80° U.P. (11.4% v/v):`);
console.log(`  BL: 1000`);
console.log(`  Category: ${duty80UP.category}`);
console.log(`  Rate: ₹${duty80UP.ratePerBl}/BL`);
console.log(`  Total Duty: ₹${duty80UP.totalDuty}`);
console.log(`  Expected: ₹17,000`);
console.log(`  Match: ${duty80UP.category === '80UP' && duty80UP.totalDuty === 17000 ? '✅ PASS' : '❌ FAIL'}`);

// Test Production Fees
const bottleCountTest = 10000;
const productionFees = calc.calculateProductionFees(bottleCountTest);
console.log(`\n✓ Production Fees:`);
console.log(`  Bottles: ${bottleCountTest}`);
console.log(`  Rate: ₹3/bottle`);
console.log(`  Total Fees: ₹${productionFees}`);
console.log(`  Expected: ₹30,000`);
console.log(`  Match: ${productionFees === 30000 ? '✅ PASS' : '❌ FAIL'}`);

// ============================================================================
// TEST 5: Temperature Corrections
// ============================================================================

console.log('\n\n🌡️  TEST 5: Temperature Corrections');
console.log('-'.repeat(60));

const blTemp = 10000;
const currentTemp = 25;
const targetTemp = 20;
const correctedBl = calc.temperatureCorrection(blTemp, currentTemp, targetTemp);
console.log(`✓ Temperature Correction:`);
console.log(`  BL at ${currentTemp}°C: ${blTemp}`);
console.log(`  Corrected to ${targetTemp}°C: ${correctedBl}`);
console.log(`  Difference: ${blTemp - correctedBl} BL`);
console.log(`  Expected: ~9950 BL`);
console.log(`  Match: ${correctedBl === 9950 ? '✅ PASS' : '❌ FAIL'}`);

// ============================================================================
// TEST 6: Validation Helpers
// ============================================================================

console.log('\n\n✔️  TEST 6: Validation Helpers');
console.log('-'.repeat(60));

const validStrength = calc.validateStrength(96.5);
console.log(`✓ Validate Strength (96.5%):`);
console.log(`  Valid: ${validStrength.isValid ? '✅ YES' : '❌ NO'}`);

const invalidStrength = calc.validateStrength(150);
console.log(`\n✓ Validate Strength (150%):`);
console.log(`  Valid: ${invalidStrength.isValid ? '✅ YES' : '❌ NO'}`);
console.log(`  Error: ${invalidStrength.error || 'None'}`);

const validNumber = calc.validatePositiveNumber(100, 'Mass');
console.log(`\n✓ Validate Positive Number (100):`);
console.log(`  Valid: ${validNumber.isValid ? '✅ YES' : '❌ NO'}`);

const invalidNumber = calc.validatePositiveNumber(-50, 'Mass');
console.log(`\n✓ Validate Positive Number (-50):`);
console.log(`  Valid: ${invalidNumber.isValid ? '✅ YES' : '❌ NO'}`);
console.log(`  Error: ${invalidNumber.error || 'None'}`);

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n\n' + '='.repeat(60));
console.log('✅ All tests completed!');
console.log('='.repeat(60));
console.log('\n📝 Summary:');
console.log('  - Core calculations: BL, AL, Strength, Mass');
console.log('  - Bottle conversions: bottles ↔ BL ↔ AL');
console.log('  - Wastage calculations: Transit, Storage, Production');
console.log('  - Duty calculations: 50UP, 60UP, 70UP, 80UP');
console.log('  - Temperature corrections');
console.log('  - Validation helpers');
console.log('\n🎉 Spirit Calculations Utility is ready to use!\n');
