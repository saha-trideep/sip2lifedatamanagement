# Phase 3: Excise Duty Register - API Specification

**Date:** 2025-12-27  
**Version:** 1.0  
**Status:** Draft for Backend Implementation

---

## 📋 Overview

This document specifies the complete REST API for the **Excise Duty Register** module. It includes:
- 12 API endpoints
- Request/response formats
- Business logic requirements
- Error handling
- Integration points with Reg-B

---

## 🔐 Authentication

All endpoints require JWT authentication via the `Authorization` header:

```http
Authorization: Bearer <token>
```

Middleware: `verifyToken` (existing)

---

## 📡 API Endpoints

### **1. Duty Rates Management**

#### **1.1 GET /api/excise-duty/rates**
Get all duty rates (with optional filtering).

**Query Parameters:**
```javascript
{
  category?: string,      // Filter by category (IMFL, Beer, etc.)
  isActive?: boolean,     // Filter active/inactive rates
  effectiveDate?: string  // Get rates effective on this date
}
```

**Response (200 OK):**
```json
{
  "rates": [
    {
      "id": 1,
      "category": "IMFL",
      "subcategory": null,
      "ratePerAl": 150.00,
      "effectiveFrom": "2024-04-01T00:00:00.000Z",
      "effectiveTo": null,
      "state": "West Bengal",
      "isActive": true,
      "remarks": "FY 2024-25 rate",
      "createdAt": "2024-04-01T10:00:00.000Z",
      "updatedAt": "2024-04-01T10:00:00.000Z"
    }
  ],
  "total": 4
}
```

**Business Logic:**
- If `effectiveDate` is provided, return only rates valid on that date
- Default to active rates if no filter specified
- Order by `category` ASC, `effectiveFrom` DESC

---

#### **1.2 POST /api/excise-duty/rates**
Create a new duty rate.

**Request Body:**
```json
{
  "category": "IMFL",
  "subcategory": "Premium",
  "ratePerAl": 175.00,
  "effectiveFrom": "2025-01-01",
  "effectiveTo": null,
  "state": "West Bengal",
  "remarks": "New year rate revision"
}
```

**Response (201 Created):**
```json
{
  "message": "Duty rate created successfully",
  "rate": { /* full rate object */ }
}
```

**Validation:**
- `category` is required
- `ratePerAl` must be > 0
- `effectiveFrom` is required
- If `effectiveTo` is provided, it must be > `effectiveFrom`

**Business Logic:**
- Auto-deactivate overlapping rates for the same category
- Log audit entry: `action: 'DUTY_RATE_CREATED'`

---

#### **1.3 PUT /api/excise-duty/rates/:id**
Update an existing duty rate.

**Request Body:** (Same as POST, all fields optional)

**Response (200 OK):**
```json
{
  "message": "Duty rate updated successfully",
  "rate": { /* updated rate object */ }
}
```

**Business Logic:**
- Cannot update if rate is already in use (has linked duty entries)
- Log audit entry: `action: 'DUTY_RATE_UPDATED'`

---

#### **1.4 DELETE /api/excise-duty/rates/:id**
Delete a duty rate (soft delete by setting `isActive = false`).

**Response (200 OK):**
```json
{
  "message": "Duty rate deactivated successfully"
}
```

**Business Logic:**
- Cannot delete if rate is in use
- Set `isActive = false` instead of hard delete

---

### **2. Duty Ledger Management**

#### **2.1 GET /api/excise-duty/ledger**
Get all duty ledger entries (monthly statements).

**Query Parameters:**
```javascript
{
  startMonth?: string,  // YYYY-MM format
  endMonth?: string,    // YYYY-MM format
  category?: string,    // Filter by category
  status?: string,      // PENDING, PARTIAL_PAID, FULLY_PAID
  page?: number,
  limit?: number
}
```

**Response (200 OK):**
```json
{
  "entries": [
    {
      "id": 1,
      "monthYear": "2024-12-01T00:00:00.000Z",
      "category": "IMFL",
      "openingBalance": 50000.00,
      "totalAlIssued": 1000.50,
      "applicableRate": 150.00,
      "dutyAccrued": 150075.00,
      "totalPayments": 100000.00,
      "closingBalance": 100075.00,
      "status": "PARTIAL_PAID",
      "remarks": null,
      "createdBy": 1,
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "challans": [
        {
          "id": 1,
          "challanNumber": "TR/2024/12345",
          "challanDate": "2024-12-15T00:00:00.000Z",
          "amountPaid": 100000.00,
          "verificationStatus": "VERIFIED"
        }
      ],
      "createdAt": "2024-12-01T10:00:00.000Z",
      "updatedAt": "2024-12-15T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "totalPages": 1
  }
}
```

