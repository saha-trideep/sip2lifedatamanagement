# 📋 Frontend Developer Instructions - Phase 3: Excise Duty Register

**Date:** 2025-12-29  
**Priority:** HIGH  
**Estimated Time:** 12-15 hours  
**Status:** Backend Complete ✅ | Frontend Ready to Start 🟡

---

## 🎯 Objective

Build the complete frontend UI for the **Excise Duty Register** (Phase 3). This register tracks excise duty payments for Country Liquor based on strength (50°, 60°, 70°, 80° U.P.) with BL-based duty rates.

---

## 📚 Background & Context

### What is the Excise Duty Register?

The Excise Duty Register is a **Personal Ledger Account** that tracks:
- Monthly duty accrued based on bottles issued (from Reg-B)
- Payments made via Treasury Challans
- Outstanding balances
- Status tracking (PENDING, PARTIAL_PAID, FULLY_PAID)

### Duty Calculation Formula

```
Duty = BL × Rate (based on strength)

Rates:
- 50° U.P. (28.5% v/v) → ₹50/BL
- 60° U.P. (22.8% v/v) → ₹50/BL
- 70° U.P. (17.1% v/v) → ₹20/BL
- 80° U.P. (11.4% v/v) → ₹17/BL
```

### Balance Equation

```
Closing Balance = Opening Balance + Duty Accrued - Total Payments
```

---

## 🗂️ Files to Create

You need to create **4 React components**:

### 1. Main Page (Required)
```
client/src/pages/excise/ExciseDutyRegister.jsx
```

### 2. Reusable Components (Required)
```
client/src/components/excise/DutyLedgerTable.jsx
client/src/components/excise/ChallanForm.jsx
client/src/components/excise/DutyRateConfig.jsx
```

---

## 🎨 UI Design Requirements

### Main Page Layout

The `ExciseDutyRegister.jsx` should have **3 main sections**:

```
┌─────────────────────────────────────────────────────┐
│  📊 Excise Duty Register              [🌙 Theme]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐│
│  │ Total   │  │ Total   │  │ Outstand│  │ Pending││
│  │ Accrued │  │ Payments│  │ Balance │  │ Entries││
│  │ ₹23,100 │  │ ₹15,000 │  │ ₹8,100  │  │   3    ││
│  └─────────┘  └─────────┘  └─────────┘  └────────┘│
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ ━━━━━━━━━━━━ Progress Bar ━━━━━━━━━━━━━━━━ │  │
│  │ Paid: 65%  ████████████░░░░░░  Outstanding   │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  [+ New Entry]  [Record Payment]  [Filter ▼]       │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         Monthly Duty Ledger Table           │   │
│  ├──────┬──────┬────────┬────────┬──────┬──────┤   │
│  │Month │Stren │Opening │Accrued │Paid  │Status│   │
│  ├──────┼──────┼────────┼────────┼──────┼──────┤   │
│  │Dec'24│50°UP │₹1,000  │₹5,000  │₹3,000│PART  │   │
│  │Dec'24│60°UP │₹2,000  │₹10,000 │₹7,000│PART  │   │
│  │Dec'24│70°UP │₹0      │₹3,000  │₹3,000│FULL  │   │
│  │Dec'24│80°UP │₹500    │₹5,100  │₹2,000│PART  │   │
│  └──────┴──────┴────────┴────────┴──────┴──────┘   │
│                                                     │
│  [Admin Only: Manage Duty Rates]                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints Available

The backend is **100% complete** with 12 endpoints. Here are the key ones you'll use:

### 1. Get Dashboard Stats
```javascript
GET /api/excise-duty/summary/stats?monthYear=2024-12-01

Response:
{
  "success": true,
  "data": {
    "totalDutyAccrued": 23100,
    "totalPayments": 15000,
    "outstandingBalance": 8100,
    "pendingEntries": 1,
    "partialPaidEntries": 2,
    "fullyPaidEntries": 1,
    "byStrength": {
      "50": { "bl": 100, "duty": 5000, "payments": 3000, "balance": 2000 },
      "60": { "bl": 200, "duty": 10000, "payments": 7000, "balance": 3000 },
      "70": { "bl": 150, "duty": 3000, "payments": 3000, "balance": 0 },
      "80": { "bl": 300, "duty": 5100, "payments": 2000, "balance": 3100 }
    }
  }
}
```

### 2. List Duty Entries
```javascript
GET /api/excise-duty/ledger?page=1&limit=50

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "monthYear": "2024-12-01T00:00:00.000Z",
      "category": "CL",
      "subcategory": "50° U.P.",
      "totalBlIssued": 100,
      "totalAlIssued": 28.5,
      "applicableRate": 50,
      "dutyAccrued": 5000,
      "openingBalance": 1000,
      "totalPayments": 3000,
      "closingBalance": 3000,
      "status": "PARTIAL_PAID",
      "challans": [
        {
          "id": 1,
          "challanNumber": "TR/2024/12345",
          "amountPaid": 3000,
          "challanDate": "2024-12-15T00:00:00.000Z"
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 4, "pages": 1 }
}
```

### 3. Create Duty Entry
```javascript
POST /api/excise-duty/ledger
Body:
{
  "monthYear": "2024-12-01",
  "category": "CL",
  "subcategory": "50° U.P.",
  "totalBlIssued": 100,
  "totalAlIssued": 28.5
}

