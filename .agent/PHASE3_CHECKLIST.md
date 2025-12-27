# Phase 3: Excise Duty Register - Implementation Checklist

**Created:** 2025-12-27  
**Target Completion:** 10-12 days  
**Team:** Backend Dev + Frontend Dev + AI Assistant

---

## 📋 Pre-Implementation (Day 0)

### **Review & Planning**
- [ ] Backend dev reads `PHASE3_SCHEMA_DRAFT.md`
- [ ] Backend dev reads `PHASE3_API_SPEC.md`
- [ ] Team meeting to discuss 5 critical questions:
  - [ ] Rate change handling (mid-month scenarios)
  - [ ] Multi-category support approach
  - [ ] Document storage location (Supabase/Cloudinary)
  - [ ] Audit logging requirements
  - [ ] Auto-generation vs manual trigger
- [ ] Finalize any schema/API adjustments
- [ ] Create feature branch: `feature/phase3-excise-duty`

---

## 🗄️ Database Implementation (Days 1-2)

### **Task 3.1: Database Schema**
**Owner:** Backend Developer  
**Estimated Time:** 4-6 hours

- [ ] **Add Models to `schema.prisma`:**
  - [ ] Add `DutyRate` model
  - [ ] Add `ExciseDutyEntry` model
  - [ ] Add `TreasuryChallan` model
  - [ ] Update `User` model with relations:
    ```prisma
    exciseDutyEntries  ExciseDutyEntry[]
    treasuryChallans   TreasuryChallan[]
    ```

- [ ] **Run Migration:**
  ```bash
  cd server
  npx prisma db push
  npx prisma generate
  ```

- [ ] **Verify Schema:**
  - [ ] Check tables created in Supabase
  - [ ] Verify indexes are applied
  - [ ] Test relations in Prisma Studio

- [ ] **Seed Initial Data:**
  - [ ] Create `server/prisma/seed-duty-rates.js`
  - [ ] Add initial rates for IMFL, Beer, Wine, CL
  - [ ] Run seed script:
    ```bash
    node server/prisma/seed-duty-rates.js
    ```

- [ ] **Commit:**
  ```bash
  git add .
  git commit -m "feat(phase3): add Excise Duty database schema"
  git push origin feature/phase3-excise-duty
  ```

**Acceptance Criteria:**
- ✅ All 3 models exist in database
- ✅ Relations work correctly
- ✅ Initial duty rates are seeded
- ✅ No migration errors

---

## ⚙️ Backend API Implementation (Days 3-5)

### **Task 3.2: Calculation Utilities**
**Owner:** Backend Developer  
**Estimated Time:** 3-4 hours

- [ ] **Create `server/utils/exciseDutyCalculations.js`:**
  - [ ] `getCurrentDutyRate(category, date)` - Fetch active rate
  - [ ] `calculateDutyAccrued(alIssued, rate)` - AL × Rate
  - [ ] `calculateClosingBalance(opening, accrued, payments)` - Balance equation
  - [ ] `determineStatus(closingBalance, totalLiability)` - PENDING/PARTIAL/FULLY_PAID
  - [ ] `validateDutyEntry(data)` - Input validation
  - [ ] `validateChallan(data)` - Challan validation

- [ ] **Write Unit Tests:**
  - [ ] Test rate fetching with date ranges
  - [ ] Test duty calculation accuracy
  - [ ] Test balance equation
  - [ ] Test status transitions

- [ ] **Commit:**
  ```bash
  git add .
  git commit -m "feat(phase3): add excise duty calculation utilities"
  git push origin feature/phase3-excise-duty
  ```

---

### **Task 3.3: API Routes**
**Owner:** Backend Developer  
**Estimated Time:** 8-10 hours

- [ ] **Create `server/routes/exciseDuty.js`:**

#### **Duty Rates Endpoints (4 endpoints)**
- [ ] `GET /api/excise-duty/rates` - List rates
- [ ] `POST /api/excise-duty/rates` - Create rate
- [ ] `PUT /api/excise-duty/rates/:id` - Update rate
- [ ] `DELETE /api/excise-duty/rates/:id` - Deactivate rate

#### **Duty Ledger Endpoints (5 endpoints)**
- [ ] `GET /api/excise-duty/ledger` - List entries
- [ ] `GET /api/excise-duty/ledger/:id` - Get single entry
- [ ] `POST /api/excise-duty/ledger` - Create entry
- [ ] `PUT /api/excise-duty/ledger/:id` - Update entry
- [ ] `DELETE /api/excise-duty/ledger/:id` - Delete entry

#### **Challan Endpoints (4 endpoints)**
- [ ] `POST /api/excise-duty/challans` - Record payment
- [ ] `GET /api/excise-duty/challans` - List challans
- [ ] `PUT /api/excise-duty/challans/:id/verify` - Verify challan
- [ ] `DELETE /api/excise-duty/challans/:id` - Delete challan