**Business Logic:**
- Include related `challans` and `user` data
- Default date range: Last 12 months
- Order by `monthYear` DESC

---

#### **2.2 GET /api/excise-duty/ledger/:id**
Get a single duty ledger entry by ID.

**Response (200 OK):**
```json
{
  "entry": { /* full entry object with relations */ }
}
```

**Error (404):**
```json
{
  "error": "Duty entry not found"
}
```

---

#### **2.3 POST /api/excise-duty/ledger**
Create a new monthly duty entry (usually auto-generated).

**Request Body:**
```json
{
  "monthYear": "2024-12-01",
  "category": "IMFL",
  "openingBalance": 50000.00,
  "remarks": "December 2024 IMFL duty"
}
```

**Response (201 Created):**
```json
{
  "message": "Duty entry created successfully",
  "entry": { /* full entry object */ }
}
```

**Business Logic:**
1. Check for duplicate (same `monthYear` + `category`)
2. Fetch current duty rate for the category
3. Fetch total AL issued from Reg-B for the month:
   ```javascript
   const regBStats = await axios.get('/api/registers/regb/summary/stats', {
     params: {
       startDate: '2024-12-01',
       endDate: '2024-12-31'
     }
   });
   totalAlIssued = regBStats.data.totalIssuedAl;
   ```
4. Calculate `dutyAccrued = totalAlIssued × applicableRate`
5. Calculate `closingBalance = openingBalance + dutyAccrued - totalPayments`
6. Set `status` based on balance:
   - `closingBalance === 0` → `FULLY_PAID`
   - `closingBalance < (openingBalance + dutyAccrued)` → `PARTIAL_PAID`
   - Else → `PENDING`
7. Log audit entry: `action: 'DUTY_ENTRY_CREATED'`

---

#### **2.4 PUT /api/excise-duty/ledger/:id**
Update a duty entry (recalculate if needed).

**Request Body:** (All fields optional)
```json
{
  "openingBalance": 55000.00,
  "remarks": "Adjusted opening balance"
}
```

**Response (200 OK):**
```json
{
  "message": "Duty entry updated successfully",
  "entry": { /* updated entry object */ }
}
```

**Business Logic:**
- Recalculate `closingBalance` after any update
- Update `status` based on new balance
- Log audit entry: `action: 'DUTY_ENTRY_UPDATED'`

---

#### **2.5 DELETE /api/excise-duty/ledger/:id**
Delete a duty entry (cascade deletes challans).

**Response (200 OK):**
```json
{
  "message": "Duty entry deleted successfully"
}
```

**Business Logic:**
- Only allow deletion if no payments recorded (no challans)
- Log audit entry: `action: 'DUTY_ENTRY_DELETED'`

---

### **3. Treasury Challan Management**

#### **3.1 POST /api/excise-duty/challans**
Record a new treasury challan (payment).

**Request Body:**
```json
{
  "dutyEntryId": 1,
  "challanNumber": "TR/2024/67890",
  "challanDate": "2024-12-20",
  "amountPaid": 50000.00,
  "bankName": "State Bank of India",
  "branchName": "Kolkata Main",
  "documentUrl": "https://storage.supabase.co/...",
  "remarks": "Partial payment for December"
}
```

**Response (201 Created):**
```json
{
  "message": "Challan recorded successfully",
  "challan": { /* full challan object */ },
  "updatedDutyEntry": {
    "totalPayments": 150000.00,
    "closingBalance": 50075.00,
    "status": "PARTIAL_PAID"
  }
}
```

**Validation:**
- `dutyEntryId` must exist
- `challanNumber` must be unique
- `amountPaid` must be > 0
- `challanDate` must be within the duty entry's month

**Business Logic:**
1. Create challan record
2. Update parent `ExciseDutyEntry`:
   - `totalPayments += amountPaid`
   - Recalculate `closingBalance`
   - Update `status`
3. Log audit entry: `action: 'CHALLAN_RECORDED'`

---

#### **3.2 GET /api/excise-duty/challans**
Get all challans (with optional filtering).

**Query Parameters:**
```javascript
{
  dutyEntryId?: number,
  verificationStatus?: string,
  startDate?: string,
  endDate?: string
}
```

