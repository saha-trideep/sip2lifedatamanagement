# Phase 3: Excise Duty Register - Database Schema Draft

**Date:** 2025-12-27  
**For:** Backend Developer Review  
**Status:** Draft for Discussion

---

## 📋 Overview

This document outlines the proposed Prisma schema for **Phase 3: Excise Duty Register**. The schema consists of two main models:

1. **`DutyRate`** - Configuration table for duty rates per liquor category
2. **`ExciseDutyEntry`** - Transaction ledger for monthly duty liability and payments

---

## 🗄️ Proposed Schema

### **Model 1: DutyRate (Configuration)**

```prisma
model DutyRate {
  id              Int      @id @default(autoincrement())
  category        String   // IMFL, Beer, Wine, CL (Country Liquor), etc.
  subcategory     String?  // Optional: Premium IMFL, Regular Beer, etc.
  ratePerAl       Float    // ₹ per Absolute Liter
  effectiveFrom   DateTime // Start date for this rate
  effectiveTo     DateTime? // End date (null = currently active)
  state           String   @default("West Bengal") // For multi-state support
  isActive        Boolean  @default(true)
  
  remarks         String?  // Notes about rate change (e.g., "Budget 2024 revision")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([category, effectiveFrom])
  @@index([isActive])
}
```

**Key Features:**
- **Time-based rates**: Supports historical tracking via `effectiveFrom`/`effectiveTo`
- **Category flexibility**: Can handle IMFL, Beer, Wine, CL, etc.
- **Multi-state ready**: Includes `state` field for future expansion
- **Active flag**: Quick filtering for current rates

**Sample Data:**
```javascript
{
  category: "IMFL",
  ratePerAl: 150.00,
  effectiveFrom: "2024-04-01",
  effectiveTo: null, // Currently active
  isActive: true
}
```

---

### **Model 2: ExciseDutyEntry (Transaction Ledger)**

```prisma
model ExciseDutyEntry {
  id                Int      @id @default(autoincrement())
  
  // Period Information
  monthYear         DateTime // First day of the month (e.g., 2024-12-01)
  category          String   // IMFL, Beer, Wine, CL
  
  // Opening Balance (from previous month)
  openingBalance    Float    @default(0) // ₹
  
  // Current Month Accruals
  totalAlIssued     Float    @default(0) // From Reg-B summary
  applicableRate    Float    // Rate per AL for this period
  dutyAccrued       Float    // totalAlIssued × applicableRate
  
  // Payments Made
  totalPayments     Float    @default(0) // Sum of all challans
  
  // Closing Balance
  closingBalance    Float    // openingBalance + dutyAccrued - totalPayments
  
  // Status
  status            String   @default("PENDING") // PENDING, PARTIAL_PAID, FULLY_PAID
  
  // Audit Trail
  remarks           String?
  createdBy         Int
  user              User     @relation(fields: [createdBy], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  challans          TreasuryChallan[]
  
  @@unique([monthYear, category]) // One entry per month per category
  @@index([monthYear])
  @@index([status])
}
```

**Key Features:**
- **Monthly aggregation**: One entry per month per category
- **Auto-calculation**: `dutyAccrued` and `closingBalance` computed
- **Payment tracking**: Links to multiple `TreasuryChallan` records
- **Status workflow**: PENDING → PARTIAL_PAID → FULLY_PAID

**Balance Equation:**
```
Closing Balance = Opening Balance + Duty Accrued - Total Payments
```

---

### **Model 3: TreasuryChallan (Payment Records)**

```prisma
model TreasuryChallan {
  id                Int      @id @default(autoincrement())
  
  // Link to Duty Entry
  dutyEntryId       Int
  dutyEntry         ExciseDutyEntry @relation(fields: [dutyEntryId], references: [id], onDelete: Cascade)
  
  // Challan Details
  challanNumber     String   @unique // TR Number (e.g., TR/2024/12345)
  challanDate       DateTime
  amountPaid        Float    // ₹
  
  // Bank/Treasury Info
  bankName          String?
  branchName        String?
  
  // Document Management
  documentUrl       String?  // Link to scanned challan (Supabase Storage)
  documentId        Int?     // Optional link to Document model
  document          Document? @relation(fields: [documentId], references: [id])
  
  // Verification
  verifiedBy        Int?
  verifiedAt        DateTime?
  verificationStatus String  @default("PENDING") // PENDING, VERIFIED, REJECTED
  
  remarks           String?
  createdBy         Int
  user              User     @relation(fields: [createdBy], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([dutyEntryId])
  @@index([challanDate])
  @@index([verificationStatus])
}
```

**Key Features:**
- **Unique TR numbers**: Prevents duplicate challan entries
- **Document linking**: Stores scanned copy URL
- **Verification workflow**: Supports approval process
- **Cascade delete**: If duty entry is deleted, challans are removed

---

## 🔗 Required Schema Updates

### **Update User Model**

