# 📋 TODO: Register Engine Implementation
## SIP2LIFE Data Management System

**Last Updated:** 2025-12-27 14:05 IST  
**Project Status:** In Progress - 7 Registers to Implement  
**Completion:** 2/7 Registers Complete (28.5%)  
**Phase 1 Progress:** 100% Complete ✅ (4/4 tasks done)
**Current Branch:** `feature/phase2-regb-implementation` (recommended)

---

## 🎯 PROJECT OVERVIEW

Implementing all **7 Excise Registers** from the Streamlit prototype into SIP2LIFE:

1. ✅ **Reg-74** - Vat Operations Register (100% Complete)
2. ⚠️ **Reg-76** - Spirit Receipt Register (40% Complete)
3. ⚠️ **Reg-A** - Production & Bottling Register (70% Complete)
4. ❌ **Reg-B** - Issue of Country Liquor in Bottles (0% Complete)
5. ❌ **Excise Duty** - Personal Ledger Account (0% Complete)
6. ⚠️ **Reg-78** - Account of Spirit / Master Ledger (30% Complete)
7. ❌ **Daily Handbook** - Consolidated Daily Report (0% Complete)

**Reference:**
- 📚 Streamlit Demo: https://excise-parallel-register-system-msne7jvz35aflmgvkmefwb.streamlit.app/
- 💻 Source Code: https://github.com/saha-trideep/excise-parallel-register-system
- 📖 Developer Guide: https://github.com/saha-trideep/excise-parallel-register-system/blob/main/DEVELOPER_HANDOFF_GUIDE.md

---

## 🚀 DEPLOYMENT STRATEGY

**⚠️ IMPORTANT:** Since the app is live in production (Vercel + Render + Supabase), we use a **feature branch workflow** to avoid breaking changes.

### Git Workflow for Phase 2:

```bash
# Step 1: Create feature branch (do this once)
git checkout -b feature/phase2-regb-implementation

# Step 2: Work on tasks and commit regularly
git add .
git commit -m "feat(regb): add RegBEntry model to schema"

# Step 3: Push to GitHub after each major task
git push origin feature/phase2-regb-implementation

# Step 4: Only merge to main when Phase 2 is complete and tested
git checkout main
git merge feature/phase2-regb-implementation
git push origin main  # This triggers auto-deployment
```

### Push Schedule:
- ✅ **After Task 2.1 (Schema):** Push to feature branch
- ✅ **After Task 2.2 (Backend):** Push to feature branch
- ✅ **After Task 2.3 (Frontend):** Push to feature branch
- ✅ **After Phase 2 Complete:** Merge to main → Auto-deploy

**📖 Full Details:** See [DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md)

---

## 📊 CURRENT STATUS SUMMARY

| Component | Status | Files |
|-----------|--------|-------|
| **Prisma Schema** | 🟡 Partial | 4/7 models exist |
| **Backend APIs** | 🟡 Partial | 2/7 complete |
| **Frontend UI** | 🟡 Partial | 5/7 exist (not all connected) |
| **Calculations** | 🔴 Missing | 0/7 utility files |
| **Integration** | 🔴 Missing | No auto-fill mechanisms |

---

## 🚀 PHASE 1: FOUNDATION (WEEKS 1-2) - CURRENT PRIORITY

### 1.1 Shared Calculation Utilities Library
**Priority:** 🔥 CRITICAL - Required by all registers

- [x] Create `server/utils/spiritCalculations.js`
  - [x] `calculateBL(massKg, densityGmCc)` - Mass to Bulk Liters
  - [x] `calculateAL(bl, strengthPercent)` - BL to Absolute Liters
  - [x] `calculateStrength(al, bl)` - AL/BL to Strength %
  - [x] `calculateMass(bl, density)` - BL to Mass
  - [x] `temperatureCorrection(bl, currentTemp, targetTemp)` - Temp correction
  - [x] `densityAtTemperature(density, temp)` - Density correction
  - [x] `bottlesToBL(bottleCounts)` - Bottle counts to BL
  - [x] `blToBottles(bl, bottleSize)` - BL to bottle count
  - [x] `bottlesToAL(bottleCounts, strength)` - Bottle counts to AL

**Files Created:** ✅
```
server/utils/spiritCalculations.js
server/utils/test_spiritCalculations.js
```

**Test Results:** ✅ All tests passed!

---

### 1.2 Reg-76: Spirit Receipt Register - Backend
**Priority:** 🔥 CRITICAL - Entry point of the system

