# 📋 PRODUCTION FEES REGISTER - QUICK REFERENCE CARD

**Last Updated:** 2025-12-30 16:55 IST

---

## 🎯 WHAT IS IT?

**Production Fees Register** tracks the **₹3 per Bulk Liter (BL)** fee on all bottled production.

**Formula:** `Daily Fees = Total Production BL × ₹3`

---

## 🚀 HOW TO ACCESS

**Navigation:** Registers → Production Fees Register

**URL:** `/registers/production-fees`

---

## ⚡ QUICK ACTIONS

### **1. Auto-Generate from Reg-A**
```
1. Select date
2. Click "Auto-Generate from Reg-A"
3. System pulls all COMPLETED Reg-A entries
4. Calculates fees automatically
```

### **2. Manual Entry (for Deposits)**
```
1. Click "New Entry"
2. Enter deposit amount
3. Add challan no. and date
4. Save
```

### **3. Export to PDF**
```
1. Click "Export PDF"
2. Select date range
3. Download report
```

---

## 🔢 CALCULATION LOGIC

### **Bottle to BL Conversion:**
- 750ml bottle = 0.75 BL
- 600ml bottle = 0.60 BL
- 500ml bottle = 0.50 BL
- 375ml bottle = 0.375 BL
- 300ml bottle = 0.30 BL
- 180ml bottle = 0.18 BL

### **Example:**
```
100 bottles × 750ml = 75 BL
50 bottles × 500ml = 25 BL
Total: 100 BL
Fees: 100 BL × ₹3 = ₹300
```

---

## 📊 REGISTER COLUMNS

**Financial:**
- Opening Balance
- Deposit Amount
- Challan No. & Date
- Total Credited

**Production:**
- Bottle counts by strength (50°, 60°, 70°, 80° UP)
- Bottle counts by size (750ml, 600ml, 500ml, 375ml, 300ml, 180ml)

**Calculation:**
- Total Production BL
- Fees Debited
- Closing Balance

---

## 🔄 BALANCE EQUATION

```
Closing Balance = Opening Balance + Deposits - Fees
```

**Where:**
- Opening Balance = Previous day's closing balance
- Deposits = Payments made via treasury challans
- Fees = Total Production BL × ₹3

---

## 💡 BEST PRACTICES

### **Daily Workflow:**
1. ✅ Complete all Reg-A production entries
2. ✅ Mark them as COMPLETED
3. ✅ Run "Auto-Generate from Reg-A"
4. ✅ Verify the calculation

### **Recording Deposits:**
1. ✅ Make payment via treasury challan
2. ✅ Enter deposit in register
3. ✅ Attach challan no. and date
4. ✅ Save entry

### **Monthly Reconciliation:**
1. ✅ Export to PDF
2. ✅ Verify total fees vs. deposits
3. ✅ Check closing balance
4. ✅ Ensure all payments recorded

---

## 🎨 STRENGTH MAPPING

| Reg-A Avg Strength | Category |
|-------------------|----------|
| ≥ 25%             | 50° UP   |
| 20% - 24.9%       | 60° UP   |
| 15% - 19.9%       | 70° UP   |
| < 15%             | 80° UP   |

---

## 🔧 API ENDPOINTS

```
GET  /api/production-fees/ledger        - List all entries
POST /api/production-fees/auto-generate - Auto-fill from Reg-A
POST /api/production-fees/ledger        - Manual entry/update
GET  /api/production-fees/summary       - Dashboard summary
```

---

## 📁 FILES REFERENCE

**Backend:**
- `server/prisma/schema.prisma` (lines 574-626)
- `server/routes/productionFees.js`
- `server/utils/productionFeeCalculations.js`

**Frontend:**
- `client/src/pages/excise/ProductionFeesRegister.jsx`
- `client/src/App.jsx` (line 91-95)

**Documentation:**
- `.agent/PRODUCTION_FEES_EXPLANATION.md` - Technical details
- `.agent/PRODUCTION_FEES_SUMMARY.md` - User guide
- `.agent/PRODUCTION_FEES_STATUS.md` - Status report

---

## ⚠️ IMPORTANT NOTES

### **Two Different Fees:**

| Fee Type | Register | Rate | Base |
|----------|----------|------|------|
| Production Fees | Production Fees Register | ₹3/BL | Bulk Liters |
| Bottling Fees | Reg-B | ₹3/bottle | Bottles |

**Don't confuse them!**

---

## ✅ STATUS

**Implementation:** ✅ 100% COMPLETE  
**Backend:** ✅ Operational  
**Frontend:** ✅ Operational  
**Integration:** ✅ Working  
**Testing:** ✅ Verified

**Ready for Production Use!** 🚀

---

## 📞 SUPPORT

For questions or issues:
1. Check `.agent/PRODUCTION_FEES_EXPLANATION.md`
2. Review `.agent/PRODUCTION_FEES_SUMMARY.md`
3. Ask Antigravity AI for help

---

**Quick Tip:** The opening balance is automatically carried forward from the previous day's closing balance. No manual entry needed!