**Response (200 OK):**
```json
{
  "challans": [
    {
      "id": 1,
      "challanNumber": "TR/2024/12345",
      "challanDate": "2024-12-15T00:00:00.000Z",
      "amountPaid": 100000.00,
      "bankName": "SBI",
      "branchName": "Kolkata",
      "documentUrl": "https://...",
      "verificationStatus": "VERIFIED",
      "verifiedBy": 2,
      "verifiedAt": "2024-12-16T10:00:00.000Z",
      "dutyEntry": {
        "monthYear": "2024-12-01T00:00:00.000Z",
        "category": "IMFL"
      },
      "user": {
        "name": "John Doe"
      }
    }
  ],
  "total": 5
}
```

---

#### **3.3 PUT /api/excise-duty/challans/:id/verify**
Verify a challan (approval workflow).

**Request Body:**
```json
{
  "verificationStatus": "VERIFIED",
  "remarks": "Verified against bank statement"
}
```

**Response (200 OK):**
```json
{
  "message": "Challan verified successfully",
  "challan": { /* updated challan */ }
}
```

**Business Logic:**
- Set `verifiedBy = req.user.id`
- Set `verifiedAt = new Date()`
- Log audit entry: `action: 'CHALLAN_VERIFIED'`

---

#### **3.4 DELETE /api/excise-duty/challans/:id**
Delete a challan (reverses payment).

**Response (200 OK):**
```json
{
  "message": "Challan deleted successfully",
  "updatedDutyEntry": {
    "totalPayments": 100000.00,
    "closingBalance": 100075.00,
    "status": "PARTIAL_PAID"
  }
}
```

**Business Logic:**
1. Get challan's `amountPaid`
2. Delete challan
3. Update parent `ExciseDutyEntry`:
   - `totalPayments -= amountPaid`
   - Recalculate `closingBalance`
   - Update `status`
4. Log audit entry: `action: 'CHALLAN_DELETED'`

---

### **4. Auto-Generation & Calculations**

#### **4.1 POST /api/excise-duty/generate-monthly**
Auto-generate duty entries for a given month.

**Request Body:**
```json
{
  "monthYear": "2024-12-01",
  "categories": ["IMFL", "Beer", "Wine", "CL"]
}
```

**Response (201 Created):**
```json
{
  "message": "Generated 4 duty entries for December 2024",
  "entries": [
    {
      "category": "IMFL",
      "totalAlIssued": 1000.50,
      "dutyAccrued": 150075.00,
      "closingBalance": 150075.00
    },
    // ... other categories
  ]
}
```

**Business Logic:**
1. For each category:
   - Get previous month's closing balance (becomes opening balance)
   - Fetch total AL issued from Reg-B for the month
   - Get current duty rate
   - Calculate duty accrued
   - Create `ExciseDutyEntry`
2. Log audit entry: `action: 'MONTHLY_DUTY_GENERATED'`

---

#### **4.2 POST /api/excise-duty/calculate**
Preview duty calculation without saving (for UI).

**Request Body:**
```json
{
  "category": "IMFL",
  "totalAlIssued": 1000.50,
  "openingBalance": 50000.00
}
```

**Response (200 OK):**
```json
{
  "applicableRate": 150.00,
  "dutyAccrued": 150075.00,
  "closingBalance": 200075.00,
  "breakdown": {
    "openingBalance": 50000.00,
    "dutyAccrued": 150075.00,
    "totalPayments": 0.00,
    "closingBalance": 200075.00
  }
}
```

**Business Logic:**
- Fetch current rate for category
- Calculate: `dutyAccrued = totalAlIssued × rate`
- Calculate: `closingBalance = openingBalance + dutyAccrued - totalPayments`
- No database changes

---

### **5. Summary & Reports**

#### **5.1 GET /api/excise-duty/summary/stats**
Get aggregated statistics.

**Query Parameters:**
```javascript
{
  startMonth?: string,  // YYYY-MM
  endMonth?: string,    // YYYY-MM
  category?: string
}
```

**Response (200 OK):**
```json
{
  "totalDutyAccrued": 1500750.00,
  "totalPayments": 1200000.00,
  "totalOutstanding": 300750.00,
  "byCategory": [
    {
      "category": "IMFL",
      "dutyAccrued": 900450.00,
      "payments": 700000.00,
      "outstanding": 200450.00
    },
    {
      "category": "Beer",
      "dutyAccrued": 300150.00,
      "payments": 250000.00,
      "outstanding": 50150.00
    }
  ],
  "byStatus": {
    "PENDING": 2,
    "PARTIAL_PAID": 5,
    "FULLY_PAID": 3
  }
}
```

