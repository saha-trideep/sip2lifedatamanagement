# 🔄 REG-74 → REG-A INTEGRATION IMPLEMENTATION
## Auto-Fill First 3 Columns Only

**Date:** 2025-12-30  
**Status:** Backend ✅ Complete | Frontend ⏳ Ready to implement

---

## ✅ **BACKEND COMPLETE**

### **New Endpoint:** `GET /api/rega/reg74-production-events`

**Returns:**
```json
[
  {
    "id": 123,
    "batchId": 456,
    "batchNumber": "11ASD0002-1",
    "baseBatchNo": "11ASD0002",
    "sessionSuffix": "-1",
    "brandName": "Whisky XYZ",
    "eventDate": "2025-12-30T10:00:00Z",
    "vatCode": "SST-1",
    "mfmBl": 5000.50,
    "strength": 96.0,
    "mfmAl": 4800.48
  }
]
```

---

## 🎯 **FRONTEND CHANGES NEEDED**

### **File:** `client/src/pages/excise/RegABatchRegister.jsx`

### **Change 1: Add State Variables** (after line 22)

```javascript
const [showReg74Selector, setShowReg74Selector] = useState(false);
const [reg74Events, setReg74Events] = useState([]);
```

---

### **Change 2: Add Fetch Function** (after line 39)

```javascript
const fetchReg74Events = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/rega/reg74-production-events`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setReg74Events(res.data);
        setShowReg74Selector(true);
    } catch (error) {
        console.error('Failed to fetch Reg-74 events', error);
        alert('Failed to load Reg-74 production events');
    }
};
```

---

### **Change 3: Add Auto-Fill Handler** (after fetchReg74Events)

```javascript
const handleAutoFillFromReg74 = (event) => {
    if (!currentEntry) return;
    
    // Auto-fill ONLY first 3 columns
    setCurrentEntry({
        ...currentEntry,
        batchNoDate: `${event.batchNumber} (${format(new Date(event.eventDate), 'dd MMM')})`,
        productionDate: new Date(event.eventDate),
        // Note: Brand is already set from batch, but we can update if needed
    });
    
    setShowReg74Selector(false);
    alert(`Auto-filled from Reg-74 Production Event!\n\nBatch: ${event.batchNumber}\nDate: ${format(new Date(event.eventDate), 'dd MMM yyyy')}\nBrand: ${event.brandName}`);
};
```

---

### **Change 4: Add UI Button** (in Edit Modal, after line 408)

Add this button right after the header section:

```javascript
{/* Pull from Reg-74 Button */}
<div className="mb-6">
    <button
        type="button"
        onClick={fetchReg74Events}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-3"
    >
        <LinkIcon size={20} />
        Pull Basic Info from Reg-74 Production Event
    </button>
</div>

{/* Reg-74 Event Selector Modal */}
{showReg74Selector && (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-white dark:border-gray-800">
            <div className="p-10">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Select Reg-74 Production Event</h3>
                <p className="text-gray-400 font-medium uppercase text-[10px] tracking-widest mb-8">
                    Auto-fill: Batch Number, Start Date, Brand Name
                </p>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {reg74Events.map(event => (
                        <button
                            key={event.id}
                            type="button"
                            onClick={() => handleAutoFillFromReg74(event)}
                            className="w-full p-6 text-left border border-gray-100 dark:border-gray-800 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 group transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="font-black text-xl text-gray-900 dark:text-white group-hover:text-indigo-600 mb-2">
                                        {event.batchNumber}
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-xs">
                                        <div>
                                            <div className="text-gray-400 font-bold uppercase text-[8px]">Brand</div>
                                            <div className="font-black text-gray-700 dark:text-gray-300">{event.brandName}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400 font-bold uppercase text-[8px]">Date</div>
                                            <div className="font-black text-gray-700 dark:text-gray-300">
                                                {format(new Date(event.eventDate), 'dd MMM yyyy')}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400 font-bold uppercase text-[8px]">Vat</div>
                                            <div className="font-black text-gray-700 dark:text-gray-300">{event.vatCode}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex gap-4 text-[10px]">
                                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full font-black">
                                            {event.mfmBl.toFixed(2)} BL
                                        </span>
                                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full font-black">
                                            {event.strength}% v/v
                                        </span>
                                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full font-black">
                                            {event.mfmAl.toFixed(2)} AL
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-300 group-hover:text-indigo-600 transition-all" size={24} />
                            </div>
                        </button>
                    ))}
                </div>
                
                <button
                    type="button"
                    onClick={() => setShowReg74Selector(false)}
                    className="w-full py-5 mt-6 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
)}
```

---

## 📋 **WHAT GETS AUTO-FILLED**

### **From Reg-74 Production Event:**

1. ✅ **BASE BATCH No.** → `batchNoDate` field
   - Example: "11ASD0002-1 (30 Dec)"

2. ✅ **BATCH START DATE** → `productionDate` field
   - Example: 2025-12-30

3. ✅ **BRAND NAME** → Already set from batch
   - Example: "Whisky XYZ"

### **User Still Enters Manually:**
- ALLOTED VAT No.
- RECEIPT VOLUME OF SPIRIT (From VAT, STR, BL, AL)
- TOTAL BLEND PREPARED IN VAT (To VAT, STR, BL, AL)
- Bottle counts
- All other fields

---

## 🎯 **USER WORKFLOW**

1. User clicks "Declare Production" for a Reg-A entry
2. Modal opens
3. User clicks "Pull Basic Info from Reg-74 Production Event"
4. Selector modal shows recent Reg-74 PRODUCTION events
5. User selects the matching event
6. System auto-fills:
   - Batch Number with session suffix
   - Production Date
   - Brand Name (already set)
7. User continues with manual entry for other fields

---

## ✅ **READY TO IMPLEMENT**

All code is ready above. Just need to add to `RegABatchRegister.jsx`.

**Shall I proceed with the implementation?** 🚀