Add these relations to the existing `User` model:

```prisma
model User {
  // ... existing fields ...
  
  // Phase 3 Relations
  exciseDutyEntries  ExciseDutyEntry[]
  treasuryChallans   TreasuryChallan[]
}
```

---

## 📊 Data Flow

```
Reg-B (Daily Issues)
    ↓
Monthly Aggregation (totalAlIssued)
    ↓
DutyRate (Current Rate)
    ↓
ExciseDutyEntry (Duty Accrued = AL × Rate)
    ↓
TreasuryChallan (Payments)
    ↓
ExciseDutyEntry (Closing Balance Updated)
```

---

## 🧪 Sample Queries

### **Get Current Duty Rate for IMFL**
```javascript
const currentRate = await prisma.dutyRate.findFirst({
  where: {
    category: 'IMFL',
    isActive: true,
    effectiveFrom: { lte: new Date() },
    OR: [
      { effectiveTo: null },
      { effectiveTo: { gte: new Date() } }
    ]
  },
  orderBy: { effectiveFrom: 'desc' }
});
```

### **Get Monthly Duty Ledger**
```javascript
const ledger = await prisma.exciseDutyEntry.findMany({
  where: {
    monthYear: {
      gte: new Date('2024-01-01'),
      lt: new Date('2025-01-01')
    }
  },
  include: {
    challans: true,
    user: { select: { name: true } }
  },
  orderBy: { monthYear: 'desc' }
});
```

### **Calculate Total Outstanding Duty**
```javascript
const outstanding = await prisma.exciseDutyEntry.aggregate({
  where: {
    status: { in: ['PENDING', 'PARTIAL_PAID'] }
  },
  _sum: { closingBalance: true }
});
```

---

## ⚠️ Important Considerations

### **1. Rate Change Handling**
**Question:** What happens if the duty rate changes mid-month?

**Options:**
- **A.** Use the rate effective at month start (simpler)
- **B.** Pro-rate based on days (more accurate, complex)
- **C.** Split into two entries (one per rate period)

**Recommendation:** Option A for MVP, Option C for production.

---

### **2. Multi-Category Support**
Currently, each `ExciseDutyEntry` is for a single category (IMFL, Beer, etc.).

**Question:** Should we support mixed categories in one entry?

**Recommendation:** Keep separate entries per category for clarity.

---

### **3. Document Storage**
Challan images need to be stored somewhere.

**Options:**
- **A.** Supabase Storage (recommended - already in use)
- **B.** Cloudinary (external service)
- **C.** Local filesystem (not recommended for production)

**Recommendation:** Use Supabase Storage, store URL in `documentUrl`.

---

### **4. Audit Logging**
All duty calculations and payments should be logged.

**Recommendation:** Use existing `AuditLog` model with:
```javascript
action: 'DUTY_ACCRUED' | 'CHALLAN_RECORDED' | 'PAYMENT_VERIFIED'
entityType: 'EXCISE_DUTY'
```

---

## 🚀 Migration Strategy

### **Step 1: Add Models**
```bash
# Add the three models to schema.prisma
# Update User model with relations
```

### **Step 2: Push to Database**
```bash
npx prisma db push
npx prisma generate
```

### **Step 3: Seed Initial Rates**
```javascript
// server/prisma/seed-duty-rates.js
const rates = [
  { category: 'IMFL', ratePerAl: 150.00, effectiveFrom: new Date('2024-04-01') },
  { category: 'Beer', ratePerAl: 50.00, effectiveFrom: new Date('2024-04-01') },
  { category: 'Wine', ratePerAl: 80.00, effectiveFrom: new Date('2024-04-01') },
  { category: 'CL', ratePerAl: 30.00, effectiveFrom: new Date('2024-04-01') }
];

await prisma.dutyRate.createMany({ data: rates });
```

---

## ✅ Review Checklist

Before implementing, confirm:

- [ ] Field names match business requirements
- [ ] Indexes are on frequently queried fields
- [ ] Relations are correctly defined
- [ ] Cascade delete behavior is acceptable
- [ ] Data types are appropriate (Float for money, DateTime for dates)
- [ ] Unique constraints prevent duplicate data
- [ ] Default values make sense

---

## 📞 Questions for Discussion

1. **Rate Management:** Should rates be editable via UI or config file?
2. **Historical Data:** Do we need to backfill duty entries for past months?
3. **Payment Workflow:** Who verifies challans? Auto-approve or manual?
4. **Reporting:** What reports are needed? (Monthly statement, annual summary, etc.)
5. **Integration:** Should duty entries auto-create from Reg-B, or manual trigger?

---

**Next Steps:**
1. Review this schema with the team
2. Discuss the questions above
3. Make any necessary adjustments
4. Proceed with API specification document

**Prepared by:** Antigravity AI  
**For Review by:** Backend Developer  
**Target Implementation:** Phase 3 (Weeks 5-6)
