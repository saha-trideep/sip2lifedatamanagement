import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, RefreshCw, ArrowLeft, Sun, Moon, Printer,
    CheckCircle2, AlertCircle, Clock, Activity,
    Database, Truck, Package, Trash, Calculator,
    FileText, ShieldCheck, TrendingUp, AlertTriangle,
    Info, ChevronRight, Download, BarChart3, ClipboardList
} from 'lucide-react';
import { API_URL } from '../../config';
import { useTheme } from '../../context/ThemeContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DailyHandbook = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [summary, setSummary] = useState(null);
    const [weeklyData, setWeeklyData] = useState(null);
    const [checklist, setChecklist] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [summaryRes, weeklyRes, checklistRes] = await Promise.all([
                axios.get(`${API_URL}/api/daily-handbook/summary/${selectedDate}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/daily-handbook/weekly-overview`, {
                    params: { startDate: new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() - 7)).toISOString() },
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/daily-handbook/compliance-checklist/${selectedDate}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setSummary(summaryRes.data);
            setWeeklyData(weeklyRes.data);
            setChecklist(checklistRes.data);
        } catch (error) {
            console.error("Fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const generatePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('DAILY OPERATIONS HANDBOOK', 14, 20);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`SIP2LIFE Distilleries - ${format(new Date(selectedDate), 'dd MMMM yyyy')}`, 14, 28);

        // Summary Section
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('MASTER LEDGER (REG-78)', 14, 40);

        if (summary?.reg78?.exists) {
            doc.autoTable({
                startY: 45,
                head: [['Metric', 'BL', 'AL']],
                body: [
                    ['Opening Balance', summary.reg78.openingBL.toFixed(2), summary.reg78.openingAL.toFixed(2)],
                    ['Receipts', summary.reg78.receiptBL.toFixed(2), summary.reg78.receiptAL.toFixed(2)],
                    ['Issues', summary.reg78.issueBL.toFixed(2), summary.reg78.issueAL.toFixed(2)],
                    ['Wastage', summary.reg78.wastageBL.toFixed(2), summary.reg78.wastageAL.toFixed(2)],
                    ['Closing Balance', summary.reg78.closingBL.toFixed(2), summary.reg78.closingAL.toFixed(2)]
                ],
                styles: { fontSize: 9 }
            });
        }

        // Compliance Checklist
        let yPos = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 80;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('COMPLIANCE CHECKLIST', 14, yPos);

        if (checklist) {
            doc.autoTable({
                startY: yPos + 5,
                head: [['Task', 'Status', 'Priority']],
                body: checklist.items.map(item => [
                    `${item.register}: ${item.task}`,
                    item.status,
                    item.priority
                ]),
                styles: { fontSize: 9 }
            });
        }

        // Signature Block
        yPos = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(10);
        doc.text('_____________________', 14, yPos);
        doc.text('Distillery Manager', 14, yPos + 5);
        doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 14, yPos + 10);

        doc.save(`DailyHandbook_${format(new Date(selectedDate), 'yyyyMMdd')}.pdf`);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'CRITICAL': return 'rose';
            case 'HIGH': return 'amber';
            case 'MEDIUM': return 'blue';
            default: return 'gray';
        }
    };

    const getStatusIcon = (status) => {
        return status === 'COMPLETE' ? CheckCircle2 : AlertCircle;
    };

    return (
        <div className={`min-h-screen p-6 lg:p-10 transition-colors duration-500 ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50/50'}`}>
            <div className="max-w-[1600px] mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white shadow-2xl shadow-indigo-500/30">
                                <ClipboardList size={32} />
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Daily Handbook</h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Consolidated Operations Dashboard & Compliance Tracker</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/registers')}
                            className="px-6 py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl text-sm font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all shadow-sm"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <button
                            onClick={generatePDF}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/30 transition-all flex items-center gap-2"
                        >
                            <Printer size={18} /> Print Report
                        </button>
                        <button
                            onClick={toggleTheme}
                            className={`p-4 rounded-3xl shadow-lg transition-all ${isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
                        >
                            {isDark ? <Sun size={24} /> : <Moon size={24} />}
                        </button>
                    </div>
                </div>

                {/* Date Selector */}
                <div className="flex items-center justify-center gap-6">
                    <div className={`p-6 px-10 rounded-[2.5rem] border shadow-xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center gap-6">
                            <Calendar size={24} className="text-indigo-500" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="bg-transparent border-0 text-2xl font-black uppercase tracking-wider focus:ring-0 text-indigo-600"
                            />
                            <button
                                onClick={fetchData}
                                className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg"
                            >
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-20">
                        <RefreshCw className="animate-spin text-indigo-500" size={48} />
                    </div>
                ) : (
                    <>
                        {/* Compliance Score Banner */}
                        {checklist && (
                            <div className={`p-8 rounded-[2.5rem] border shadow-2xl ${parseFloat(checklist.complianceScore) === 100
                                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400'
                                    : parseFloat(checklist.complianceScore) >= 70
                                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400'
                                        : 'bg-gradient-to-br from-rose-500 to-red-600 border-rose-400'
                                } text-white`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Daily Compliance Score</div>
                                        <div className="text-6xl font-black tracking-tighter">{checklist.complianceScore}%</div>
                                        <div className="text-sm font-bold uppercase tracking-widest opacity-90 mt-2">
                                            {parseFloat(checklist.complianceScore) === 100 ? '✓ All Tasks Complete' : `${checklist.items.filter(i => i.status === 'PENDING').length} Pending Actions`}
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white/20 rounded-3xl backdrop-blur-sm">
                                        <ShieldCheck size={64} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Master Ledger Summary */}
                        {summary?.reg78?.exists ? (
                            <div className={`p-10 rounded-[3rem] border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                        <Database size={28} className="text-indigo-500" />
                                        Master Spirit Ledger (Reg-78)
                                    </h2>
                                    {summary.reg78.isReconciled ? (
                                        <span className="px-6 py-3 bg-emerald-500/10 text-emerald-500 text-xs font-black rounded-full uppercase tracking-widest flex items-center gap-2 border border-emerald-500/20">
                                            <CheckCircle2 size={16} /> Reconciled
                                        </span>
                                    ) : (
                                        <span className="px-6 py-3 bg-amber-500/10 text-amber-600 text-xs font-black rounded-full uppercase tracking-widest flex items-center gap-2 border border-amber-500/20">
                                            <Clock size={16} /> Pending Verification
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-5 gap-6">
                                    {[
                                        { label: 'Opening', bl: summary.reg78.openingBL, al: summary.reg78.openingAL, icon: Database, color: 'gray' },
                                        { label: 'Receipts', bl: summary.reg78.receiptBL, al: summary.reg78.receiptAL, icon: Truck, color: 'blue' },
                                        { label: 'Issues', bl: summary.reg78.issueBL, al: summary.reg78.issueAL, icon: Package, color: 'emerald' },
                                        { label: 'Wastage', bl: summary.reg78.wastageBL, al: summary.reg78.wastageAL, icon: Trash, color: 'rose' },
                                        { label: 'Closing', bl: summary.reg78.closingBL, al: summary.reg78.closingAL, icon: Database, color: 'indigo' }
                                    ].map((item, idx) => (
                                        <div key={idx} className={`p-6 rounded-3xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className={`p-3 bg-${item.color}-500/10 text-${item.color}-500 rounded-2xl inline-flex mb-4`}>
                                                <item.icon size={20} />
                                            </div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{item.label}</div>
                                            <div className="text-2xl font-black text-gray-900 dark:text-white">{item.bl.toFixed(2)} <span className="text-xs text-gray-400">BL</span></div>
                                            <div className="text-sm font-black text-indigo-500 mt-1">{item.al.toFixed(2)} <span className="text-xs text-gray-400 italic">AL</span></div>
                                        </div>
                                    ))}
                                </div>

                                {summary.reg78.variance !== null && summary.reg78.variance !== 0 && (
                                    <div className={`mt-6 p-6 rounded-3xl border ${Math.abs(summary.reg78.variance) > 1 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Activity size={20} className={Math.abs(summary.reg78.variance) > 1 ? 'text-rose-500' : 'text-emerald-500'} />
                                                <span className="text-sm font-black uppercase tracking-widest">Variance Detected</span>
                                            </div>
                                            <span className={`text-2xl font-black ${Math.abs(summary.reg78.variance) > 1 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {summary.reg78.variance > 0 ? '+' : ''}{summary.reg78.variance.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={`p-12 rounded-[3rem] border-2 border-dashed text-center ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                                <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
                                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Master Ledger Not Generated</h3>
                                <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">Run the daily aggregator to generate Reg-78 entry for this date</p>
                                <button
                                    onClick={() => navigate('/registers/reg78')}
                                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl transition-all"
                                >
                                    Go to Reg-78
                                </button>
                            </div>
                        )}

                        {/* Register Activity Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Reg-74 */}
                            <div className={`p-8 rounded-[2.5rem] border shadow-lg ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Reg-74 Vat Ops</h3>
                                    <Database size={20} className="text-purple-500" />
                                </div>
                                <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">{summary?.reg74?.totalEvents || 0}</div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Events Recorded</div>
                                <div className="mt-4 text-[10px] font-black text-purple-500 uppercase">{summary?.reg74?.vatsInvolved || 0} Vats Involved</div>
                            </div>

                            {/* Reg-76 */}
                            <div className={`p-8 rounded-[2.5rem] border shadow-lg ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Reg-76 Receipts</h3>
                                    <Truck size={20} className="text-blue-500" />
                                </div>
                                <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">{summary?.reg76?.totalReceipts || 0}</div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Permits Processed</div>
                                <div className="mt-4 text-[10px] font-black text-blue-500 uppercase">{(summary?.reg76?.totalAL || 0).toFixed(2)} AL Received</div>
                            </div>

                            {/* Reg-A */}
                            <div className={`p-8 rounded-[2.5rem] border shadow-lg ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Reg-A Production</h3>
                                    <Package size={20} className="text-emerald-500" />
                                </div>
                                <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">{summary?.regA?.totalBottles?.toLocaleString() || 0}</div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bottles Produced</div>
                                <div className="mt-4 text-[10px] font-black text-emerald-500 uppercase">{(summary?.regA?.totalSpiritBottledAL || 0).toFixed(2)} AL Bottled</div>
                            </div>

                            {/* Reg-B */}
                            <div className={`p-8 rounded-[2.5rem] border shadow-lg ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Reg-B Dispatch</h3>
                                    <Truck size={20} className="text-indigo-500" />
                                </div>
                                <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">{summary?.regB?.totalEntries || 0}</div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dispatch Entries</div>
                                <div className="mt-4 text-[10px] font-black text-indigo-500 uppercase">{(summary?.regB?.totalIssuedAL || 0).toFixed(2)} AL Issued</div>
                            </div>

                            {/* Excise Duty */}
                            <div className={`p-8 rounded-[2.5rem] border shadow-lg ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Excise Duty</h3>
                                    <Calculator size={20} className="text-amber-500" />
                                </div>
                                <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">₹{(summary?.exciseDuty?.totalPaidAmount || 0).toLocaleString()}</div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payments Made</div>
                                <div className="mt-4 text-[10px] font-black text-amber-500 uppercase">₹{(summary?.exciseDuty?.totalBalance || 0).toLocaleString()} Pending</div>
                            </div>

                            {/* Weekly Compliance */}
                            <div className={`p-8 rounded-[2.5rem] border shadow-lg ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Weekly Compliance</h3>
                                    <BarChart3 size={20} className="text-green-500" />
                                </div>
                                <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">{weeklyData?.compliance?.complianceRate || 0}%</div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reconciliation Rate</div>
                                <div className="mt-4 text-[10px] font-black text-green-500 uppercase">{weeklyData?.compliance?.daysReconciled || 0}/{weeklyData?.compliance?.daysWithLedger || 0} Days</div>
                            </div>
                        </div>

                        {/* Compliance Checklist */}
                        {checklist && (
                            <div className={`p-10 rounded-[3rem] border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 mb-8">
                                    <ClipboardList size={28} className="text-indigo-500" />
                                    Compliance Checklist
                                </h2>

                                <div className="space-y-4">
                                    {checklist.items.map((item, idx) => {
                                        const StatusIcon = getStatusIcon(item.status);
                                        const color = getPriorityColor(item.priority);

                                        return (
                                            <div key={idx} className={`p-6 rounded-3xl border transition-all ${item.status === 'COMPLETE'
                                                    ? (isDark ? 'bg-emerald-900/20 border-emerald-800/30' : 'bg-emerald-50 border-emerald-100')
                                                    : (isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200')
                                                }`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-3 rounded-2xl ${item.status === 'COMPLETE'
                                                                ? 'bg-emerald-500/20 text-emerald-500'
                                                                : `bg-${color}-500/20 text-${color}-500`
                                                            }`}>
                                                            <StatusIcon size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white mb-1">
                                                                {item.register}: {item.task}
                                                            </div>
                                                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{item.details}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-4 py-2 bg-${color}-500/10 text-${color}-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-${color}-500/20`}>
                                                            {item.priority}
                                                        </span>
                                                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'COMPLETE'
                                                                ? 'bg-emerald-500 text-white'
                                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pending Actions Alert */}
                        {summary?.compliance?.pendingActions?.length > 0 && (
                            <div className={`p-8 rounded-[2.5rem] border-2 ${isDark ? 'bg-amber-900/20 border-amber-800/50' : 'bg-amber-50 border-amber-200'}`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <AlertTriangle size={32} className="text-amber-500" />
                                    <h3 className="text-xl font-black uppercase tracking-tight">Pending Actions Required</h3>
                                </div>
                                <div className="space-y-3">
                                    {summary.compliance.pendingActions.map((action, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-amber-200 dark:border-amber-900/30">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${action.type === 'CRITICAL' ? 'bg-rose-500 text-white' :
                                                        action.type === 'WARNING' ? 'bg-amber-500 text-white' :
                                                            'bg-blue-500 text-white'
                                                    }`}>
                                                    {action.type}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{action.message}</span>
                                            </div>
                                            <ChevronRight size={20} className="text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DailyHandbook;
