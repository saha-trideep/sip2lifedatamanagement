# 🔌 Excise Duty API - Quick Reference Guide

**For Frontend Developers**

---

## Base URL
```
http://localhost:3000/api/excise-duty
```

---

## 📊 Dashboard & Stats

### Get Summary Statistics
```javascript
GET /api/excise-duty/summary/stats?monthYear=2024-12-01

// Response
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

---

## 📋 Duty Ledger

### List All Entries
```javascript
GET /api/excise-duty/ledger?page=1&limit=50&category=CL&status=PENDING

// Query Params (all optional)
{
  page: 1,
  limit: 50,
  category: "CL",
  subcategory: "50° U.P.",
  status: "PENDING" | "PARTIAL_PAID" | "FULLY_PAID",
  startMonth: "2024-01-01",
  endMonth: "2024-12-31"
}

// Response
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
      "remarks": null,
      "createdAt": "2024-12-01T10:00:00.000Z",
      "user": {
        "id": 1,
        "name": "Admin User",
        "email": "admin@sip2life.com"
      },
      "challans": [
        {
          "id": 1,
          "challanNumber": "TR/2024/12345",
          "challanDate": "2024-12-15T00:00:00.000Z",
          "amountPaid": 3000,
          "verificationStatus": "VERIFIED"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 4,
    "pages": 1
  }
}
```

### Get Single Entry
```javascript
GET /api/excise-duty/ledger/1

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "monthYear": "2024-12-01T00:00:00.000Z",
    // ... all fields
    "challans": [ /* full challan details */ ]
  }
}
```

### Create Entry
```javascript
POST /api/excise-duty/ledger

// Body
{
  "monthYear": "2024-12-01",
  "category": "CL",
  "subcategory": "50° U.P.",
  "totalBlIssued": 100,
  "totalAlIssued": 28.5,
  "remarks": "December 2024 production"
}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    // ... all fields with auto-calculated values
    "applicableRate": 50,
    "dutyAccrued": 5000,
    "closingBalance": 5000,
    "status": "PENDING"
  },
  "message": "Duty entry created successfully"
}
```

### Update Entry
```javascript
PUT /api/excise-duty/ledger/1

// Body (all fields optional)
{
  "totalBlIssued": 120,
  "totalAlIssued": 34.2,
  "remarks": "Updated values"
}

// Response
{
  "success": true,
  "data": { /* updated entry with recalculated values */ },
  "message": "Duty entry updated successfully"
}
```

### Delete Entry
```javascript
DELETE /api/excise-duty/ledger/1

// Response
{
  "success": true,
  "message": "Duty entry deleted successfully"
}

// Error if challans exist
{
  "success": false,
  "error": "Cannot delete entry with linked challans. Delete challans first."
}
```

---

## 💰 Treasury Challans

### Record Payment
```javascript
POST /api/excise-duty/challans

// Body
{
  "dutyEntryId": 1,
  "challanNumber": "TR/2024/12345",
  "challanDate": "2024-12-15",
  "amountPaid": 3000,
  "bankName": "State Bank of India",
  "branchName": "Kolkata Main",
  "remarks": "First payment"
}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "challanNumber": "TR/2024/12345",
    "challanDate": "2024-12-15T00:00:00.000Z",
    "amountPaid": 3000,
    "verificationStatus": "PENDING",
    "dutyEntry": { /* linked duty entry */ }
  },
  "message": "Challan recorded successfully"
}

// Note: Duty entry balance is automatically updated!
```

### List Challans
```javascript
GET /api/excise-duty/challans?page=1&limit=50

// Query Params (all optional)
{
  page: 1,
  limit: 50,
  dutyEntryId: 1,
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED",
  startDate: "2024-01-01",
  endDate: "2024-12-31"
}

// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "challanNumber": "TR/2024/12345",
      "challanDate": "2024-12-15T00:00:00.000Z",
      "amountPaid": 3000,
      "bankName": "State Bank of India",
      "branchName": "Kolkata Main",
      "verificationStatus": "PENDING",
      "dutyEntry": {
        "id": 1,
        "monthYear": "2024-12-01T00:00:00.000Z",
        "category": "CL",
        "subcategory": "50° U.P."
      },
      "user": {
        "id": 1,
        "name": "Admin User"
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

### Verify Challan (Admin Only)
```javascript
PUT /api/excise-duty/challans/1/verify

// Body
{
  "verificationStatus": "VERIFIED" | "REJECTED",
  "remarks": "Verified with treasury records"
}

// Response
{
  "success": true,
  "data": { /* updated challan */ },
  "message": "Challan verified successfully"
}
```

### Delete Challan
```javascript
DELETE /api/excise-duty/challans/1

// Response
{
  "success": true,
  "message": "Challan deleted successfully"
}

// Note: Duty entry balance is automatically updated!
```

---

## 💡 Calculation Preview

### Calculate Duty (Before Saving)
```javascript
POST /api/excise-duty/calculate

// Body
{
  "category": "CL",
  "subcategory": "50° U.P.",
  "totalBlIssued": 100,
  "monthYear": "2024-12-01"  // optional, defaults to today
}

// Response
{
  "success": true,
  "data": {
    "category": "CL",
    "subcategory": "50° U.P.",
    "totalBlIssued": 100,
    "applicableRate": 50,
    "dutyAccrued": 5000,
    "rateDetails": {
      "id": 1,
      "effectiveFrom": "2024-04-01T00:00:00.000Z",
      "effectiveTo": null,
      "remarks": "50° U.P. (28.5% v/v) - Standard Rate 2024"
    }
  }
}
```

---

## ⚙️ Duty Rates (Admin Only)

### List Rates
```javascript
GET /api/excise-duty/rates?category=CL&isActive=true

// Query Params (all optional)
{
  category: "CL",
  subcategory: "50° U.P.",
  isActive: true,
  page: 1,
  limit: 50
}

// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category": "CL",
      "subcategory": "50° U.P.",
      "ratePerAl": 50,
      "effectiveFrom": "2024-04-01T00:00:00.000Z",
      "effectiveTo": null,
      "state": "West Bengal",
      "isActive": true,
      "remarks": "50° U.P. (28.5% v/v) - Standard Rate 2024"
    }
  ],
  "pagination": { /* ... */ }
}
```

### Create Rate
```javascript
POST /api/excise-duty/rates

// Body
{
  "category": "CL",
  "subcategory": "50° U.P.",
  "ratePerAl": 55,
  "effectiveFrom": "2025-04-01",
  "effectiveTo": null,
  "state": "West Bengal",
  "remarks": "Budget 2025 revision"
}

// Response
{
  "success": true,
  "data": { /* created rate */ },
  "message": "Duty rate created successfully"
}
```

### Update Rate
```javascript
PUT /api/excise-duty/rates/1

// Body (all fields optional)
{
  "ratePerAl": 55,
  "effectiveTo": "2025-03-31",
  "isActive": false,
  "remarks": "Updated rate"
}

// Response
{
  "success": true,
  "data": { /* updated rate */ },
  "message": "Duty rate updated successfully"
}
```

### Deactivate Rate
```javascript
DELETE /api/excise-duty/rates/1

// Response
{
  "success": true,
  "data": { /* deactivated rate with effectiveTo set to now */ },
  "message": "Duty rate deactivated successfully"
}
```

---

## 🚨 Error Responses

All errors follow this format:

```javascript
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}

// Validation errors
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    "Month/Year is required",
    "Total BL issued must be a positive number"
  ]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Server Error

---

## 📝 Example: Complete Flow

### 1. Create Duty Entry
```javascript
const response = await fetch('/api/excise-duty/ledger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    monthYear: '2024-12-01',
    category: 'CL',
    subcategory: '50° U.P.',
    totalBlIssued: 100,
    totalAlIssued: 28.5
  })
});

const { data } = await response.json();
// data.id = 1, data.dutyAccrued = 5000, data.status = "PENDING"
```

### 2. Record Payment
```javascript
const response = await fetch('/api/excise-duty/challans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dutyEntryId: 1,
    challanNumber: 'TR/2024/12345',
    challanDate: '2024-12-15',
    amountPaid: 3000
  })
});

// Duty entry automatically updated:
// totalPayments = 3000
// closingBalance = 3000 (was 5000)
// status = "PARTIAL_PAID" (was "PENDING")
```

### 3. Verify Payment (Admin)
```javascript
await fetch('/api/excise-duty/challans/1/verify', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    verificationStatus: 'VERIFIED'
  })
});
```

### 4. Get Updated Stats
```javascript
const response = await fetch('/api/excise-duty/summary/stats');
const { data } = await response.json();
// Shows updated totals and breakdown
```

---

## 💡 Tips

1. **Always check `success` field** in response
2. **Use pagination** for large datasets
3. **Handle errors gracefully** with try-catch
4. **Show loading states** during API calls
5. **Refresh data** after create/update/delete
6. **Use toast notifications** for user feedback

---

**Created:** 2025-12-29  
**Backend Version:** 1.0.0  
**Last Updated:** Phase 3 Complete