#### **Auto-Generation & Reports (3 endpoints)**
- [ ] `POST /api/excise-duty/generate-monthly` - Auto-create entries
- [ ] `POST /api/excise-duty/calculate` - Preview calculation
- [ ] `GET /api/excise-duty/summary/stats` - Dashboard stats
- [ ] `GET /api/excise-duty/summary/monthly-report/:monthYear` - Monthly report

- [ ] **Register Route in `server/index.js`:**
  ```javascript
  app.use('/api/excise-duty', require('./routes/exciseDuty'));
  ```

- [ ] **Add Audit Logging:**
  - [ ] All create/update/delete operations
  - [ ] Challan recording and verification
  - [ ] Monthly generation events

- [ ] **Commit:**
  ```bash
  git add .
  git commit -m "feat(phase3): implement excise duty API endpoints"
  git push origin feature/phase3-excise-duty
  ```

**Acceptance Criteria:**
- ✅ All 12 endpoints functional
- ✅ Request/response match API spec
- ✅ Validation works correctly
- ✅ Audit logs are created
- ✅ Integration with Reg-B works

---

### **Task 3.4: Integration Testing**
**Owner:** Backend Developer  
**Estimated Time:** 2-3 hours

- [ ] **Test with Postman/Insomnia:**
  - [ ] Create duty rate
  - [ ] Generate monthly entry (auto-fill from Reg-B)
  - [ ] Record challan (payment)
  - [ ] Verify balance updates
  - [ ] Test status transitions
  - [ ] Test summary stats

- [ ] **Test Edge Cases:**
  - [ ] Duplicate challan numbers
  - [ ] Future-dated entries
  - [ ] Negative amounts
  - [ ] Missing Reg-B data
  - [ ] Rate changes mid-month

- [ ] **Document Any Issues:**
  - [ ] Create GitHub issues for bugs
  - [ ] Note deviations from spec

- [ ] **Commit:**
  ```bash
  git add .
  git commit -m "test(phase3): add integration tests for excise duty API"
  git push origin feature/phase3-excise-duty
  ```

---

## 🎨 Frontend Implementation (Days 6-9)

### **Task 3.5: Reusable Components**
**Owner:** Frontend Developer  
**Estimated Time:** 4-5 hours

- [ ] **Create `client/src/components/excise/DutyLedgerTable.jsx`:**
  - [ ] Table component for monthly ledger view
  - [ ] Columns: Month, Category, Opening, Accrued, Payments, Closing, Status
  - [ ] Sortable and filterable
  - [ ] Dark mode support

- [ ] **Create `client/src/components/excise/ChallanForm.jsx`:**
  - [ ] Form for recording treasury challans
  - [ ] Fields: TR Number, Date, Amount, Bank, Branch
  - [ ] File upload for scanned copy
  - [ ] Validation and error display

- [ ] **Create `client/src/components/excise/DutyRateConfig.jsx`:**
  - [ ] Admin panel for managing duty rates
  - [ ] Grid view of all rates
  - [ ] Add/Edit/Deactivate functionality
  - [ ] Effective date tracking

- [ ] **Commit:**
  ```bash
  git add .
  git commit -m "feat(phase3): add excise duty reusable components"
  git push origin feature/phase3-excise-duty
  ```

---

### **Task 3.6: Main Page**
**Owner:** Frontend Developer  
**Estimated Time:** 6-8 hours

- [ ] **Create `client/src/pages/excise/ExciseDutyRegister.jsx`:**

#### **Dashboard View**
- [ ] Summary cards:
  - [ ] Total Duty Accrued (current month)
  - [ ] Total Payments Made
  - [ ] Outstanding Balance
  - [ ] Number of Pending Entries
- [ ] Visual progress bar (Paid vs Liability)
- [ ] Monthly ledger table (using `DutyLedgerTable` component)
- [ ] Filter by date range, category, status

#### **Entry Modal**
- [ ] Date/Month selector
- [ ] Category dropdown
- [ ] Auto-fill button (triggers `/generate-monthly`)
- [ ] Display calculated values:
  - [ ] Opening Balance
  - [ ] AL Issued (from Reg-B)
  - [ ] Applicable Rate
  - [ ] Duty Accrued
  - [ ] Closing Balance
- [ ] Save/Update functionality

#### **Challan Recording**
- [ ] "Record Payment" button
- [ ] Opens `ChallanForm` modal
- [ ] Links to selected duty entry
- [ ] Updates balance in real-time

#### **Rate Management**
- [ ] Admin-only section
- [ ] Uses `DutyRateConfig` component
- [ ] CRUD for duty rates

