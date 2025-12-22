const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/report', verifyToken, async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        // Fetch all Reg-74 events in the period across all VATs
        const events = await prisma.reg74Event.findMany({
            where: {
                eventDateTime: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                vat: true,
                batch: true
            },
            orderBy: {
                eventDateTime: 'asc'
            }
        });

        // We need an initial balance for the WHOLE distillery at start of period
        // For simplicity in this automated report, we calculate the running balance starting from the first event in history
        // or we assume the first event's opening is our start.

        let cumulativeAl = 0;

        // Let's get the opening balance of all vats before the start date
        const allVats = await prisma.vatMaster.findMany();

        const reportRows = [];

        // To calculate the "Balance in hand" correctly, we need the snapshot of all vats at start
        // This is complex. For a truly automated Reg 78, we will derive it from the event stream.

        for (const event of events) {
            const row = {
                id: event.id,
                dateHour: event.eventDateTime,
                vatCode: event.vat.vatCode,
                eventType: event.eventType,
                openingAl: cumulativeAl, // Running balance before this transaction
                receiptPassAl: 0,
                receiptMfmAl: 0,
                operationalInc: 0,
                productionInc: 0,
                auditInc: 0,
                issueDutyAl: 0,
                issueDutyBl: 0,
                productionFees: 0,
                sampleAl: 0,
                operationalWastage: 0,
                productionWastage: 0,
                auditWastage: 0,
                totalAlInHand: 0,
                totalDebitAl: 0,
                closingAl: 0,
                remarks: event.remarks
            };

            // Mapping Logic based on event types and data blocks
            if (event.eventType === 'UNLOADING' || event.eventType === 'RECEIPT') {
                const al = event.receiptData?.qtyAl || (event.receiptData?.qtyBl * event.receiptData?.strength / 100) || 0;
                // If it's Unloading, it's usually via Pass/MFM-I
                row.receiptPassAl = al;
                row.receiptMfmAl = al; // Often both are recorded
                cumulativeAl += al;
            }

            if (event.eventType === 'ADJUSTMENT') {
                const adj = event.adjustmentData;
                const al = adj?.qtyAl || 0;
                if (adj?.type === 'INCREASE') {
                    if (adj.reason?.includes('STOCK_AUDIT')) row.auditInc = al;
                    else if (adj.reason?.includes('PRODUCTION')) row.productionInc = al;
                    else row.operationalInc = al;
                    cumulativeAl += al;
                } else {
                    if (adj.reason?.includes('STOCK_AUDIT')) row.auditWastage = al;
                    else if (adj.reason?.includes('TRANSIT')) row.operationalWastage = al; // Mapping transit to operational for 78
                    else row.operationalWastage = al;
                    cumulativeAl -= al;
                }
            }

            if (event.eventType === 'INTERNAL_TRANSFER') {
                // Internal transfers cancel out if we look at the WHOLE distillery
                // UNLESS it's leaving to a place not tracked by Reg 74 vats.
                // But Reg 78 columns specify "Issues on payment of duty" and "Sample drawn".
                const issue = event.issueData;
                const al = issue?.qtyAl || (issue?.qtyBl * issue?.strength / 100) || 0;
                if (issue?.dest?.toUpperCase().includes('SAMPLE')) {
                    row.sampleAl = al;
                    cumulativeAl -= al;
                } else if (issue?.dest?.toUpperCase().includes('DUTY') || issue?.dest?.toUpperCase().includes('DISPATCH')) {
                    row.issueDutyAl = al;
                    cumulativeAl -= al;
                }
                // Note: Transfers between SST and BRT are ignored for the TOTAL distillery balance
            }

            if (event.eventType === 'PRODUCTION') {
                const prod = event.productionData;
                const mfmAl = prod?.mfmAl || 0;
                const mfmBl = prod?.mfmBl || 0;

                row.issueDutyAl = mfmAl;
                row.issueDutyBl = mfmBl;
                row.productionFees = mfmBl * 3; // Statutory ₹3 per BL fee
                cumulativeAl -= mfmAl;
            }

            if (event.eventType === 'OPENING' && cumulativeAl === 0) {
                // Initial baseline if this is the first record
                cumulativeAl = event.openingData?.volumeAl || 0;
                row.openingAl = cumulativeAl;
            }

            row.totalAlInHand = row.openingAl + row.receiptPassAl + row.operationalInc + row.productionInc + row.auditInc;
            row.totalDebitAl = row.issueDutyAl + row.sampleAl + row.operationalWastage + row.productionWastage + row.auditWastage;
            row.closingAl = cumulativeAl;

            // Only add rows that actually impact the spirit account (ignore internal SST->BRT for master ledger)
            // Or include them with 0 net impact if we want a full audit trail.
            reportRows.push(row);
        }

        res.json(reportRows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