**Status:** Schema ✅ | API ✅ | UI ⚠️ | Calc ✅

#### Backend API
- [x] Create `server/routes/reg76.js`
  - [x] POST `/api/registers/reg76` - Create entry
  - [x] GET `/api/registers/reg76` - List all entries
  - [x] GET `/api/registers/reg76/:id` - Get single entry
  - [x] PUT `/api/registers/reg76/:id` - Update entry
  - [x] DELETE `/api/registers/reg76/:id` - Delete entry
  - [x] GET `/api/registers/reg76` with filters - Filter by date/vehicle/distillery
  - [x] POST `/api/registers/reg76/calculate` - Calculate BL/AL/wastage
  - [x] GET `/api/registers/reg76/summary/stats` - Summary statistics

#### Calculation Utilities
- [x] Create `server/utils/reg76Calculations.js`
  - [x] `calculateReceivedValues()` - Calculate BL/AL from weigh bridge data
  - [x] `calculateReg76Wastage()` - Transit wastage with 0.5% threshold
  - [x] `validateReg76Entry()` - Comprehensive validation
  - [x] `calculateTransitDays()` - Days in transit
  - [x] `calculateAllReg76Values()` - All calculations at once

#### Integration
- [x] Register route in `server/index.js`
  ```javascript
  app.use('/api/registers/reg76', require('./routes/reg76'));
  ```

**Files Created:** ✅
```
server/routes/reg76.js (500+ lines)
server/utils/reg76Calculations.js (200+ lines)
```

**Features Implemented:**
- ✅ Full CRUD operations
- ✅ Filtering & pagination
- ✅ Auto-calculation of all values
- ✅ Audit logging
- ✅ Validation
- ✅ Summary statistics

**Reference:**
- See: `.agent/QUICK_START_GUIDE.md` → "Step-by-Step: Implementing Reg-76"

---

### 1.3 Reg-76: Spirit Receipt Register - Frontend
**Priority:** 🔥 CRITICAL

**Status:** Form ✅ | API ✅ | Calculations ✅ | UI ✅

- [x] Update `client/src/pages/excise/Reg76Form.jsx`
  - [x] Change API endpoint to `/api/registers/reg76`
  - [x] Add real-time calculation on field change (already working)
  - [x] Add calculation preview section (enhanced)
  - [x] Add wastage indicator with chargeable status
  - [x] Add validation feedback
  - [x] Add success/error toast notifications
  - [x] Add missing field: `tankerMakeModel`
  - [x] Add missing field: `avgTemperature`
  - [x] Enhanced wastage display with:
    - Wastage percentage
    - Allowable limit (0.5%)
    - Chargeable wastage amount
    - Visual status indicator (red/green)

- [ ] Update `client/src/pages/excise/Reg76List.jsx`
  - [ ] Connect to new API endpoint
  - [ ] Add filters (date range, vehicle, distillery)
  - [ ] Add wastage summary
  - [ ] Add export to CSV/Excel
  - [ ] Add delete confirmation

**Files Updated:** ✅
```
client/src/pages/excise/Reg76Form.jsx (Complete)
```

**Features Implemented:**
- ✅ All required input fields
- ✅ Real-time BL/AL calculations
- ✅ Enhanced wastage analysis
- ✅ Beautiful gradient UI
- ✅ Dark mode support
- ✅ Connected to new backend API
- ✅ Validation and error handling

---

### 1.4 Reg-A: Production & Bottling - Enhancement
**Priority:** 🔥 HIGH - 70% complete, needs bottle calculations

**Status:** Schema ✅ | API ⚠️ | UI ⚠️ | Calc ❌

#### Backend Enhancement
- [x] Update `server/routes/regA.js`
  - [x] Add POST `/api/registers/rega/calculate` endpoint
  - [x] Add bottle-to-BL/AL calculation in finalize
  - [x] Fix wastage calculation (0.1% threshold)
  - [x] Add multi-session validation (already in schema/routes)

- [x] Create `server/utils/regACalculations.js`
  - [x] `bottlesToBL(bottleCounts)` - Calculate BL from 6 bottle sizes
  - [x] `bottlesToAL(bottleCounts, strength)` - Calculate AL from bottles
  - [x] `calculateProductionWastage(mfmAl, bottledAl)` - 0.1% threshold
  - [x] `validateBottleCounts(counts)` - Ensure realistic values