**Business Logic:**
- Aggregate from `ExciseDutyEntry` table
- Group by category and status
- Calculate totals

---

#### **5.2 GET /api/excise-duty/summary/monthly-report/:monthYear**
Get detailed monthly report for a specific month.

**Response (200 OK):**
```json
{
  "month": "2024-12-01T00:00:00.000Z",
  "summary": {
    "totalAlIssued": 5000.00,
    "totalDutyAccrued": 600000.00,
    "totalPayments": 500000.00,
    "closingBalance": 100000.00
  },
  "byCategory": [
    {
      "category": "IMFL",
      "alIssued": 3000.00,
      "rate": 150.00,
      "dutyAccrued": 450000.00,
      "payments": 400000.00,
      "balance": 50000.00,
      "status": "PARTIAL_PAID"
    }
  ],
  "challans": [
    {
      "challanNumber": "TR/2024/12345",
      "date": "2024-12-15",
      "amount": 100000.00,
      "category": "IMFL"
    }
  ]
}
```

---

## 🔄 Integration Points

### **With Reg-B (Issue Register)**

**Endpoint:** `GET /api/registers/regb/summary/stats`

**Usage:**
```javascript
// In duty entry creation
const regBStats = await axios.get('/api/registers/regb/summary/stats', {
  headers: { Authorization: `Bearer ${token}` },
  params: {
    startDate: '2024-12-01',
    endDate: '2024-12-31'
  }
});

const totalAlIssued = regBStats.data.totalIssuedAl;
```

---

## ⚠️ Error Handling

### **Standard Error Response:**
```json
{
  "error": "Error message here",
  "details": {
    "field": "Specific validation error"
  }
}
```

### **Common Error Codes:**
- `400` - Validation error
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `409` - Conflict (duplicate challan number, etc.)
- `500` - Internal server error

---

## 📝 Audit Logging

All critical actions should be logged using the existing `logAudit` utility:

```javascript
await logAudit({
  userId: req.user.id,
  action: 'DUTY_ENTRY_CREATED',
  entityType: 'EXCISE_DUTY',
  entityId: entry.id.toString(),
  metadata: {
    monthYear: entry.monthYear,
    category: entry.category,
    dutyAccrued: entry.dutyAccrued
  }
});
```

**Action Types:**
- `DUTY_RATE_CREATED`
- `DUTY_RATE_UPDATED`
- `DUTY_ENTRY_CREATED`
- `DUTY_ENTRY_UPDATED`
- `DUTY_ENTRY_DELETED`
- `CHALLAN_RECORDED`
- `CHALLAN_VERIFIED`
- `CHALLAN_DELETED`
- `MONTHLY_DUTY_GENERATED`

---

## 🧪 Testing Checklist

### **Unit Tests:**
- [ ] Duty rate CRUD operations
- [ ] Duty entry calculations
- [ ] Challan recording and balance updates
- [ ] Status transitions (PENDING → PARTIAL → FULLY_PAID)

### **Integration Tests:**
- [ ] Auto-generation from Reg-B data
- [ ] Multiple challans for one entry
- [ ] Rate changes mid-month handling
- [ ] Cascade delete behavior

### **Edge Cases:**
- [ ] Duplicate challan numbers
- [ ] Negative payment amounts
- [ ] Future-dated challans
- [ ] Deleting entry with payments
- [ ] Overlapping duty rates

---

## 📦 File Structure

```
server/
├── routes/
│   └── exciseDuty.js          (Main route file)
├── utils/
│   └── exciseDutyCalculations.js  (Calculation utilities)
└── prisma/
    ├── schema.prisma          (Updated with new models)
    └── seed-duty-rates.js     (Initial rate data)
```

---

## ✅ Implementation Checklist

- [ ] Add Prisma models to schema
- [ ] Run `npx prisma db push`
- [ ] Create `exciseDutyCalculations.js` utility
- [ ] Implement all 12 API endpoints
- [ ] Add audit logging to all actions
- [ ] Write unit tests
- [ ] Seed initial duty rates
- [ ] Test integration with Reg-B
- [ ] Document any deviations from this spec

---

**Prepared by:** Antigravity AI  
**For Implementation by:** Backend Developer  
**Target Completion:** Phase 3 (Weeks 5-6)  
**Questions?** Refer to `PHASE3_SCHEMA_DRAFT.md` for database details
