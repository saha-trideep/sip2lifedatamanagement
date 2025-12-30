import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
    LayoutGrid, RefreshCw, ArrowLeft, Sun, Moon,
    Database, Calculator, FileText, Download,
    Search, Calendar, ChevronRight, ChevronDown,
    Plus, Package, Truck, Trash, Warehouse,
    CheckCircle2, AlertCircle, Info, Filter,
    Activity, Clock, ArrowRight, Printer,
    FileSpreadsheet, ClipboardList, ShieldCheck
} from 'lucide-react';
import { API_URL } from '../../config';
import { useTheme } from '../../context/ThemeContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reg78Register = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [entries, setEntries] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [drillDownData, setDrillDownData] = useState({});
    const [drillDownLoading, setDrillDownLoading] = useState({});
    const [showGenModal, setShowGenModal] = useState(false);
    const [showReconcileModal, setShowReconcileModal] = useState(false);
    const [reconcileEntry, setReconcileEntry] = useState(null);
    const [reconcileRemarks, setReconcileRemarks] = useState('');
    const [genDate, setGenDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [genLoading, setGenLoading] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        isReconciled: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [entryRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/api/reg78/entries`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: filters
                }),
                axios.get(`${API_URL}/api/reg78/summary/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { startDate: filters.startDate, endDate: filters.endDate }
                })
            ]);
            setEntries(entryRes.data.entries);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const handleExpandRow = async (id, date) => {
        if (expandedRow === id) {
            setExpandedRow(null);
            return;
        }

        setExpandedRow(id);

        if (!drillDownData[id]) {
            setDrillDownLoading(prev => ({ ...prev, [id]: true }));
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/api/reg78/entries/${id}`, {
                    params: { includeDrillDown: 'true' },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDrillDownData(prev => ({ ...prev, [id]: res.data.drillDown }));
            } catch (error) {
                console.error("Drilldown failed", error);
            } finally {
                setDrillDownLoading(prev => ({ ...prev, [id]: false }));
            }
        }
    };

    const handleGenerate = async () => {
        setGenLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/reg78/auto-generate/${genDate}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowGenModal(false);
            fetchData();
            alert("Daily ledger entry generated successfully!");
        } catch (error) {
            alert(error.response?.data?.error || "Generation failed. Verify if entry already exists.");
        } finally {
            setGenLoading(false);
        }
    };

    const handleReconcile = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/reg78/reconcile/${reconcileEntry.id}`,
                { remarks: reconcileRemarks },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowReconcileModal(false);
            setReconcileRemarks('');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Reconciliation failed");
        }
    };

    const exportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(entries.map(r => ({
            'Date': format(new Date(r.entryDate), 'dd-MM-yyyy'),
            'Opening BL': r.openingBl?.toFixed(2),
            'Opening AL': r.openingAl?.toFixed(2),
            'Receipts BL': r.receiptBl?.toFixed(2),
            'Receipts AL': r.receiptAl?.toFixed(2),
            'Issues BL': r.issueBl?.toFixed(2),
            'Issues AL': r.issueAl?.toFixed(2),
            'Wastage BL': r.wastageBl?.toFixed(2),
            'Wastage AL': r.wastageAl?.toFixed(2),
            'Closing BL': r.closingBl?.toFixed(2),
            'Closing AL': r.closingAl?.toFixed(2),
            'Variance %': r.variance?.toFixed(2),
            'Status': r.isReconciled ? 'Reconciled' : 'Pending'
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reg 78");
        XLSX.writeFile(workbook, `MasterSpiritLedger_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    };

    return (
        <div className={`min-h-screen p-6 lg:p-10 transition-colors duration-500 ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50/50'}`}>
            {/* Header */}
            <div className="max-w-[1600px] mx-auto space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                                <ShieldCheck size={28} />
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Reg-78 Master Ledger</h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Statutory Spirit Account & Verification Register</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/registers')}
                            className="px-6 py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl text-sm font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all shadow-sm"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <button
                            onClick={() => setShowGenModal(true)}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/30 transition-all flex items-center gap-2"
                        >
                            <RefreshCw size={18} /> Run Daily Aggregator
                        </button>
                        <button
                            onClick={toggleTheme}
                            className={`p-4 rounded-3xl shadow-lg transition-all ${isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
                        >
                            {isDark ? <Sun size={24} /> : <Moon size={24} />}
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {[
                        { label: 'Closing Stock (BL)', value: (stats?.currentClosingBl || 0).toFixed(2), icon: Warehouse, color: 'indigo' },
                        { label: 'Closing Stock (AL)', value: (stats?.currentClosingAl || 0).toFixed(2), icon: Database, color: 'blue' },
                        { label: 'Monthly Issues (AL)', value: (stats?.totalIssuesAl || 0).toFixed(2), icon: Truck, color: 'emerald' },
                        { label: 'Total Wastage (AL)', value: (stats?.totalWastageAl || 0).toFixed(2), icon: Trash, color: 'rose' },
                        { label: 'Avg Variance', value: `${(stats?.averageVariance || 0).toFixed(2)}%`, icon: Activity, color: 'amber' },
                    ].map((s, i) => (
                        <div key={i} className={`p-8 rounded-[2.5rem] border transition-all hover:shadow-2xl hover:-translate-y-1 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <div className={`p-4 bg-${s.color}-500/10 text-${s.color}-500 rounded-2xl inline-flex mb-6`}>
                                <s.icon size={24} />
                            </div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
                            <div className="text-3xl font-black tracking-tighter">{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Filters & Export */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-3 px-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3">
                            <Calendar size={18} className="text-indigo-500" />
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                                className="bg-transparent border-0 text-[10px] font-black uppercase tracking-widest focus:ring-0"
                            />
                            <span className="text-gray-300">to</span>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                                className="bg-transparent border-0 text-[10px] font-black uppercase tracking-widest focus:ring-0"
                            />
                        </div>
                        <div className="w-px h-6 bg-gray-100 dark:bg-gray-800"></div>
                        <select
                            value={filters.isReconciled}
                            onChange={e => setFilters({ ...filters, isReconciled: e.target.value })}
                            className="bg-transparent border-0 text-[10px] font-black uppercase tracking-widest focus:ring-0"
                        >
                            <option value="">All Status</option>
                            <option value="true">Reconciled</option>
                            <option value="false">Pending</option>
                        </select>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={exportExcel} className={`flex items-center gap-2 px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition shadow-lg ${isDark ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-900/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100'}`}>
                            <FileSpreadsheet size={18} /> Excel Export
                        </button>
                        <button onClick={() => window.print()} className={`flex items-center gap-2 px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition shadow-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-black text-white'}`}>
                            <Printer size={18} /> Print Statutory
                        </button>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className={`rounded-[3rem] border shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className={`${isDark ? 'bg-gray-800/50 text-gray-500' : 'bg-gray-50 text-gray-400'} text-[9px] font-black uppercase tracking-[0.2em]`}>
                                    <th className="px-8 py-6 text-left border-b dark:border-gray-800">Entry Date</th>
                                    <th className="px-5 py-6 text-right border-b dark:border-gray-800">Opening (BL/AL)</th>
                                    <th className="px-5 py-6 text-right border-b dark:border-gray-800">Receipts (BL/AL)</th>
                                    <th className="px-5 py-6 text-right border-b dark:border-gray-800">Issues (BL/AL)</th>
                                    <th className="px-5 py-6 text-right border-b dark:border-gray-800">Wastage (BL/AL)</th>
                                    <th className="px-8 py-6 text-right border-b dark:border-gray-800">Closing (BL/AL)</th>
                                    <th className="px-8 py-6 text-center border-b dark:border-gray-800 whitespace-nowrap">Status / Variance</th>
                                    <th className="px-8 py-6 text-center border-b dark:border-gray-800">Drill</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => (
                                    <React.Fragment key={entry.id}>
                                        <tr className={`border-b dark:border-gray-800 transition-all group ${expandedRow === entry.id ? (isDark ? 'bg-indigo-900/20' : 'bg-indigo-50/50') : (isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50')}`}>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-black text-gray-900 dark:text-white mb-0.5">{format(new Date(entry.entryDate), 'dd MMM yyyy')}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">{format(new Date(entry.entryDate), 'EEEE')}</div>
                                            </td>
                                            <td className="px-5 py-6 text-right">
                                                <div className="text-sm font-black text-gray-700 dark:text-gray-300">{(entry.openingBl || 0).toFixed(2)} <span className="text-[9px] text-gray-400">BL</span></div>
                                                <div className="text-[10px] font-black text-indigo-500">{(entry.openingAl || 0).toFixed(2)} <span className="text-gray-400 italic">AL</span></div>
                                            </td>
                                            <td className="px-5 py-6 text-right">
                                                <div className="text-sm font-black text-blue-600">{(entry.receiptBl || 0).toFixed(2)} <span className="text-[9px] text-gray-400">BL</span></div>
                                                <div className="text-[10px] font-black text-blue-400">{(entry.receiptAl || 0).toFixed(2)} <span className="text-gray-400 italic">AL</span></div>
                                            </td>
                                            <td className="px-5 py-6 text-right">
                                                <div className="text-sm font-black text-emerald-600">{(entry.issueBl || 0).toFixed(2)} <span className="text-[9px] text-gray-400">BL</span></div>
                                                <div className="text-[10px] font-black text-emerald-400">{(entry.issueAl || 0).toFixed(2)} <span className="text-gray-400 italic">AL</span></div>
                                            </td>
                                            <td className="px-5 py-6 text-right">
                                                <div className="text-sm font-black text-rose-500">{(entry.wastageBl || 0).toFixed(2)} <span className="text-[9px] text-gray-400">BL</span></div>
                                                <div className="text-[10px] font-black text-rose-400">{(entry.wastageAl || 0).toFixed(2)} <span className="text-gray-400 italic">AL</span></div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="text-lg font-black text-gray-900 dark:text-white italic">{(entry.closingBl || 0).toFixed(2)}</div>
                                                <div className="text-[10px] font-black text-indigo-500 uppercase">Abs: {(entry.closingAl || 0).toFixed(2)}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    {entry.isReconciled ? (
                                                        <span className="px-4 py-1.5 bg-green-500/10 text-green-500 text-[9px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5 border border-green-500/20">
                                                            <CheckCircle2 size={10} /> Reconciled
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setReconcileEntry(entry); setShowReconcileModal(true); }}
                                                            className="px-4 py-1.5 bg-amber-500/10 text-amber-600 text-[9px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5 border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Activity size={10} /> Verify
                                                        </button>
                                                    )}
                                                    {entry.variance !== null && entry.variance !== 0 && (
                                                        <span className={`text-[10px] font-black italic ${Math.abs(entry.variance) > 1 ? 'text-red-500' : 'text-gray-400'}`}>
                                                            {entry.variance > 0 ? '+' : ''}{entry.variance.toFixed(2)}% Var
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    onClick={() => handleExpandRow(entry.id, entry.entryDate)}
                                                    className={`p-3 rounded-2xl transition-all ${expandedRow === entry.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 rotate-180' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-500'}`}
                                                >
                                                    <ChevronDown size={18} />
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expandable Drill-Down Section */}
                                        {expandedRow === entry.id && (
                                            <tr className={isDark ? 'bg-gray-950' : 'bg-gray-50/30'}>
                                                <td colSpan="8" className="px-12 py-12">
                                                    {drillDownLoading[entry.id] ? (
                                                        <div className="flex items-center justify-center p-12">
                                                            <RefreshCw className="animate-spin text-indigo-500" size={32} />
                                                            <span className="ml-4 font-black uppercase tracking-widest text-indigo-500 italic">Fetching source register audit...</span>
                                                        </div>
                                                    ) : drillDownData[entry.id] ? (
                                                        <div className="grid grid-cols-3 gap-10 animate-in slide-in-from-top-4 duration-500">
                                                            {/* Receipts Section */}
                                                            <div className="space-y-6">
                                                                <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2 border-l-4 border-blue-500 pl-4 py-1">
                                                                    <Truck size={14} /> Receipts (Reg-76)
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    {drillDownData[entry.id].receipts.reg76.length > 0 ? drillDownData[entry.id].receipts.reg76.map((r, idx) => (
                                                                        <div key={idx} className={`p-5 rounded-3xl border ${isDark ? 'bg-gray-900 border-gray-800 shadow-lg' : 'bg-white border-gray-100 shadow-sm'}`}>
                                                                            <div className="flex justify-between items-start mb-3">
                                                                                <span className="text-[10px] font-black uppercase text-gray-400">Permit: {r.permitNo}</span>
                                                                                <span className="text-[10px] font-black uppercase text-blue-500">+{r.bl?.toFixed(2)} BL</span>
                                                                            </div>
                                                                            <div className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase truncate">{r.distillery}</div>
                                                                            <div className="mt-2 text-[9px] text-gray-400 font-bold italic uppercase tracking-tighter">Vat: {r.vat}</div>
                                                                        </div>
                                                                    )) : <p className="text-[10px] font-bold text-gray-400 uppercase italic">No receipts recorded today.</p>}
                                                                </div>
                                                            </div>

                                                            {/* Issues Section */}
                                                            <div className="space-y-6">
                                                                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2 border-l-4 border-emerald-500 pl-4 py-1">
                                                                    <ArrowRight size={14} /> Issues (Reg-A & B)
                                                                </h4>
                                                                <div className="space-y-4">
                                                                    <div className="text-[9px] font-black uppercase text-gray-400 mb-2">— Production (Reg-A)</div>
                                                                    {drillDownData[entry.id].issues.regA.map((r, idx) => (
                                                                        <div key={idx} className={`p-5 rounded-3xl border-l-4 border-l-emerald-500 ${isDark ? 'bg-gray-900 border-gray-800 shadow-lg' : 'bg-white border-gray-100 shadow-sm'}`}>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">{r.brand}</span>
                                                                                <span className="text-[10px] font-black text-emerald-500">{r.bl?.toFixed(2)} BL</span>
                                                                            </div>
                                                                            <div className="text-[9px] text-gray-400 font-bold mt-1 tracking-widest uppercase">Batch: {r.batchNo}</div>
                                                                        </div>
                                                                    ))}
                                                                    <div className="text-[9px] font-black uppercase text-gray-400 mt-6 mb-2">— Market Dispatch (Reg-B)</div>
                                                                    {drillDownData[entry.id].issues.regB.map((r, idx) => (
                                                                        <div key={idx} className={`p-5 rounded-3xl border-l-4 border-l-indigo-500 ${isDark ? 'bg-gray-900 border-gray-800 shadow-lg' : 'bg-white border-gray-100 shadow-sm'}`}>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-xs font-black text-indigo-500 italic uppercase">Dispatch Entry</span>
                                                                                <span className="text-[10px] font-black text-indigo-500">{r.bl?.toFixed(2)} BL</span>
                                                                            </div>
                                                                            <div className="text-[9px] text-gray-400 font-bold mt-1 tracking-widest uppercase italic">Reg-B Ref: #{r.id}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Wastage Section */}
                                                            <div className="space-y-6">
                                                                <h4 className="text-xs font-black uppercase tracking-widest text-rose-500 flex items-center gap-2 border-l-4 border-rose-500 pl-4 py-1">
                                                                    <Trash size={14} /> Wastage (Audit)
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    {drillDownData[entry.id].wastage.reg74.map((r, idx) => (
                                                                        <div key={idx} className={`p-4 rounded-2.5xl border bg-rose-500/5 ${isDark ? 'border-rose-900/30' : 'border-rose-100 shadow-sm'}`}>
                                                                            <div className="flex justify-between items-center mb-1">
                                                                                <span className="text-[10px] font-black uppercase text-rose-600">Storage Wastage</span>
                                                                                <span className="text-[10px] font-black text-rose-600">-{r.al?.toFixed(2)} AL</span>
                                                                            </div>
                                                                            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Vat: {r.vatCode} | Type: {r.eventType}</div>
                                                                        </div>
                                                                    ))}
                                                                    {drillDownData[entry.id].wastage.regA.length > 0 &&
                                                                        <div className="p-4 rounded-2.5xl border bg-rose-500/10 border-rose-200 dark:border-rose-900/30">
                                                                            <div className="text-[10px] font-black text-rose-700 uppercase mb-1">Production Process Wastage</div>
                                                                            <div className="text-sm font-black text-rose-600">-{drillDownData[entry.id].wastage.regA.reduce((s, v) => s + v.wastageAl, 0).toFixed(2)} AL</div>
                                                                        </div>
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center p-12 text-gray-400 uppercase font-black tracking-widest italic">Source data link broken or missing.</div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Aggregator Modal */}
            {showGenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md" onClick={() => setShowGenModal(false)} />
                    <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center space-y-8">
                            <div className="mx-auto w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/50">
                                <RefreshCw size={40} className={genLoading ? 'animate-spin' : ''} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight mb-2 italic">Run Aggregator</h2>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Select target date for statutory consolidation</p>
                            </div>

                            <div className="space-y-6">
                                <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700">
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-4 tracking-widest">Ledger Entry Date</label>
                                    <input
                                        type="date"
                                        value={genDate}
                                        onChange={e => setGenDate(e.target.value)}
                                        className="bg-transparent border-0 text-3xl font-black text-indigo-600 focus:ring-0 text-center w-full uppercase"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setShowGenModal(false)}
                                        className="py-5 bg-gray-50 dark:bg-gray-800 rounded-3xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={genLoading}
                                        className="py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
                                    >
                                        {genLoading ? <RefreshCw className="animate-spin" size={16} /> : <><RefreshCw size={16} /> Aggregate Data</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reconciliation Modal */}
            {showReconcileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" onClick={() => setShowReconcileModal(false)} />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden animate-in fade-in duration-300">
                        <div className="p-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-amber-500/20 text-amber-500 rounded-2xl">
                                    <ShieldCheck size={32} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight italic">Verify Daily Ledger</h2>
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest italic">{format(new Date(reconcileEntry.entryDate), 'EEEE, dd MMMM yyyy')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-center">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Calculated Balance</div>
                                    <div className="text-2xl font-black text-indigo-500">{reconcileEntry.closingBl?.toFixed(2)} BL</div>
                                </div>
                                <div className={`p-6 rounded-3xl border text-center ${Math.abs(reconcileEntry.variance) > 1 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Recorded Variance</div>
                                    <div className={`text-2xl font-black ${Math.abs(reconcileEntry.variance) > 1 ? 'text-rose-500' : 'text-emerald-500'}`}>{reconcileEntry.variance?.toFixed(2)}%</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Audit Remarks / Explanation</label>
                                <textarea
                                    value={reconcileRemarks}
                                    onChange={e => setReconcileRemarks(e.target.value)}
                                    placeholder="Enter reason for variance or confirmation notes..."
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-3xl p-6 text-sm font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all"
                                    rows="3"
                                />
                                {Math.abs(reconcileEntry.variance) > 1 && !reconcileRemarks && (
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 ml-2">
                                        <AlertCircle size={12} /> High variance detected. Remarks are required.
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowReconcileModal(false)}
                                    className="flex-1 py-5 bg-gray-50 dark:bg-gray-800 rounded-3xl text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all"
                                >
                                    Review More
                                </button>
                                <button
                                    onClick={handleReconcile}
                                    disabled={Math.abs(reconcileEntry.variance) > 1 && !reconcileRemarks}
                                    className="flex-1 py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 disabled:shadow-none"
                                >
                                    <ShieldCheck size={18} /> Reconcile & Certify
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reg78Register;