#### Frontend Enhancement
- [x] Update `client/src/pages/excise/RegABatchRegister.jsx`
  - [x] Add real-time BL/AL calculation from bottle counts
  - [x] Add bottle count input validation
  - [x] Add wastage indicator
  - [x] Add calculation preview section
  - [x] Add session selector for multi-day production
  - [x] Test bottle calculations match Streamlit

**Files Updated:** ✅
```
server/routes/regA.js
server/utils/regACalculations.js (NEW)
client/src/pages/excise/RegABatchRegister.jsx
```

**Bottle Sizes to Support:**
- 750ml, 600ml, 500ml, 375ml, 300ml, 180ml

---

## 🚀 PHASE 2: REG-B IMPLEMENTATION (WEEKS 3-4)

### 2.1 Reg-B: Database Schema
**Priority:** 🔥 CRITICAL - Completely missing

- [ ] Add `RegBEntry` model to `server/prisma/schema.prisma`
  ```prisma
  model RegBEntry {
    id              Int      @id @default(autoincrement())
    entryDate       DateTime
    batchId         Int?
    batch           BatchMaster? @relation(fields: [batchId], references: [id])
    
    // Opening Stock (6 sizes × 4 strengths = 24 fields)
    opening750_50   Int      @default(0)
    opening750_60   Int      @default(0)
    opening750_70   Int      @default(0)
    opening750_80   Int      @default(0)
    // ... repeat for 600, 500, 375, 300, 180ml
    
    // Receipt from Reg-A (24 fields)
    receipt750_50   Int      @default(0)
    // ... all sizes and strengths
    
    // Issues (24 fields)
    issue750_50     Int      @default(0)
    // ... all sizes and strengths
    
    // Wastage/Breakage (24 fields)
    wastage750_50   Int      @default(0)
    // ... all sizes and strengths
    
    // Calculated totals
    totalOpeningBl  Float?
    totalOpeningAl  Float?
    totalReceiptBl  Float?
    totalReceiptAl  Float?
    totalIssueBl    Float?
    totalIssueAl    Float?
    totalWastageBl  Float?
    totalWastageAl  Float?
    totalClosingBl  Float?
    totalClosingAl  Float?
    
    productionFees  Float?   // ₹3 per bottle issued
    
    remarks         String?
    createdBy       Int
    user            User     @relation(fields: [createdBy], references: [id])
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
    
    @@index([entryDate])
    @@index([batchId])
  }
  ```

- [ ] Update `User` model to add relation:
  ```prisma
  model User {
    // ... existing fields
    regBEntries     RegBEntry[]
  }
  ```

- [ ] Update `BatchMaster` model to add relation:
  ```prisma
  model BatchMaster {
    // ... existing fields
    regBEntries     RegBEntry[]
  }
  ```

- [ ] Run migration:
  ```bash
  npx prisma migrate dev --name add_regb_model
  npx prisma generate
  ```

**Files to Update:**
```
server/prisma/schema.prisma
```

---

### 2.2 Reg-B: Backend API
**Priority:** 🔥 CRITICAL

- [ ] Create `server/routes/regB.js`
  - [ ] POST `/api/registers/regb` - Create daily entry
  - [ ] GET `/api/registers/regb` - List all entries
  - [ ] GET `/api/registers/regb/:id` - Get single entry
  - [ ] PUT `/api/registers/regb/:id` - Update entry
  - [ ] DELETE `/api/registers/regb/:id` - Delete entry
  - [ ] GET `/api/registers/regb/auto-fill/:date` - Auto-fill from Reg-A
  - [ ] POST `/api/registers/regb/calculate` - Calculate totals and fees

- [ ] Create `server/utils/regBCalculations.js`
  - [ ] `calculateTotals(bottleCounts, strength)` - Calculate BL/AL for each section
  - [ ] `calculateProductionFees(issuedBottles)` - ₹3 per bottle
  - [ ] `validateBalance(opening, receipt, issue, wastage, closing)` - Balance check
  - [ ] `autoFillFromRegA(batchId, date)` - Get production data

- [ ] Register route in `server/server.js`:
  ```javascript
  app.use('/api/registers/regb', require('./routes/regB'));
  ```

**Files to Create:**
```
server/routes/regB.js
server/utils/regBCalculations.js
```

---

### 2.3 Reg-B: Frontend UI
**Priority:** 🔥 CRITICAL

