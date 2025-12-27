# 🚀 Quick Start Guide: Register Engine Implementation

## For the SIP2LIFE Developer

**Date:** 2025-12-26  
**Streamlit Demo:** https://excise-parallel-register-system-msne7jvz35aflmgvkmefwb.streamlit.app/  
**Source Code:** https://github.com/saha-trideep/excise-parallel-register-system

---

## 📚 Essential Reading

Before you start, read these documents in order:

1. **REGISTER_STATUS_MATRIX.md** ← Start here! (Current file location status)
2. **COMPLETE_REGISTER_IMPLEMENTATION_PLAN.md** ← Full implementation details
3. **DEVELOPER_HANDOFF_GUIDE.md** (from Streamlit repo) ← Technical specs

---

## 🎯 The 7 Registers - Quick Reference

| # | Register | What It Does | Status |
|---|----------|--------------|--------|
| 1 | **Reg-76** | Tracks spirit arriving from other distilleries | 40% |
| 2 | **Reg-74** | Tracks vat operations (SST/BRT) | ✅ 100% |
| 3 | **Reg-A** | Tracks production and bottling | 70% |
| 4 | **Reg-B** | Tracks bottle distribution | 0% |
| 5 | **Excise Duty** | Tracks duty payments | 0% |
| 6 | **Reg-78** | Master ledger (aggregates all) | 30% |
| 7 | **Daily Handbook** | Daily consolidated report | 0% |

---

## 🏃 Quick Start: What to Do First

### Option 1: Start with Reg-76 (Recommended)
This is the entry point of the entire system. Spirit comes in via Reg-76.

```bash
# 1. Create the backend API
touch server/routes/reg76.js
touch server/utils/reg76Calculations.js

# 2. Implement CRUD operations
# See: COMPLETE_REGISTER_IMPLEMENTATION_PLAN.md → Phase 1

# 3. Connect to existing UI
# File: client/src/pages/excise/Reg76Form.jsx
```

### Option 2: Create Shared Utilities First
Build the calculation library that all registers will use.

```bash
# Create the utilities
touch server/utils/spiritCalculations.js

# Implement core functions:
# - calculateBL(massKg, density)
# - calculateAL(bl, strength)
# - calculateWastage(advised, received, threshold)
# - bottlesToBL(bottleCounts)
```

### Option 3: Complete Reg-A
Finish the production register by adding bottle calculations.

```bash
# Enhance existing files
# server/routes/regA.js
# client/src/pages/excise/RegABatchRegister.jsx
```

---

## 📋 Step-by-Step: Implementing Reg-76

### Step 1: Create the API Route

**File:** `server/routes/reg76.js`

```javascript
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');
const { calculateBL, calculateAL, calculateWastage } = require('../utils/reg76Calculations');

const router = express.Router();
const prisma = new PrismaClient();

// CREATE
router.post('/', verifyToken, async (req, res) => {
    try {
        const data = req.body;
        
        // Calculate received values
        const receivedMass = data.ladenWeightKg - data.unladenWeightKg;
        const receivedBl = calculateBL(receivedMass, data.avgDensity);
        const receivedAl = calculateAL(receivedBl, data.receivedStrength);
        
        // Calculate wastage
        const { transitWastageBl, transitWastageAl } = calculateWastage(
            data.advisedBl,
            data.advisedAl,
            receivedBl,
            receivedAl
        );
        
        const entry = await prisma.reg76Entry.create({
            data: {
                ...data,
                receivedMass,
                receivedBl,
                receivedAl,
                transitWastageBl,
                transitWastageAl,
                createdBy: req.user.id
            }
        });
        
        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// READ ALL
router.get('/', verifyToken, async (req, res) => {
    try {
        const entries = await prisma.reg76Entry.findMany({
            include: { user: { select: { name: true } } },
            orderBy: { receiptDate: 'desc' }
        });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// READ ONE
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const entry = await prisma.reg76Entry.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { user: { select: { name: true } } }
        });
        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const data = req.body;
        
        // Recalculate
        const receivedMass = data.ladenWeightKg - data.unladenWeightKg;
        const receivedBl = calculateBL(receivedMass, data.avgDensity);
        const receivedAl = calculateAL(receivedBl, data.receivedStrength);
        const { transitWastageBl, transitWastageAl } = calculateWastage(
            data.advisedBl,
            data.advisedAl,
            receivedBl,
            receivedAl
        );
        
        const entry = await prisma.reg76Entry.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...data,
                receivedMass,
                receivedBl,
                receivedAl,
                transitWastageBl,
                transitWastageAl
            }
        });
        
        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await prisma.reg76Entry.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

### Step 2: Create Calculation Utilities

**File:** `server/utils/reg76Calculations.js`

```javascript
/**
 * Calculate Bulk Liters (BL) from mass and density
 * Formula: BL = Mass (kg) / Density (gm/cc)
 */
