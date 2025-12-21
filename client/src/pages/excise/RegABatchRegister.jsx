import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
    Package, Edit, Trash2, Plus, Search, Filter, ChevronRight,
    AlertCircle, CheckCircle2, Clock, FlaskConical, RefreshCw, Eye, BookOpen, Save, Calculator, Link as LinkIcon, FileText, Download, CheckCircle, ArrowLeft
} from 'lucide-react';
import { API_URL } from '../../config';

const RegABatchRegister = () => {
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('DASHBOARD'); // DASHBOARD or STATUTORY
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentEntry, setCurrentEntry] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [entryRes, batchRes] = await Promise.all([
                axios.get(`${API_URL}/api/rega/entries`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/reg74/batches`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setEntries(entryRes.data);
            setBatches(batchRes.data);
        } catch (error) {
            console.error("Fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePlanBatch = async (batchId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/rega/plan`, { batchId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowPlanModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Planning failed");
        }
    };

    const handleUpdateDeclaration = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // Basic mapping for bottling conversion
            const b750 = parseInt(currentEntry.bottling750 || 0);
            const b600 = parseInt(currentEntry.bottling600 || 0);
            const b500 = parseInt(currentEntry.bottling500 || 0);
            const b375 = parseInt(currentEntry.bottling375 || 0);
            const b300 = parseInt(currentEntry.bottling300 || 0);
            const b180 = parseInt(currentEntry.bottling180 || 0);

            const bl = (b750 * 0.75) + (b600 * 0.60) + (b500 * 0.50) + (b375 * 0.375) + (b300 * 0.30) + (b180 * 0.180);
            const al = bl * (parseFloat(currentEntry.avgStrength || 0) / 100);

            await axios.put(`${API_URL}/api/rega/declaration/${currentEntry.id}`, {
                ...currentEntry,
                spiritBottledBl: bl,
                spiritBottledAl: al
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowEditModal(false);
            fetchData();
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handleLinkMFM = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.get(`${API_URL}/api/rega/link-mfm/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "MFM Link failed");
        }
    };

    const handleFinalize = async (id) => {
        if (!window.confirm("Are you sure you want to finalize this production record? Once completed, it cannot be edited or deleted.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/rega/finalize/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Finalization failed");
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PLANNED': return 'bg-gray-100 text-gray-500 border-gray-200';
            case 'ACTIVE': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-50 text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFEFE] dark:bg-gray-950 p-6 md:p-10 transition-colors duration-300">
            {/* Design Concept Header */}
            <div className="max-w-[1600px] mx-auto mb-12 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-100 dark:border-gray-800 pb-8">
                <div className="flex flex-col gap-6">
                    <button
                        onClick={() => navigate('/registers')}
                        className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-black uppercase text-[10px] tracking-widest transition-all w-fit"
                    >
                        <ArrowLeft size={16} /> Back to Registers
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><BookOpen size={24} /></div>
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em]">Reg-A Statutory Engine</span>
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-4">Blending & Bottling</h1>
                        <p className="text-gray-400 font-bold max-w-xl text-sm italic">
                            User declares what was produced; system verifies what was issued.
                            <span className="block mt-1 font-black text-gray-900 dark:text-gray-300 not-italic uppercase text-[10px] tracking-widest">Reconciled against Reg-74 MFM-II</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl">
                        <button onClick={() => setViewMode('DASHBOARD')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${viewMode === 'DASHBOARD' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}>Dashboard</button>
                        <button onClick={() => setViewMode('STATUTORY')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${viewMode === 'STATUTORY' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}>Statutory Register</button>
                    </div>
                    <button onClick={() => setShowPlanModal(true)} className="px-8 py-4 bg-gray-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black dark:hover:bg-indigo-700 transition-all flex items-center gap-3 whitespace-nowrap">
                        <Plus size={20} /> New Production Batch
                    </button>
                </div>
            </div>

            {viewMode === 'DASHBOARD' ? (
                /* Production Planning Dashboard */
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Planned / Idle', val: entries.filter(e => e.status === 'PLANNED').length, icon: Clock, color: 'text-gray-400' },
                            { label: 'In Production', val: entries.filter(e => e.status === 'ACTIVE').length, icon: FlaskConical, color: 'text-blue-600' },
                            { label: 'Completed', val: entries.filter(e => e.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-green-600' },
                            { label: 'Total Output (AL)', val: entries.reduce((s, e) => s + (e.spiritBottledAl || 0), 0).toFixed(0), icon: Package, color: 'text-indigo-600' }
                        ].map((s, i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                                <div className={`p-4 rounded-3xl w-fit mb-6 bg-gray-50 dark:bg-gray-800 ${s.color}`}><s.icon size={32} /></div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
                                <div className="text-4xl font-black text-gray-900 dark:text-white">{s.val}</div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-12">
                        <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <div className="p-10 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Current Production Cycle</h3>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" placeholder="Search batch..." className="pl-12 pr-6 py-3 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl font-bold w-64 text-gray-900 dark:text-white" value={search} onChange={e => setSearch(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <th className="px-10 py-5">Batch Identity</th>
                                            <th className="px-10 py-5">Brand</th>
                                            <th className="px-10 py-5">Declaration Progress</th>
                                            <th className="px-10 py-5">System Verification</th>
                                            <th className="px-10 py-5">Status</th>
                                            <th className="px-10 py-5 text-right">Workflow</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-gray-900 dark:text-white">
                                        {entries.filter(e => e.batch?.baseBatchNo.toLowerCase().includes(search.toLowerCase())).map(e => (
                                            <tr key={e.id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all">
                                                <td className="px-10 py-8">
                                                    <div className="font-black text-xl text-gray-900 dark:text-white">{e.batch?.baseBatchNo}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Start: {format(new Date(e.batch.startDate), 'dd MMM yyyy')}</div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="font-bold text-gray-700 dark:text-gray-300">{e.batch.brand.name}</div>
                                                    <div className="text-xs text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full w-fit mt-2">{e.batch.brand.category}</div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${e.spiritBottledAl > 0 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                            <Calculator size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black uppercase text-gray-400">Bottled Total</div>
                                                            <div className="font-black text-gray-900 dark:text-white">{e.spiritBottledAl?.toFixed(2) || '0.00'} <span className="text-[10px]">AL</span></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${e.mfmTotalAl > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                                            <LinkIcon size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black uppercase text-gray-400">MFM-II Reconciliation</div>
                                                            <div className="font-black text-gray-900 dark:text-white">{e.mfmTotalAl?.toFixed(2) || '--'} <span className="text-[10px]">AL</span></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(e.status)}`}>{e.status}</span>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {e.status !== 'COMPLETED' ? (
                                                            <>
                                                                <button onClick={() => { setCurrentEntry(e); setShowEditModal(true); }} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-600 rounded-xl hover:shadow-lg transition-all" title="Declare Production"><Calculator size={18} /></button>
                                                                <button onClick={() => handleLinkMFM(e.id)} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-indigo-600 rounded-xl hover:shadow-lg transition-all" title="Link MFM Data"><LinkIcon size={18} /></button>
                                                                <button onClick={() => handleFinalize(e.id)} className={`p-3 rounded-xl transition-all ${e.mfmTotalAl > 0 ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-300 pointer-events-none'}`} title="Finalize Batch"><CheckCircle size={18} /></button>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-right mr-4">
                                                                    <div className="text-[8px] font-black text-green-600 uppercase">Verified By</div>
                                                                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300">{e.verifier?.name}</div>
                                                                </div>
                                                                <button className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-xl" title="Download Statutory PDF"><Download size={18} /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Full 35 Column Statutory Register (Read Only / Audit Mode) */
                <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-10 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/20 dark:bg-gray-800/20">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                            <FileText className="text-orange-500" /> Statutory Bottling Register (Form Reg-A)
                        </h3>
                        <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"><Download size={16} /> Export to Excel</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[9px] table-fixed min-w-[3200px] border-collapse text-gray-900 dark:text-white">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-gray-900 dark:bg-black text-white font-black uppercase text-center border-b border-gray-700">
                                    <th colSpan="5" className="p-3 border-r border-gray-700">Basic Info (1-5)</th>
                                    <th colSpan="4" className="p-3 border-r border-gray-700 bg-blue-900/50">Receipt Spirit (6-9)</th>
                                    <th colSpan="4" className="p-3 border-r border-gray-700 bg-purple-900/50">Blend Prepared (10-13)</th>
                                    <th colSpan="3" className="p-3 border-r border-gray-700">Batch Execution (14-16)</th>
                                    <th colSpan="6" className="p-3 border-r border-gray-700 bg-indigo-900/50">MFM-II Production (17-22)</th>
                                    <th colSpan="6" className="p-3 border-r border-gray-700 bg-green-900/50">Bottle Counter (23-28)</th>
                                    <th colSpan="3" className="p-3 border-r border-gray-700">Bottled Spirit (29-31)</th>
                                    <th colSpan="4" className="p-3 bg-red-900/50">Variance & Wastage (32-35)</th>
                                </tr>
                                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase text-center">
                                    <th className="p-2 border-r border-gray-200 dark:border-gray-700 w-32">Base Batch #</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-28">Start Date</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-40">Brand</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">VAT #</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">Status</th>
                                    <th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">From VAT</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-16">STR</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">BL</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">AL</th>
                                    <th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">To VAT</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-16">STR</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">BL</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">AL</th>
                                    <th className="p-2 border-r border-gray-200 dark:border-gray-700 w-40">Batch ID</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-32">Date</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-32">Prod Date</th>
                                    <th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">MFM BL</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">MFM AL</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-20">Density</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-16">Temp</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-16">STR</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">Tot Trfr AL</th>
                                    <th className="p-2 border-r border-gray-200 dark:border-gray-700 w-16">750</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-16">600</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-16">500</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-16">375</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-16">300</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-16">180</th>
                                    <th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">Bottle BL</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-20">Avg STR</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24">Bottle AL</th>
                                    <th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24 text-blue-600">Diff AL</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24 text-green-600">Inc AL</th><th className="p-2 border-r border-gray-200 dark:border-gray-700 w-24 text-red-600">Wast AL</th><th className="p-2 w-24">Chargeable</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-bold text-gray-700 dark:text-gray-300">
                                {entries.map(e => (
                                    <tr key={e.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all text-center">
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800">{e.batch.baseBatchNo}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800">{format(new Date(e.batch.startDate), 'dd-MM-yy')}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 text-left font-black">{e.batch.brand.name}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800">{e.batch.vat.vatCode}</td>
                                        <td className={`p-3 border-r border-gray-50 dark:border-gray-800 text-[8px] font-black ${e.status === 'COMPLETED' ? 'text-green-600' : 'text-orange-500'}`}>{e.status}</td>

                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-blue-50/20 dark:bg-blue-900/5">{e.receiptFromVat || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-blue-50/20 dark:bg-blue-900/5">{e.receiptStrength?.toFixed(1) || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-blue-50/20 dark:bg-blue-900/5">{e.receiptBl?.toLocaleString() || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-blue-50/20 dark:bg-blue-900/5 font-black text-blue-600">{e.receiptAl?.toFixed(2) || '-'}</td>

                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-purple-50/20 dark:bg-purple-900/5">{e.blendingToVat || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-purple-50/20 dark:bg-purple-900/5">{e.blendingStrength?.toFixed(1) || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-purple-50/20 dark:bg-purple-900/5">{e.blendingBl?.toLocaleString() || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-purple-50/20 dark:bg-purple-900/5 font-black text-purple-600">{e.blendingAl?.toFixed(2) || '-'}</td>

                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 font-black">{e.batchNoDate || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800">{format(new Date(e.createdAt), 'dd-MM-yy')}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800">{e.productionDate ? format(new Date(e.productionDate), 'dd-MM-yy') : '-'}</td>

                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 font-black bg-indigo-50/20 dark:bg-indigo-900/5">{e.mfmTotalBl?.toLocaleString() || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 font-black bg-indigo-50/20 dark:bg-indigo-900/5 text-indigo-700 dark:text-indigo-400">{e.mfmTotalAl?.toFixed(2) || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-indigo-50/20 dark:bg-indigo-900/5">{e.mfmDensity || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-indigo-50/20 dark:bg-indigo-900/5">{e.mfmTemp || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-indigo-50/20 dark:bg-indigo-900/5">{e.mfmStrength || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-indigo-50/20 dark:bg-indigo-900/5 font-black text-indigo-900 dark:text-indigo-300">{e.mfmTotalAl?.toFixed(2) || '-'}</td>

                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-green-50/20 dark:bg-green-900/5">{e.bottling750 || 0}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-green-50/20 dark:bg-green-900/5">{e.bottling600 || 0}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-green-50/20 dark:bg-green-900/5">{e.bottling500 || 0}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-green-50/20 dark:bg-green-900/5">{e.bottling375 || 0}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-green-50/20 dark:bg-green-900/5">{e.bottling300 || 0}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 bg-green-50/20 dark:bg-green-900/5">{e.bottling180 || 0}</td>

                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 font-black">{e.spiritBottledBl?.toFixed(2) || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800">{e.avgStrength?.toFixed(1) || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 font-black text-green-700 dark:text-green-400">{e.spiritBottledAl?.toFixed(2) || '-'}</td>

                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 font-black text-blue-600 dark:text-blue-400">{e.differenceFoundAl?.toFixed(2) || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 font-black text-green-600 dark:text-green-400">{e.productionIncrease?.toFixed(2) || '-'}</td>
                                        <td className="p-3 border-r border-gray-50 dark:border-gray-800 font-black text-red-600 dark:text-red-400">{e.productionWastage?.toFixed(2) || '-'}</td>
                                        <td className="p-3 font-black text-red-900 dark:text-red-300">{e.chargeableWastage?.toFixed(2) || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Plan Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white dark:border-gray-800">
                        <div className="p-10">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Create Production Batch</h2>
                            <p className="text-gray-400 font-medium mb-8 uppercase text-[10px] tracking-widest">Select an existing Reg-74 mother batch to initialize Reg-A</p>
                            <div className="space-y-3">
                                {batches.filter(b => !entries.find(e => e.batchId === b.id)).map(b => (
                                    <button key={b.id} onClick={() => handlePlanBatch(b.id)} className="w-full p-6 text-left border border-gray-100 dark:border-gray-800 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group transition-all">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-black text-lg text-gray-900 dark:text-white group-hover:text-indigo-600">{b.baseBatchNo}</div>
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{b.brand.name}</div>
                                            </div>
                                            <ChevronRight className="text-gray-300 group-hover:text-indigo-600" />
                                        </div>
                                    </button>
                                ))}
                                {batches.filter(b => !entries.find(e => e.batchId === b.id)).length === 0 && (
                                    <p className="text-center py-10 text-gray-400 font-bold">No active batches available to plan. Create one in Reg-74 first.</p>
                                )}
                            </div>
                            <button onClick={() => setShowPlanModal(false)} className="w-full py-5 mt-6 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit / Declaration Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-white dark:border-gray-800">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Production Declaration</h2>
                                    <p className="text-gray-400 font-medium uppercase text-[10px] tracking-widest">Manual Data Entry for Batch {currentEntry?.batch.baseBatchNo}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Target Strength</div>
                                    <div className="text-2xl font-black text-indigo-600">{currentEntry?.batch.brand.category === 'IMFL' ? '42.8' : '--'}%</div>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateDeclaration} className="space-y-10">
                                {/* Section 1: Receipts & Blends */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 dark:bg-gray-800/50 p-8 rounded-[2.5rem]">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b border-blue-100 dark:border-blue-900/50 pb-2">1. Receipt Declaration (Cols 6-9)</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">From VAT</label>
                                                <input type="text" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" value={currentEntry.receiptFromVat || ''} onChange={e => setCurrentEntry({ ...currentEntry, receiptFromVat: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Strength</label>
                                                <input type="number" step="0.1" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white" value={currentEntry.receiptStrength || ''} onChange={e => setCurrentEntry({ ...currentEntry, receiptStrength: parseFloat(e.target.value) })} />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Volume BL</label>
                                                <input type="number" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white" value={currentEntry.receiptBl || ''} onChange={e => setCurrentEntry({ ...currentEntry, receiptBl: parseFloat(e.target.value) })} />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Volume AL</label>
                                                <input type="number" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl font-bold text-blue-600 dark:text-blue-400" value={currentEntry.receiptAl || ''} onChange={e => setCurrentEntry({ ...currentEntry, receiptAl: parseFloat(e.target.value) })} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 border-b border-purple-100 dark:border-purple-900/50 pb-2">2. Final Blend Declaration (Cols 10-13)</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">To VAT</label>
                                                <input type="text" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white" value={currentEntry.blendingToVat || ''} onChange={e => setCurrentEntry({ ...currentEntry, blendingToVat: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Strength</label>
                                                <input type="number" step="0.1" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white" value={currentEntry.blendingStrength || ''} onChange={e => setCurrentEntry({ ...currentEntry, blendingStrength: parseFloat(e.target.value) })} />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Final Vol BL</label>
                                                <input type="number" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white" value={currentEntry.blendingBl || ''} onChange={e => setCurrentEntry({ ...currentEntry, blendingBl: parseFloat(e.target.value) })} />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Final Vol AL</label>
                                                <input type="number" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl font-bold text-purple-600 dark:text-purple-400" value={currentEntry.blendingAl || ''} onChange={e => setCurrentEntry({ ...currentEntry, blendingAl: parseFloat(e.target.value) })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Bottle Counts */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-green-600 dark:text-green-400 border-b border-green-100 dark:border-green-900/50 pb-2">3. Bottling Mix (Cols 23-28)</h4>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                                        {[
                                            { id: 'bottling750', label: '750 ML' }, { id: 'bottling600', label: '600 ML' }, { id: 'bottling500', label: '500 ML' },
                                            { id: 'bottling375', label: '375 ML' }, { id: 'bottling300', label: '300 ML' }, { id: 'bottling180', label: '180 ML' },
                                        ].map(f => (
                                            <div key={f.id}>
                                                <label className="text-[8px] font-black text-gray-400 uppercase block mb-1 text-center">{f.label}</label>
                                                <input type="number" className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl font-black text-center text-lg text-gray-900 dark:text-white" value={currentEntry[f.id] || 0} onChange={e => setCurrentEntry({ ...currentEntry, [f.id]: parseInt(e.target.value) })} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl">
                                        <div className="p-3 bg-white dark:bg-gray-700 rounded-2xl text-indigo-600 dark:text-indigo-400"><Calculator size={24} /></div>
                                        <div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Strength %</div>
                                            <input type="number" step="0.1" className="bg-transparent border-0 p-0 font-black text-2xl text-gray-900 dark:text-white focus:ring-0 w-24" value={currentEntry.avgStrength || ''} onChange={e => setCurrentEntry({ ...currentEntry, avgStrength: parseFloat(e.target.value) })} placeholder="42.8" />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-5 bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-100 dark:hover:bg-gray-600 transition-all">Cancel</button>
                                        <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3 transition-all"><Save size={20} /> Save Declaration</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegABatchRegister;