- [ ] Create `client/src/pages/excise/RegBRegister.jsx`
  - [ ] Date selector
  - [ ] Batch selector (optional)
  - [ ] Auto-fill button (from Reg-A)
  - [ ] Grid layout: 6 sizes × 4 strengths
  - [ ] Four sections: Opening, Receipt, Issue, Wastage
  - [ ] Real-time calculation display
  - [ ] Production fees display
  - [ ] Balance validation
  - [ ] Save/Submit functionality
  - [ ] Dark mode support

- [ ] Create `client/src/components/registers/BottleCountGrid.jsx`
  - [ ] Reusable grid component
  - [ ] 6 rows (bottle sizes) × 4 columns (strengths)
  - [ ] Input validation
  - [ ] Auto-calculation
  - [ ] Copy/paste support

**Files to Create:**
```
client/src/pages/excise/RegBRegister.jsx
client/src/components/registers/BottleCountGrid.jsx
```

**Grid Layout:**
```
         | 50° U.P. | 60° U.P. | 70° U.P. | 80° U.P. |
---------|----------|----------|----------|----------|
750ml    |    [  ]  |    [  ]  |    [  ]  |    [  ]  |
600ml    |    [  ]  |    [  ]  |    [  ]  |    [  ]  |
500ml    |    [  ]  |    [  ]  |    [  ]  |    [  ]  |
375ml    |    [  ]  |    [  ]  |    [  ]  |    [  ]  |
300ml    |    [  ]  |    [  ]  |    [  ]  |    [  ]  |
180ml    |    [  ]  |    [  ]  |    [  ]  |    [  ]  |
```

---

## 🚀 PHASE 3: EXCISE DUTY REGISTER (WEEKS 5-6)

### 3.1 Excise Duty: Database Schema
**Priority:** 🔥 HIGH

- [ ] Add `ExciseDutyEntry` model to `server/prisma/schema.prisma`
- [ ] Add `DutyRate` configuration model
- [ ] Update `User` model relation
- [ ] Run migration

**Files to Update:**
```
server/prisma/schema.prisma
```

---

### 3.2 Excise Duty: Backend API
**Priority:** 🔥 HIGH

- [ ] Create `server/routes/exciseDuty.js`
- [ ] Create `server/utils/exciseDutyCalculations.js`
- [ ] Register route

**Files to Create:**
```
server/routes/exciseDuty.js
server/utils/exciseDutyCalculations.js
```

---

### 3.3 Excise Duty: Frontend UI
**Priority:** 🔥 HIGH

- [ ] Create `client/src/pages/excise/ExciseDutyRegister.jsx`
- [ ] E-Challan entry form
- [ ] Auto-fill from Reg-B
- [ ] Balance display

**Files to Create:**
```
client/src/pages/excise/ExciseDutyRegister.jsx
```

---

## 🚀 PHASE 4: REG-78 & DAILY HANDBOOK (WEEKS 7-8)

### 4.1 Reg-78: Enhancement
**Priority:** 🟡 MEDIUM

- [ ] Add `Reg78Entry` model to schema
- [ ] Update `server/routes/reg78.js` with CRUD
- [ ] Update `client/src/pages/excise/Reg78Register.jsx`

**Files to Update:**
```
server/prisma/schema.prisma
server/routes/reg78.js
client/src/pages/excise/Reg78Register.jsx
```

---

### 4.2 Daily Handbook: Implementation
**Priority:** 🟡 MEDIUM

- [ ] Create `server/routes/dailyHandbook.js`
- [ ] Create `server/utils/handbookGenerator.js`
- [ ] Create `client/src/pages/excise/DailyHandbook.jsx`
- [ ] PDF generation
- [ ] Email functionality

**Files to Create:**
```
server/routes/dailyHandbook.js
server/utils/handbookGenerator.js
client/src/pages/excise/DailyHandbook.jsx
```

---

## 🚀 PHASE 5: INTEGRATION & TESTING (WEEKS 9-10)

### 5.1 Auto-fill Mechanisms
- [ ] Reg-74 auto-fills from Reg-76 (unloading)
- [ ] Reg-A auto-fills from Reg-74 (batch creation)
- [ ] Reg-B auto-fills from Reg-A (production)
- [ ] Excise Duty auto-fills from Reg-B
- [ ] Reg-78 auto-aggregates from all
- [ ] Daily Handbook auto-generates

---

### 5.2 Validation & Business Rules
- [ ] Reg-76: Transit wastage (0.5% threshold)
- [ ] Reg-74: Storage wastage (0.3% threshold)
- [ ] Reg-A: Production wastage (0.1% threshold)
- [ ] Reg-B: Balance validation
- [ ] Excise Duty: Balance validation
- [ ] Reg-78: Reconciliation