function calculateBL(massKg, densityGmCc) {
    if (!massKg || !densityGmCc) return 0;
    return massKg / densityGmCc;
}

/**
 * Calculate Absolute Liters (AL) from BL and strength
 * Formula: AL = BL × (Strength % / 100)
 */
function calculateAL(bl, strengthPercent) {
    if (!bl || !strengthPercent) return 0;
    return bl * (strengthPercent / 100);
}

/**
 * Calculate transit wastage
 * Returns: { transitWastageBl, transitWastageAl, isChargeable }
 */
function calculateWastage(advisedBl, advisedAl, receivedBl, receivedAl) {
    const transitWastageBl = advisedBl - receivedBl;
    const transitWastageAl = advisedAl - receivedAl;
    
    // Allowable wastage: 0.5% of advised AL
    const allowableWastage = advisedAl * 0.005;
    const chargeableWastage = Math.max(0, transitWastageAl - allowableWastage);
    
    return {
        transitWastageBl: Math.round(transitWastageBl * 100) / 100,
        transitWastageAl: Math.round(transitWastageAl * 100) / 100,
        allowableWastage: Math.round(allowableWastage * 100) / 100,
        chargeableWastage: Math.round(chargeableWastage * 100) / 100,
        isChargeable: chargeableWastage > 0
    };
}

/**
 * Temperature correction for BL
 * Corrects volume to 20°C standard
 */
function temperatureCorrection(bl, currentTemp, targetTemp = 20) {
    // Simplified correction factor: 0.001 per degree Celsius
    const tempDiff = currentTemp - targetTemp;
    const correctionFactor = 1 - (tempDiff * 0.001);
    return bl * correctionFactor;
}

module.exports = {
    calculateBL,
    calculateAL,
    calculateWastage,
    temperatureCorrection
};
```

### Step 3: Register the Route

**File:** `server/server.js` (or `server/index.js`)

```javascript
// Add this line with other route imports
const reg76Routes = require('./routes/reg76');

// Add this line with other route registrations
app.use('/api/registers/reg76', reg76Routes);
```

### Step 4: Connect Frontend

**File:** `client/src/pages/excise/Reg76Form.jsx`

Update the API endpoint:

```javascript
// Change from:
// const API_URL = '/api/excise/reg76'

// To:
const API_URL = '/api/registers/reg76'

// Add real-time calculation
const handleCalculate = () => {
    const receivedMass = formData.ladenWeightKg - formData.unladenWeightKg;
    const receivedBl = receivedMass / formData.avgDensity;
    const receivedAl = receivedBl * (formData.receivedStrength / 100);
    const transitWastageAl = formData.advisedAl - receivedAl;
    
    setFormData({
        ...formData,
        receivedMass,
        receivedBl,
        receivedAl,
        transitWastageAl
    });
};
```

---

## 🧮 Key Formulas Reference

### Spirit Calculations

```
BL (Bulk Liters) = Mass (kg) ÷ Density (gm/cc)

AL (Absolute Liters) = BL × (Strength % ÷ 100)

Strength % = (AL ÷ BL) × 100

Mass (kg) = BL × Density (gm/cc)
```

### Wastage Thresholds

```
Transit Wastage (Reg-76):
  Allowable = 0.5% of Advised AL
  Chargeable = Actual Wastage - Allowable

Storage Wastage (Reg-74):
  Allowable = 0.3% of Opening AL
  Chargeable = Actual Wastage - Allowable

Production Wastage (Reg-A):
  Allowable = 0.1% of MFM AL
  Chargeable = Actual Wastage - Allowable
```

### Bottle Conversions

```
BL from Bottles:
  BL = Σ(Bottle Count × Bottle Size in ml) ÷ 1000

Example:
  750ml × 100 bottles = 75,000 ml = 75 BL
  600ml × 50 bottles = 30,000 ml = 30 BL
  Total = 105 BL
```

### Duty Calculations

```
Duty Amount = BL × Duty Rate

Duty Rates:
  50° U.P. (28.5% v/v) → ₹50 per BL
  60° U.P. (22.8% v/v) → ₹50 per BL
  70° U.P. (17.1% v/v) → ₹20 per BL
  80° U.P. (11.4% v/v) → ₹17 per BL