Response:
{
  "success": true,
  "data": { /* duty entry with auto-calculated values */ },
  "message": "Duty entry created successfully"
}
```

### 4. Record Payment (Challan)
```javascript
POST /api/excise-duty/challans
Body:
{
  "dutyEntryId": 1,
  "challanNumber": "TR/2024/12345",
  "challanDate": "2024-12-15",
  "amountPaid": 3000,
  "bankName": "State Bank of India",
  "branchName": "Kolkata Main"
}

Response:
{
  "success": true,
  "data": { /* challan details */ },
  "message": "Challan recorded successfully"
}
```

### 5. Preview Calculation (Before Saving)
```javascript
POST /api/excise-duty/calculate
Body:
{
  "category": "CL",
  "subcategory": "50° U.P.",
  "totalBlIssued": 100
}

Response:
{
  "success": true,
  "data": {
    "totalBlIssued": 100,
    "applicableRate": 50,
    "dutyAccrued": 5000
  }
}
```

**Full API Documentation:** See `server/routes/exciseDuty.js` for all 12 endpoints

---

## 📋 Component Specifications

### 1. ExciseDutyRegister.jsx (Main Page)

**Location:** `client/src/pages/excise/ExciseDutyRegister.jsx`

**Requirements:**

#### A. Dashboard Section
- [ ] **4 Summary Cards:**
  - Total Duty Accrued (current month)
  - Total Payments Made
  - Outstanding Balance
  - Number of Pending Entries
- [ ] **Visual Progress Bar:**
  - Show percentage paid vs outstanding
  - Use gradient colors (green for paid, red for outstanding)
- [ ] **Fetch Data:** Use `GET /api/excise-duty/summary/stats`

#### B. Action Buttons
- [ ] **"+ New Entry" Button:**
  - Opens modal/form to create duty entry
  - Fields: Month/Year, Strength (dropdown), BL Issued, AL Issued
  - Shows preview calculation before saving
  - Calls `POST /api/excise-duty/ledger`
- [ ] **"Record Payment" Button:**
  - Opens `ChallanForm` component
  - Links to selected duty entry
- [ ] **Filter Dropdown:**
  - Filter by month, strength, status

#### C. Ledger Table
- [ ] Use `DutyLedgerTable` component
- [ ] Fetch data from `GET /api/excise-duty/ledger`
- [ ] Show: Month, Strength, Opening, Accrued, Payments, Closing, Status
- [ ] Click row to view details (challans)
- [ ] Actions: Edit, Delete (if no challans)

#### D. Admin Section (Role-based)
- [ ] Only show if user role is ADMIN
- [ ] "Manage Duty Rates" button
- [ ] Opens `DutyRateConfig` component

#### E. Theme Integration
- [ ] Import `useTheme` hook
- [ ] Add Sun/Moon toggle button (top-right)
- [ ] Ensure all colors work in dark mode
- [ ] Use Tailwind dark mode classes

**Reference:** Look at `client/src/pages/excise/RegBRegister.jsx` for similar structure

---

### 2. DutyLedgerTable.jsx (Reusable Component)

**Location:** `client/src/components/excise/DutyLedgerTable.jsx`

**Requirements:**

- [ ] **Table Columns:**
  - Month/Year
  - Category
  - Strength (Subcategory)
  - Opening Balance
  - Duty Accrued
  - Total Payments
  - Closing Balance
  - Status (badge with color)
- [ ] **Sortable Columns:** Click header to sort
- [ ] **Status Badges:**
  - PENDING: Red badge
  - PARTIAL_PAID: Yellow badge
  - FULLY_PAID: Green badge
- [ ] **Row Click:** Expand to show challans
- [ ] **Actions Column:** Edit, Delete icons
- [ ] **Dark Mode Support:** Use conditional Tailwind classes
- [ ] **Responsive:** Stack on mobile

**Props:**
```javascript
{
  entries: Array,        // Duty entries from API
  onEdit: Function,      // Callback when edit clicked
  onDelete: Function,    // Callback when delete clicked
  onRowClick: Function   // Callback when row clicked
}
```

**Reference:** Look at `client/src/components/excise/BottleCountGrid.jsx` for component structure

---

### 3. ChallanForm.jsx (Reusable Component)

**Location:** `client/src/components/excise/ChallanForm.jsx`

**Requirements:**

- [ ] **Form Fields:**
  - Duty Entry (dropdown - select from list)
  - Challan Number (text input, required)
  - Challan Date (date picker, required)
  - Amount Paid (number input, required, ₹)
  - Bank Name (text input, optional)
  - Branch Name (text input, optional)
  - Remarks (textarea, optional)
- [ ] **File Upload:** For scanned challan copy (optional)
- [ ] **Validation:**
  - All required fields
  - Amount > 0
  - Date not in future
  - Unique challan number
- [ ] **Preview Section:**
  - Show selected duty entry details
  - Show current balance
  - Show new balance after payment
- [ ] **Submit:** Call `POST /api/excise-duty/challans`
- [ ] **Success:** Show toast notification, close form, refresh parent

**Props:**
```javascript
{
  dutyEntryId: Number,   // Pre-selected duty entry (optional)
  onSuccess: Function,   // Callback after successful save
  onCancel: Function     // Callback when cancel clicked
}
```

**Reference:** Look at existing form components in `client/src/pages/excise/`

---

### 4. DutyRateConfig.jsx (Admin Component)

**Location:** `client/src/components/excise/DutyRateConfig.jsx`

**Requirements:**

- [ ] **Admin Only:** Check user role before rendering
- [ ] **Rate List Table:**
  - Columns: Category, Strength, Rate (₹/BL), Effective From, Effective To, Active
  - Show all rates from `GET /api/excise-duty/rates`
- [ ] **Add New Rate Button:**
  - Opens form modal
  - Fields: Category, Strength, Rate, Effective From, Effective To
  - Calls `POST /api/excise-duty/rates`
- [ ] **Edit Rate:** Inline editing or modal
  - Calls `PUT /api/excise-duty/rates/:id`
- [ ] **Deactivate Rate:** Toggle active status
  - Calls `DELETE /api/excise-duty/rates/:id` (soft delete)
- [ ] **Validation:**
  - Rate must be positive
  - Effective From required
  - Effective To must be after Effective From

**Props:**
```javascript
{
  // No props needed, self-contained
}
```

---

## 🎨 Design Guidelines

### Colors & Theme

**Light Mode:**
- Background: `bg-gray-50`
- Cards: `bg-white` with `shadow-md`
- Primary: `bg-blue-600` (buttons)
- Success: `bg-green-500` (FULLY_PAID)
- Warning: `bg-yellow-500` (PARTIAL_PAID)
- Danger: `bg-red-500` (PENDING)

**Dark Mode:**
- Background: `dark:bg-gray-900`
- Cards: `dark:bg-gray-800`
- Text: `dark:text-gray-100`
- Borders: `dark:border-gray-700`

### Typography
- Headers: `text-2xl font-bold`
- Subheaders: `text-lg font-semibold`
- Body: `text-sm`
- Numbers: `font-mono` (for currency)

### Spacing
- Card padding: `p-6`
- Section margin: `mb-6`
- Button spacing: `space-x-4`

### Icons
Use **Lucide React** icons (already in project):
```javascript
import { Plus, Download, Filter, Edit, Trash2, Check, X } from 'lucide-react';
```

---

## 🔗 Navigation Integration

### Add Route to App.jsx

**File:** `client/src/App.jsx`

```javascript
import ExciseDutyRegister from './pages/excise/ExciseDutyRegister';