---

### 5.3 Testing
- [ ] Unit tests for calculation utilities
- [ ] API endpoint tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Sample data generation

---

### 5.4 Documentation
- [ ] API documentation
- [ ] User manual for each register
- [ ] Calculation formulas reference
- [ ] Data flow diagrams
- [ ] Deployment guide

---

## 📦 DELIVERABLES CHECKLIST

### Database
- [ ] RegBEntry model
- [ ] ExciseDutyEntry model
- [ ] Reg78Entry model
- [ ] DutyRate model
- [ ] All migrations run
- [ ] Seed data created

### Backend (9 files)
- [ ] `server/routes/reg76.js`
- [ ] `server/routes/regB.js`
- [ ] `server/routes/exciseDuty.js`
- [ ] `server/routes/dailyHandbook.js`
- [ ] `server/utils/spiritCalculations.js`
- [ ] `server/utils/reg76Calculations.js`
- [ ] `server/utils/regACalculations.js`
- [ ] `server/utils/regBCalculations.js`
- [ ] `server/utils/exciseDutyCalculations.js`

### Frontend (6 files)
- [ ] `client/src/pages/excise/RegBRegister.jsx`
- [ ] `client/src/pages/excise/ExciseDutyRegister.jsx`
- [ ] `client/src/pages/excise/DailyHandbook.jsx`
- [ ] `client/src/components/registers/BottleCountGrid.jsx`
- [ ] `client/src/components/registers/CalculationDisplay.jsx`
- [ ] `client/src/components/registers/WastageIndicator.jsx`

### Testing
- [ ] Unit tests
- [ ] API tests
- [ ] Integration tests
- [ ] E2E tests

---

## 🎯 QUICK WINS (Do These First!)

1. ✅ **Create shared calculation utilities** (1-2 days)
   - Foundation for all registers
   - Can be tested independently

2. ✅ **Complete Reg-76 backend** (2-3 days)
   - Entry point of the system
   - Schema already exists

3. ✅ **Connect Reg-76 frontend** (1 day)
   - Form already exists
   - Just needs API connection

4. ✅ **Enhance Reg-A calculations** (1-2 days)
   - 70% done already
   - Just add bottle calculations

---

## 📊 PROGRESS TRACKING

**Overall Progress:** 28.5% (2/7 registers complete)

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Foundation | ✅ Complete | 100% |
| Phase 2: Reg-B | 🔴 Not Started | 0% |
| Phase 3: Excise Duty | 🔴 Not Started | 0% |
| Phase 4: Reg-78 & Handbook | 🔴 Not Started | 0% |
| Phase 5: Integration | 🔴 Not Started | 0% |

**Phase 1 Details:**
- ✅ Task 1.1: Shared Calculation Utilities (100%)
- ✅ Task 1.2: Reg-76 Backend API (100%)
- ✅ Task 1.3: Reg-76 Frontend (100%)
- ✅ Task 1.4: Reg-A Enhancement (100%)

**Update this section as you complete tasks!**

---

## 📞 RESOURCES

### Documentation
- 📖 [REGISTER_STATUS_MATRIX.md](.agent/REGISTER_STATUS_MATRIX.md) - Current status
- 📖 [COMPLETE_REGISTER_IMPLEMENTATION_PLAN.md](.agent/COMPLETE_REGISTER_IMPLEMENTATION_PLAN.md) - Full plan
- 📖 [QUICK_START_GUIDE.md](.agent/QUICK_START_GUIDE.md) - Code examples

### External Links
- 🌐 [Streamlit Demo](https://excise-parallel-register-system-msne7jvz35aflmgvkmefwb.streamlit.app/)
- 💻 [GitHub Source](https://github.com/saha-trideep/excise-parallel-register-system)
- 📚 [Developer Guide](https://github.com/saha-trideep/excise-parallel-register-system/blob/main/DEVELOPER_HANDOFF_GUIDE.md)

---

## 🔄 NEXT SESSION INSTRUCTIONS

**When you start a new session with the AI, say:**

> "Please read TODO.md and continue from where we left off."

The AI will:
1. Read this TODO.md file
2. Check what's completed
3. Suggest the next task to work on
4. Continue implementation

**To mark a task as complete:**
- Change `- [ ]` to `- [x]`
- Update the progress tracking section
- Commit your changes

---

**Last Updated:** 2025-12-26 16:10 IST  
**Next Review:** When starting next session  
**Estimated Completion:** 10 weeks from start date