```

---

## 🔄 Data Flow Example

Here's how data flows through the system for a typical production run:

### Day 1: Spirit Arrival
```
Reg-76: Record receipt of 10,000 BL ENA @ 96.5% strength
  ↓
Calculated: 9,650 AL received
Transit Wastage: 50 AL (within 0.5% threshold)
Storage Vat: SST-5
```

### Day 2: Vat Operations
```
Reg-74: UNLOADING event
  Source: Reg-76 entry #123
  Vat: SST-5
  Quantity: 10,000 BL @ 96.5% = 9,650 AL
  ↓
Reg-74: INTERNAL_TRANSFER event
  From: SST-5
  To: BRT-11
  Quantity: 5,000 BL @ 96.5% = 4,825 AL
  ↓
Reg-74: WATER_ADDITION event
  Vat: BRT-11
  Water Added: 6,500 BL
  Final: 11,500 BL @ 42.8% = 4,922 AL
```

### Day 3: Production
```
Reg-A: Create Batch "10AJD01"
  Source: BRT-11
  Blend: 11,500 BL @ 42.8% = 4,922 AL
  ↓
Reg-A: Production Session 1
  MFM Reading: 11,450 BL @ 42.8% = 4,900 AL
  Bottles Produced:
    750ml × 10,000 = 7,500 BL
    600ml × 5,000 = 3,000 BL
    500ml × 2,000 = 1,000 BL
  Total Bottled: 11,500 BL @ 42.8% = 4,922 AL
  Wastage: 0 AL (within 0.1% threshold)
```

### Day 4: Distribution
```
Reg-B: Issue bottles
  Opening: 10,000 × 750ml + 5,000 × 600ml + 2,000 × 500ml
  Issues: 8,000 × 750ml + 4,000 × 600ml
  Wastage: 50 × 750ml (breakage)
  Closing: 1,950 × 750ml + 1,000 × 600ml + 2,000 × 500ml
  Production Fees: 12,000 bottles × ₹3 = ₹36,000
```

### Day 5: Duty Payment
```
Excise Duty: Calculate duty
  Issued: 8,000 × 750ml + 4,000 × 600ml = 8,400 BL @ 42.8%
  Strength Category: 60° U.P. (22.8% v/v)
  Duty: 8,400 BL × ₹50 = ₹4,20,000
  E-Challan: #CH123456 dated 26-Dec-2025
  Balance: ₹4,20,000 paid
```

### Daily: Master Ledger
```
Reg-78: Daily entry
  Opening AL: 9,650
  Receipts: 0
  Issues: 4,900 AL (production)
  Wastage: 0 AL
  Closing AL: 4,750 AL
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Calculation Mismatch
**Problem:** BL/AL calculations don't match Streamlit
**Solution:** Check decimal precision. Round to 2 decimal places.

```javascript
// Wrong
const bl = mass / density;

// Right
const bl = Math.round((mass / density) * 100) / 100;
```

### Issue 2: Wastage Not Calculating
**Problem:** Wastage shows 0 even when there's difference
**Solution:** Ensure you're comparing AL, not BL

```javascript
// Wrong
const wastage = advisedBl - receivedBl;

// Right
const wastage = advisedAl - receivedAl;
```

### Issue 3: Auto-fill Not Working
**Problem:** Reg-B doesn't auto-fill from Reg-A
**Solution:** Ensure batch ID is passed correctly

```javascript
// In Reg-B API
const regAEntries = await prisma.regAEntry.findMany({
    where: {
        batchId: parseInt(batchId),
        status: 'COMPLETED'
    }
});
```

---

## 📞 Need Help?

1. **Check the Streamlit Demo:** https://excise-parallel-register-system-msne7jvz35aflmgvkmefwb.streamlit.app/
2. **Review the Source Code:** https://github.com/saha-trideep/excise-parallel-register-system
3. **Read the Full Plan:** COMPLETE_REGISTER_IMPLEMENTATION_PLAN.md
4. **Check Status Matrix:** REGISTER_STATUS_MATRIX.md

---

## ✅ Quick Checklist

Before you start coding:
- [ ] Read REGISTER_STATUS_MATRIX.md
- [ ] Read COMPLETE_REGISTER_IMPLEMENTATION_PLAN.md
- [ ] Explore Streamlit demo
- [ ] Review Prisma schema
- [ ] Understand data flow

For each register you implement:
- [ ] Create Prisma model (if missing)
- [ ] Create backend API route
- [ ] Create calculation utilities
- [ ] Create/update frontend UI
- [ ] Add validation
- [ ] Test with sample data
- [ ] Connect to other registers
- [ ] Add audit logging

---

**Ready to start? Begin with Reg-76!** 🚀