// Add route:
<Route 
  path="/registers/excise-duty" 
  element={
    <ProtectedRoute>
      <ExciseDutyRegister />
    </ProtectedRoute>
  } 
/>
```

### Add Card to Registers.jsx

**File:** `client/src/pages/Registers.jsx`

```javascript
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h3 className="text-xl font-semibold mb-2">💰 Excise Duty Register</h3>
  <p className="text-gray-600 dark:text-gray-400 mb-4">
    Personal ledger account of excise duty for IML
  </p>
  <Link 
    to="/registers/excise-duty"
    className="text-blue-600 dark:text-blue-400 hover:underline"
  >
    Open Register →
  </Link>
</div>
```

---

## 📝 Implementation Checklist

### Day 1: Setup & Dashboard (4-5 hours)
- [ ] Create `ExciseDutyRegister.jsx` file
- [ ] Build dashboard section (summary cards)
- [ ] Add progress bar
- [ ] Fetch and display stats from API
- [ ] Add theme toggle
- [ ] Test dark mode

### Day 2: Ledger Table (3-4 hours)
- [ ] Create `DutyLedgerTable.jsx` component
- [ ] Build table with all columns
- [ ] Add sorting functionality
- [ ] Add status badges
- [ ] Implement row click to expand
- [ ] Add edit/delete actions
- [ ] Test with API data

### Day 3: Forms (4-5 hours)
- [ ] Create `ChallanForm.jsx` component
- [ ] Build all form fields
- [ ] Add validation
- [ ] Add preview section
- [ ] Integrate with API
- [ ] Add success/error notifications
- [ ] Create duty entry form in main page
- [ ] Test create/update flows

### Day 4: Admin & Polish (3-4 hours)
- [ ] Create `DutyRateConfig.jsx` component
- [ ] Build rate management table
- [ ] Add CRUD functionality
- [ ] Add role-based access control
- [ ] Add filters to main page
- [ ] Add navigation links
- [ ] Final testing
- [ ] Bug fixes

---

## 🧪 Testing Checklist

### Functional Testing
- [ ] Dashboard stats load correctly
- [ ] Can create new duty entry
- [ ] Can record payment (challan)
- [ ] Balance updates after payment
- [ ] Status changes correctly (PENDING → PARTIAL_PAID → FULLY_PAID)
- [ ] Can edit duty entry
- [ ] Can delete duty entry (only if no challans)
- [ ] Can verify/reject challan (admin)
- [ ] Can manage duty rates (admin)
- [ ] Filters work correctly

### UI/UX Testing
- [ ] Theme toggle works
- [ ] Dark mode looks good
- [ ] Responsive on mobile/tablet
- [ ] Loading states show
- [ ] Error messages display
- [ ] Success toasts appear
- [ ] Forms validate properly
- [ ] Tables sort correctly

### Edge Cases
- [ ] Empty state (no entries)
- [ ] Large numbers format correctly
- [ ] Date formatting is consistent
- [ ] Duplicate challan number rejected
- [ ] Future date rejected
- [ ] Negative amounts rejected

---

## 📚 Reference Files

**Look at these existing files for examples:**

1. **Similar Page Structure:**
   - `client/src/pages/excise/RegBRegister.jsx` (best reference)
   - `client/src/pages/excise/Reg76Form.jsx`

2. **Component Patterns:**
   - `client/src/components/excise/BottleCountGrid.jsx`

3. **Theme Integration:**
   - Any file using `useTheme` hook

4. **API Calls:**
   - `client/src/pages/excise/RegBRegister.jsx` (fetch/post patterns)

---

## 🆘 Common Issues & Solutions

### Issue: API returns 401 Unauthorized
**Solution:** Check if auth token is included in request headers

### Issue: Dark mode colors not working
**Solution:** Use `dark:` prefix for all color classes

### Issue: Date formatting issues
**Solution:** Use `new Date(dateString).toLocaleDateString('en-IN')`

### Issue: Numbers not formatting as currency
**Solution:** Use `new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)`

---

## 📞 Questions?

If you have any questions:
1. Check the backend API file: `server/routes/exciseDuty.js`
2. Check the calculation utilities: `server/utils/exciseDutyCalculations.js`
3. Look at the Streamlit reference: https://excise-parallel-register-system-msne7jvz35aflmgvkmefwb.streamlit.app/
4. Ask the backend developer

---

## ✅ Definition of Done

Frontend is complete when:
- ✅ All 4 components created
- ✅ Dashboard displays correct data
- ✅ Can create duty entries
- ✅ Can record payments
- ✅ Balance updates automatically
- ✅ Theme toggle works
- ✅ Responsive on all devices
- ✅ No console errors
- ✅ All API calls working
- ✅ Navigation integrated

---

**Good luck! 🚀**

**Estimated Completion:** 12-15 hours (2-3 days)  
**Priority:** HIGH  
**Deadline:** TBD

---

**Created by:** Antigravity AI  
**Date:** 2025-12-29  
**Phase:** 3 - Excise Duty Register  
**Backend Status:** ✅ Complete  
**Frontend Status:** 🟡 Ready to Start
