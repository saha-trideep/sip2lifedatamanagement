/**
 * Daily Handbook Routes
 * 
 * Consolidated daily operations dashboard aggregating data from all registers.
 * Provides executive summary, compliance status, and print-ready reports.
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

// GET daily summary for a specific date
router.get('/summary/:date', verifyToken, async (req, res) => {
    try {
        const { date } = req.params;
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Fetch data from all registers in parallel
        const [
            reg74Events,
            reg76Entries,
            regAEntries,
            regBEntries,
            exciseDutyEntries,
            reg78Entry
        ] = await Promise.all([
            // Reg-74: Vat Operations
            prisma.reg74Event.findMany({
                where: {
                    eventDateTime: {
                        gte: targetDate,
                        lt: nextDay
                    }
                },
                include: {
                    vat: true,
                    batch: {
                        include: {
                            brand: true
                        }
                    }
                }
            }),

            // Reg-76: Spirit Receipts
            prisma.reg76Entry.findMany({
                where: {
                    receiptDate: {
                        gte: targetDate,
                        lt: nextDay
                    }
                },
                include: {
                    vat: true
                }
            }),

            // Reg-A: Production & Bottling
            prisma.regAEntry.findMany({
                where: {
                    productionDate: {
                        gte: targetDate,
                        lt: nextDay
                    }
                },
                include: {
                    batch: {
                        include: {
                            brand: true
                        }
                    }
                }
            }),

            // Reg-B: Country Liquor Issues
            prisma.regBEntry.findMany({
                where: {
                    entryDate: {
                        gte: targetDate,
                        lt: nextDay
                    }
                },
                include: {
                    batch: {
                        include: {
                            brand: true
                        }
                    }
                }
            }),

            // Excise Duty: Payments
            prisma.exciseDutyEntry.findMany({
                where: {
                    entryDate: {
                        gte: targetDate,
                        lt: nextDay
                    }
                },
                include: {
                    dutyRate: true,
                    challans: true
                }
            }),

            // Reg-78: Master Ledger
            prisma.reg78Entry.findUnique({
                where: {
                    entryDate: targetDate
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            })
        ]);

        // Calculate summary statistics
        const summary = {
            date: targetDate,

            // Reg-74 Summary
            reg74: {
                totalEvents: reg74Events.length,
                eventTypes: reg74Events.reduce((acc, e) => {
                    acc[e.eventType] = (acc[e.eventType] || 0) + 1;
                    return acc;
                }, {}),
                vatsInvolved: [...new Set(reg74Events.map(e => e.vatId))].length
            },

            // Reg-76 Summary
            reg76: {
                totalReceipts: reg76Entries.length,
                totalBL: reg76Entries.reduce((sum, e) => sum + (e.bl || 0), 0),
                totalAL: reg76Entries.reduce((sum, e) => sum + (e.al || 0), 0),
                uniqueDistilleries: [...new Set(reg76Entries.map(e => e.distillery))].length
            },

            // Reg-A Summary
            regA: {
                totalProductions: regAEntries.length,
                totalBottles: regAEntries.reduce((sum, e) => {
                    return sum +
                        (e.bottling750 || 0) +
                        (e.bottling600 || 0) +
                        (e.bottling500 || 0) +
                        (e.bottling375 || 0) +
                        (e.bottling300 || 0) +
                        (e.bottling180 || 0);
                }, 0),
                totalSpiritBottledBL: regAEntries.reduce((sum, e) => sum + (e.spiritBottledBl || 0), 0),
                totalSpiritBottledAL: regAEntries.reduce((sum, e) => sum + (e.spiritBottledAl || 0), 0),
                totalWastageAL: regAEntries.reduce((sum, e) => sum + (e.wastageAl || 0), 0)
            },

            // Reg-B Summary
            regB: {
                totalEntries: regBEntries.length,
                totalIssuedBL: regBEntries.reduce((sum, e) => sum + (e.totalIssueBl || 0), 0),
                totalIssuedAL: regBEntries.reduce((sum, e) => sum + (e.totalIssueAl || 0), 0),
                totalWastageBL: regBEntries.reduce((sum, e) => sum + (e.totalWastageBl || 0), 0),
                totalWastageAL: regBEntries.reduce((sum, e) => sum + (e.totalWastageAl || 0), 0),
                productionFees: regBEntries.reduce((sum, e) => sum + (e.productionFees || 0), 0)
            },

            // Excise Duty Summary
            exciseDuty: {
                totalEntries: exciseDutyEntries.length,
                totalDutyAmount: exciseDutyEntries.reduce((sum, e) => sum + (e.dutyAmount || 0), 0),
                totalPaidAmount: exciseDutyEntries.reduce((sum, e) => sum + (e.paidAmount || 0), 0),
                totalBalance: exciseDutyEntries.reduce((sum, e) => sum + (e.balanceAmount || 0), 0),
                challansCount: exciseDutyEntries.reduce((sum, e) => sum + (e.challans?.length || 0), 0)
            },

            // Reg-78 Summary
            reg78: reg78Entry ? {
                exists: true,
                openingBL: reg78Entry.openingBl,
                openingAL: reg78Entry.openingAl,
                receiptBL: reg78Entry.receiptBl,
                receiptAL: reg78Entry.receiptAl,
                issueBL: reg78Entry.issueBl,
                issueAL: reg78Entry.issueAl,
                wastageBL: reg78Entry.wastageBl,
                wastageAL: reg78Entry.wastageAl,
                closingBL: reg78Entry.closingBl,
                closingAL: reg78Entry.closingAl,
                variance: reg78Entry.variance,
                isReconciled: reg78Entry.isReconciled
            } : {
                exists: false,
                message: 'Master ledger entry not generated for this date'
            },

            // Compliance Status
            compliance: {
                reg78Generated: !!reg78Entry,
                reg78Reconciled: reg78Entry?.isReconciled || false,
                highVariance: reg78Entry && Math.abs(reg78Entry.variance || 0) > 1,
                exciseDutyPending: exciseDutyEntries.some(e => (e.balanceAmount || 0) > 0),
                pendingActions: []
            }
        };

        // Add pending actions
        if (!summary.compliance.reg78Generated) {
            summary.compliance.pendingActions.push({
                type: 'CRITICAL',
                message: 'Generate Reg-78 Master Ledger entry',
                action: 'reg78_generate'
            });
        }

        if (summary.compliance.reg78Generated && !summary.compliance.reg78Reconciled) {
            summary.compliance.pendingActions.push({
                type: 'WARNING',
                message: 'Reconcile Reg-78 Master Ledger',
                action: 'reg78_reconcile'
            });
        }

        if (summary.compliance.highVariance) {
            summary.compliance.pendingActions.push({
                type: 'ALERT',
                message: `High variance detected: ${reg78Entry.variance.toFixed(2)}%`,
                action: 'reg78_review'
            });
        }

        if (summary.compliance.exciseDutyPending) {
            summary.compliance.pendingActions.push({
                type: 'WARNING',
                message: 'Pending excise duty payments',
                action: 'excise_duty_payment'
            });
        }

        res.json(summary);
    } catch (error) {
        console.error('Error fetching daily summary:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET weekly overview (7 days)
router.get('/weekly-overview', verifyToken, async (req, res) => {
    try {
        const { startDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        // Fetch Reg-78 entries for the week
        const reg78Entries = await prisma.reg78Entry.findMany({
            where: {
                entryDate: {
                    gte: start,
                    lt: end
                }
            },
            orderBy: {
                entryDate: 'asc'
            }
        });

        // Fetch production summary
        const regAEntries = await prisma.regAEntry.findMany({
            where: {
                productionDate: {
                    gte: start,
                    lt: end
                }
            }
        });

        // Fetch excise duty summary
        const exciseDutyEntries = await prisma.exciseDutyEntry.findMany({
            where: {
                entryDate: {
                    gte: start,
                    lt: end
                }
            }
        });

        const weeklyData = {
            period: {
                start,
                end
            },
            dailyLedger: reg78Entries.map(e => ({
                date: e.entryDate,
                closingBL: e.closingBl,
                closingAL: e.closingAl,
                variance: e.variance,
                isReconciled: e.isReconciled
            })),
            production: {
                totalBottles: regAEntries.reduce((sum, e) => {
                    return sum +
                        (e.bottling750 || 0) +
                        (e.bottling600 || 0) +
                        (e.bottling500 || 0) +
                        (e.bottling375 || 0) +
                        (e.bottling300 || 0) +
                        (e.bottling180 || 0);
                }, 0),
                totalAL: regAEntries.reduce((sum, e) => sum + (e.spiritBottledAl || 0), 0)
            },
            exciseDuty: {
                totalDuty: exciseDutyEntries.reduce((sum, e) => sum + (e.dutyAmount || 0), 0),
                totalPaid: exciseDutyEntries.reduce((sum, e) => sum + (e.paidAmount || 0), 0),
                totalBalance: exciseDutyEntries.reduce((sum, e) => sum + (e.balanceAmount || 0), 0)
            },
            compliance: {
                daysWithLedger: reg78Entries.length,
                daysReconciled: reg78Entries.filter(e => e.isReconciled).length,
                complianceRate: reg78Entries.length > 0
                    ? ((reg78Entries.filter(e => e.isReconciled).length / reg78Entries.length) * 100).toFixed(2)
                    : 0
            }
        };

        res.json(weeklyData);
    } catch (error) {
        console.error('Error fetching weekly overview:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET compliance checklist
router.get('/compliance-checklist/:date', verifyToken, async (req, res) => {
    try {
        const { date } = req.params;
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const checklist = {
            date: targetDate,
            items: []
        };

        // Check Reg-78 existence
        const reg78Entry = await prisma.reg78Entry.findUnique({
            where: { entryDate: targetDate }
        });

        checklist.items.push({
            register: 'REG-78',
            task: 'Generate Master Ledger Entry',
            status: reg78Entry ? 'COMPLETE' : 'PENDING',
            priority: 'CRITICAL',
            details: reg78Entry ? `Entry exists (ID: ${reg78Entry.id})` : 'Entry not generated'
        });

        if (reg78Entry) {
            checklist.items.push({
                register: 'REG-78',
                task: 'Reconcile Master Ledger',
                status: reg78Entry.isReconciled ? 'COMPLETE' : 'PENDING',
                priority: 'HIGH',
                details: reg78Entry.isReconciled
                    ? `Reconciled at ${reg78Entry.reconciledAt}`
                    : `Variance: ${reg78Entry.variance?.toFixed(2)}%`
            });
        }

        // Check excise duty payments
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const exciseDutyEntries = await prisma.exciseDutyEntry.findMany({
            where: {
                entryDate: {
                    gte: targetDate,
                    lt: nextDay
                }
            }
        });

        const pendingDuty = exciseDutyEntries.filter(e => (e.balanceAmount || 0) > 0);

        checklist.items.push({
            register: 'EXCISE-DUTY',
            task: 'Clear Pending Duty Payments',
            status: pendingDuty.length === 0 ? 'COMPLETE' : 'PENDING',
            priority: 'HIGH',
            details: pendingDuty.length > 0
                ? `${pendingDuty.length} entries with pending balance`
                : 'All payments cleared'
        });

        // Overall compliance score
        const completedTasks = checklist.items.filter(i => i.status === 'COMPLETE').length;
        checklist.complianceScore = ((completedTasks / checklist.items.length) * 100).toFixed(2);

        res.json(checklist);
    } catch (error) {
        console.error('Error fetching compliance checklist:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