- [ ] **Add to Navigation:**
  - [ ] Update `client/src/App.jsx` with route:
    ```javascript
    <Route path="/registers/excise-duty" element={
      <ProtectedRoute>
        <ExciseDutyRegister />
      </ProtectedRoute>
    } />
    ```
  - [ ] Add card to `client/src/pages/Registers.jsx`

- [ ] **Theme Integration:**
  - [ ] Import `useTheme` hook
  - [ ] Add Sun/Moon toggle button
  - [ ] Ensure dark mode compatibility

- [ ] **Commit:**
  ```bash
  git add .
  git commit -m "feat(phase3): implement excise duty register UI"
  git push origin feature/phase3-excise-duty
  ```

**Acceptance Criteria:**
- ✅ Dashboard displays correct data
- ✅ Auto-fill from Reg-B works
- ✅ Challan recording updates balance
- ✅ Theme toggle works
- ✅ Responsive on mobile/tablet

---

## 🧪 Testing & QA (Days 10-11)

### **Task 3.7: End-to-End Testing**
**Owner:** Full Team  
**Estimated Time:** 4-6 hours

- [ ] **User Flow Testing:**
  - [ ] Create Reg-B entry (bottle issues)
  - [ ] Generate monthly duty entry
  - [ ] Verify AL totals match
  - [ ] Record challan payment
  - [ ] Check balance updates
  - [ ] Verify status changes

- [ ] **Multi-Month Scenario:**
  - [ ] Create entries for 3 consecutive months
  - [ ] Verify opening balance = previous closing
  - [ ] Test partial payments across months
  - [ ] Check cumulative balances

- [ ] **Rate Change Scenario:**
  - [ ] Create new duty rate
  - [ ] Deactivate old rate
  - [ ] Generate entry with new rate
  - [ ] Verify correct rate applied

- [ ] **Document Issues:**
  - [ ] Create bug reports for any issues
  - [ ] Prioritize fixes

---

### **Task 3.8: Bug Fixes & Polish**
**Owner:** Backend + Frontend  
**Estimated Time:** 3-4 hours

- [ ] Fix critical bugs
- [ ] Improve error messages
- [ ] Add loading states
- [ ] Optimize API calls
- [ ] Add toast notifications
- [ ] Final UI polish

- [ ] **Commit:**
  ```bash
  git add .
  git commit -m "fix(phase3): resolve bugs and polish UI"
  git push origin feature/phase3-excise-duty
  ```

---

## 🚀 Deployment (Day 12)

### **Task 3.9: Merge to Main**
**Owner:** Team Lead  
**Estimated Time:** 1-2 hours

- [ ] **Final Review:**
  - [ ] Code review on GitHub
  - [ ] Test on staging environment
  - [ ] Verify all acceptance criteria met

- [ ] **Merge to Main:**
  ```bash
  git checkout main
  git pull origin main
  git merge feature/phase3-excise-duty
  git push origin main
  ```

- [ ] **Monitor Deployment:**
  - [ ] Check Vercel build logs
  - [ ] Check Render deployment
  - [ ] Verify database migrations applied
  - [ ] Test live app

- [ ] **Update Documentation:**
  - [ ] Mark Phase 3 as complete in `TODO.md`
  - [ ] Update progress tracking
  - [ ] Create session summary

---

## 📊 Progress Tracking

### **Daily Standup Questions:**
1. What did you complete yesterday?
2. What will you work on today?
3. Any blockers?

### **Milestones:**
- [ ] **Day 2:** Database schema complete
- [ ] **Day 5:** Backend API complete
- [ ] **Day 9:** Frontend UI complete
- [ ] **Day 11:** Testing complete
- [ ] **Day 12:** Deployed to production

---

## 🎯 Definition of Done

Phase 3 is complete when:

- ✅ All 3 database models exist and are seeded
- ✅ All 12 API endpoints are functional
- ✅ Frontend UI is built and integrated
- ✅ Auto-fill from Reg-B works correctly
- ✅ Challan recording updates balances
- ✅ All tests pass
- ✅ Code is merged to `main`
- ✅ App is deployed to production
- ✅ Documentation is updated

---

## 📞 Communication

### **Daily Updates:**
- Post progress in team chat/Slack
- Tag blockers immediately
- Share screenshots of UI progress

### **Weekly Review:**
- End of Week 1: Backend demo
- End of Week 2: Full system demo

---

## 🆘 Troubleshooting

### **Common Issues:**

**Issue:** Reg-B integration returns no data  
**Solution:** Check date range in query params, ensure Reg-B entries exist

**Issue:** Balance calculation incorrect  
**Solution:** Verify formula: `opening + accrued - payments = closing`

**Issue:** Challan upload fails  
**Solution:** Check Supabase storage bucket permissions

**Issue:** Rate not found for category  
**Solution:** Ensure duty rates are seeded, check `isActive` flag

---

**Created by:** Antigravity AI  
**Last Updated:** 2025-12-27  
**Next Review:** Daily during implementation
