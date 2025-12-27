import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
    Package, Edit, Trash2, Plus, Search, Filter, ChevronRight,
    AlertCircle, CheckCircle2, Clock, RefreshCw, Eye, Save,
    Calculator, FileText, Download, ArrowLeft, ArrowRight, Sun, Moon,
    Warehouse, Truck, ShoppingCart, Trash, Info, LayoutGrid, BookOpen
} from 'lucide-react';
import { API_URL } from '../../config';
import { useTheme } from '../../context/ThemeContext';
import BottleCountGrid from '../../components/excise/BottleCountGrid';

const RegBRegister = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [entries, setEntries] = useState([]);
    const [batches, setBatches] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('opening'); // opening, receipt, issue, wastage

    // Form State
    const [formData, setFormData] = useState({});
    const [isEdit, setIsEdit] = useState(false);
    const [calcPreview, setCalcPreview] = useState(null);
    const [calculating, setCalculating] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        startDate: format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        batchId: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [entryRes, batchRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/api/registers/regb`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: filters
                }),
                axios.get(`${API_URL}/api/reg74/batches`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/registers/regb/summary/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: filters
                })
            ]);
            setEntries(entryRes.data.entries);
            setBatches(batchRes.data);
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

    // Calculation Preview Hook
    useEffect(() => {
        if (showModal) {
            const timer = setTimeout(async () => {
                try {
                    setCalculating(true);
                    const token = localStorage.getItem('token');
                    const res = await axios.post(`${API_URL}/api/registers/regb/calculate`, formData, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setCalcPreview(res.data);
                } catch (error) {
                    console.error("Calc failed", error);
                } finally {
                    setCalculating(false);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [formData, showModal]);

    const handleCreateNew = () => {
        setIsEdit(false);
        setFormData({
            entryDate: format(new Date(), 'yyyy-MM-dd'),
            batchId: '',
            remarks: ''
        });
        setCalcPreview(null);
        setActiveTab('opening');
        setShowModal(true);
    };

    const handleEdit = (entry) => {
        setIsEdit(true);
        setFormData({
            ...entry,
            entryDate: format(new Date(entry.entryDate), 'yyyy-MM-dd'),
            batchId: entry.batchId || ''
        });
        setCalcPreview(null);
        setActiveTab('opening');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (isEdit) {
                await axios.put(`${API_URL}/api/registers/regb/${formData.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/api/registers/regb`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Save failed");
        }
    };

    const handleAutoFill = async () => {
        if (!formData.entryDate) return alert("Select date first");
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/registers/regb/auto-fill/${formData.entryDate}`,
                { batchId: formData.batchId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setFormData(prev => ({
                ...prev,
                ...res.data.receiptData
            }));

            alert(res.data.message);
            setActiveTab('receipt');
        } catch (error) {
            alert(error.response?.data?.error || "Auto-fill found no data");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this entry?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/registers/regb/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/30 dark:bg-gray-950 p-6 lg:p-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                            <LayoutGrid size={24} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Reg-B Inventory</h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Issue of Country Liquor in Bottles • Inventory & Fees</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/registers')}
                        className="px-6 py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl text-sm font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all flex items-center gap-2"
                    >
                        <ArrowLeft size={16} /> Dashboard
                    </button>
                    <button
                        onClick={handleCreateNew}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> New Daily Entry
                    </button>
                    <button
                        onClick={toggleTheme}
                        className={`p-4 rounded-2xl shadow-lg transition-all ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600 border border-gray-100'}`}
                    >
                        {isDark ? <Sun size={24} /> : <Moon size={24} />}
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                {[
                    { label: 'Total Issued (AL)', value: (stats?.totalIssuedAl || 0).toFixed(2), icon: Truck, color: 'indigo' },
                    { label: 'Total Wastage (AL)', value: (stats?.totalWastageAl || 0).toFixed(2), icon: Trash, color: 'red' },
                    { label: 'Production Fees', value: `₹${(stats?.totalProductionFees || 0).toLocaleString()}`, icon: Calculator, color: 'emerald' },
                    { label: 'Register Entries', value: stats?.totalEntries || 0, icon: FileText, color: 'blue' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                        <div className={`p-4 bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 dark:text-${s.color}-400 rounded-2xl inline-flex mb-6`}>
                            <s.icon size={24} />
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white">{s.value || '--'}</div>
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-12">
                {/* Search & Filters */}
                <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 min-w-[350px]">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter by Batch or Remarks..."
                            className="bg-transparent border-0 focus:ring-0 text-sm font-bold text-gray-900 dark:text-white w-full"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50/50 dark:bg-gray-800/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="bg-transparent border-0 text-[10px] font-black uppercase tracking-widest text-gray-500 focus:ring-0"
                            />
                            <span className="text-gray-300">to</span>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="bg-transparent border-0 text-[10px] font-black uppercase tracking-widest text-gray-500 focus:ring-0"
                            />
                        </div>
                        <button onClick={fetchData} className="p-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-gray-500 rounded-2xl hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/30 dark:bg-gray-800/30">
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800">Entry Date</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800">Batch / Brand</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800">Receipt (AL)</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800">Issues (AL)</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800">Fees</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800">Closing (AL)</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all border-b border-gray-50 dark:border-gray-800">
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-black text-gray-900 dark:text-white mb-1">{format(new Date(entry.entryDate), 'dd MMM yyyy')}</div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{format(new Date(entry.entryDate), 'EEEE')}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                                                <Package size={14} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-gray-900 dark:text-white uppercase">{entry.batch?.baseBatchNo || 'N/A'}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{entry.batch?.brand?.name || 'Manual'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right text-sm font-black text-indigo-600 dark:text-indigo-400">
                                        {(entry.totalReceiptAl || 0).toFixed(2)}
                                    </td>
                                    <td className="px-8 py-6 text-right text-sm font-black text-gray-900 dark:text-white">
                                        {(entry.totalIssueAl || 0).toFixed(2)}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-black rounded-lg">
                                            ₹{(entry.productionFees || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="text-sm font-black text-gray-900 dark:text-white">{(entry.totalClosingAl || 0).toFixed(2)}</div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">AL</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(entry)}
                                                className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all shadow-sm"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {entries.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center">
                                        <div className="inline-flex p-6 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400 mb-6">
                                            <BookOpen size={48} />
                                        </div>
                                        <div className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase">No entries found</div>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Start recording bottle inventory issues and receipts for your distillery by creating a new entry.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10">
                    <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-xl" onClick={() => setShowModal(false)} />

                    <div className="relative w-full max-w-7xl h-full max-h-[90vh] bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="p-8 lg:p-10 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-xl">
                                        <Edit size={20} />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase">
                                        {isEdit ? 'Update Entry' : 'New Daily Inventory Entry'}
                                    </h2>
                                </div>
                                <p className="text-gray-400 text-sm font-medium">Capture bottle counts across all strength sectors</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-2xl transition-all"
                            >
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto flex">
                            {/* Main Form Area */}
                            <div className="w-2/3 p-10 border-r border-gray-50 dark:border-gray-800">
                                <form id="regb-form" onSubmit={handleSubmit} className="space-y-10">
                                    {/* Primary Info */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Clock size={12} /> Entry Date
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.entryDate}
                                                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900 dark:text-white transition-all"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Package size={12} /> Link to Batch
                                            </label>
                                            <select
                                                value={formData.batchId}
                                                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900 dark:text-white transition-all"
                                            >
                                                <option value="">Select Batch (Optional)</option>
                                                {batches.filter(b => b.status !== 'CLOSED').map(b => (
                                                    <option key={b.id} value={b.id}>{b.baseBatchNo} - {b.brand?.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Tabs / Grid Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 bg-gray-50/50 dark:bg-gray-800/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-800">
                                            {[
                                                { id: 'opening', label: 'Opening Stock', icon: Warehouse },
                                                { id: 'receipt', label: 'Receipts', icon: Truck },
                                                { id: 'issue', label: 'Issues', icon: ShoppingCart },
                                                { id: 'wastage', label: 'Wastage', icon: Trash },
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                                                >
                                                    <tab.icon size={14} /> {tab.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="animate-in fade-in duration-300">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase flex items-center gap-2">
                                                    Section Details: <span className="text-indigo-600">{activeTab} bottles</span>
                                                </h4>
                                                {activeTab === 'receipt' && (
                                                    <button
                                                        type="button"
                                                        onClick={handleAutoFill}
                                                        className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100 dark:border-indigo-800"
                                                    >
                                                        <RefreshCw size={14} /> Pull from Reg-A
                                                    </button>
                                                )}
                                            </div>

                                            <BottleCountGrid
                                                section={activeTab}
                                                data={formData}
                                                onChange={(field, val) => setFormData(p => ({ ...p, [field]: val }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remarks</label>
                                        <textarea
                                            value={formData.remarks || ''}
                                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                            rows="2"
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl focus:ring-0 font-medium text-gray-900 dark:text-white transition-all text-sm"
                                            placeholder="Notes about breakages or special issues..."
                                        />
                                    </div>
                                </form>
                            </div>

                            {/* Sidebar Calculation Summaries */}
                            <div className="w-1/3 p-10 bg-gray-50/30 dark:bg-gray-800/20 space-y-8 flex flex-col">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                                    <Info size={16} /> LIVE SUMMARY
                                </h3>

                                <div className="space-y-6 flex-1">
                                    {/* Section Totals Breakdown */}
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Opening', bl: calcPreview?.totals?.totalOpeningBl, al: calcPreview?.totals?.totalOpeningAl, color: 'gray' },
                                            { label: 'Receipts', bl: calcPreview?.totals?.totalReceiptBl, al: calcPreview?.totals?.totalReceiptAl, color: 'indigo' },
                                            { label: 'Issues', bl: calcPreview?.totals?.totalIssueBl, al: calcPreview?.totals?.totalIssueAl, color: 'emerald' },
                                            { label: 'Wastage', bl: calcPreview?.totals?.totalWastageBl, al: calcPreview?.totals?.totalWastageAl, color: 'red' },
                                        ].map((s, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                <div className="text-xs font-black uppercase text-gray-400">{s.label}</div>
                                                <div className="text-right">
                                                    <div className={`text-sm font-black text-${s.color}-600`}>{(s.bl || 0).toFixed(2)}<span className="text-[10px] text-gray-400 ml-1">BL</span></div>
                                                    <div className="text-[10px] font-black text-gray-500">{(s.al || 0).toFixed(2)}<span className="ml-1 text-gray-300">AL</span></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Closing Balance Highlight */}
                                    <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 dark:shadow-none">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Closing Stock Balance</div>
                                            <ArrowRight size={16} className="opacity-70" />
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black">{(calcPreview?.totals?.totalClosingAl || 0).toFixed(2)}</span>
                                            <span className="text-xs font-black opacity-70 uppercase tracking-widest">Abs Liters</span>
                                        </div>
                                        <div className="mt-1 text-[10px] font-black uppercase tracking-widest opacity-50">
                                            Total BL: {(calcPreview?.totals?.totalClosingBl || 0).toFixed(2)}
                                        </div>
                                    </div>

                                    {/* Production Fees */}
                                    <div className="p-8 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800/30 rounded-[2.5rem]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Issued Fees (Statutory)</div>
                                            <span className="text-emerald-500"><Calculator size={16} /></span>
                                        </div>
                                        <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                                            ₹ {(calcPreview?.totals?.productionFees || 0).toLocaleString()}
                                        </div>
                                        <div className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mt-1">
                                            Rate: ₹3.00 per bottle
                                        </div>
                                    </div>

                                    {/* Balance Status */}
                                    <div className={`p-6 rounded-3xl flex items-center gap-4 border transition-all ${calcPreview?.isValid ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30 text-green-700' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-700'}`}>
                                        <div className={`p-2 rounded-xl ${calcPreview?.isValid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {calcPreview?.isValid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest mb-1">Stock Integrity Check</div>
                                            <div className="text-sm font-black uppercase italic">
                                                {calcPreview?.isValid ? 'Register Balanced ✓' : `Unbalanced: ${(calcPreview?.balanceCheck?.difference || 0).toFixed(2)} BL`}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    form="regb-form"
                                    type="submit"
                                    disabled={!calcPreview?.isValid || calculating}
                                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-3"
                                >
                                    {calculating ? <RefreshCw className="animate-spin" size={18} /> : isEdit ? <><Save size={18} /> Update Daily Entry</> : <><Save size={18} /> Save & Finalize</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegBRegister;
