import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
    Package, Edit, Trash2, Plus, Search, Filter, ChevronRight,
    AlertCircle, CheckCircle2, Clock, FlaskConical, RefreshCw, Eye, BookOpen, Save, Calculator
} from 'lucide-react';
import { API_URL } from '../../config';

const RegABatchRegister = () => {
    const [batches, setBatches] = useState([]);
    const [brands, setBrands] = useState([]);
    const [regAEntries, setRegAEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [editingBatch, setEditingBatch] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRegAModal, setShowRegAModal] = useState(false);
    const [currentEntry, setCurrentEntry] = useState(null);
    const [viewMode, setViewMode] = useState('LIST'); // LIST or STATUTORY

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [batchRes, brandRes, regARes] = await Promise.all([
                axios.get(`${API_URL}/api/reg74/batches`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/reg74/brands`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/rega/entries`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setBatches(batchRes.data);
            setBrands(brandRes.data);
            setRegAEntries(regARes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSync = async (batchId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.get(`${API_URL}/api/rega/sync/${batchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error("Sync failed", error);
        }
    };

    const handleUpdateRegA = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // Calculate BL and AL from bottling counts before saving
            const b750 = parseInt(currentEntry.bottling750 || 0);
            const b600 = parseInt(currentEntry.bottling600 || 0);
            const b500 = parseInt(currentEntry.bottling500 || 0);
            const b375 = parseInt(currentEntry.bottling375 || 0);
            const b300 = parseInt(currentEntry.bottling300 || 0);
            const b180 = parseInt(currentEntry.bottling180 || 0);

            const bl = (b750 * 0.75) + (b600 * 0.60) + (b500 * 0.50) + (b375 * 0.375) + (b300 * 0.30) + (b180 * 0.180);
            const al = bl * (parseFloat(currentEntry.avgStrength || 0) / 100);

            const mfmAl = parseFloat(currentEntry.mfmTotalAl || 0);
            const wastage = mfmAl - al;
            const allowWastage = mfmAl * 0.01; // Example 1% bottling loss allowed

            await axios.post(`${API_URL}/api/rega/entry`, {
                ...currentEntry,
                spiritBottledBl: bl,
                spiritBottledAl: al,
                productionWastage: wastage > 0 ? wastage : 0,
                productionIncrease: wastage < 0 ? Math.abs(wastage) : 0,
                allowableWastage: allowWastage,
                chargeableWastage: (wastage > allowWastage) ? (wastage - allowWastage) : 0
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowRegAModal(false);
            fetchData();
        } catch (error) {
            console.error("Save failed", error);
        }
    };

    const filteredEntries = regAEntries.filter(e => {
        const matchesSearch = e.batch?.baseBatchNo.toLowerCase().includes(search.toLowerCase()) ||
            e.batch?.brand?.name.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'IN_PRODUCTION': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'CLOSED': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-indigo-200 shadow-lg">
                            <BookOpen className="text-white" size={32} />
                        </div>
                        Reg-A Statutory Register
                    </h1>
                    <p className="mt-2 text-gray-500 font-medium text-lg uppercase tracking-tight text-[10px]">Blending & Bottling Control Register (Reg-A)</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setViewMode(viewMode === 'LIST' ? 'STATUTORY' : 'LIST')}
                        className={`px-6 py-4 rounded-3xl font-bold flex items-center gap-3 transition-all ${viewMode === 'STATUTORY' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
                    >
                        {viewMode === 'LIST' ? <BookOpen size={20} /> : <Package size={20} />}
                        {viewMode === 'LIST' ? 'Statutory View' : 'Batch Dashboard'}
                    </button>
                    <button className="px-8 py-4 bg-gray-900 text-white rounded-3xl font-bold hover:bg-black shadow-xl transition-all flex items-center gap-3">
                        <Plus size={24} /> New Batch
                    </button>
                </div>
            </div>

            {viewMode === 'LIST' ? (
                /* Dashboard View */
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Active Batches', val: batches.filter(b => b.status !== 'CLOSED').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'Completed (MTD)', val: batches.filter(b => b.status === 'CLOSED').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Total Volume (AL)', val: batches.reduce((acc, b) => acc + (b.totalVolumeAl || 0), 0).toFixed(0), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Exceptions', val: 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                    ].map((stat, i) => (
                        <div key={i} className={`${stat.bg} p-6 rounded-[2.5rem] border border-white shadow-sm flex items-center gap-5`}>
                            <div className={`p-4 rounded-3xl bg-white shadow-sm ${stat.color}`}>
                                <stat.icon size={28} />
                            </div>
                            <div>
                                <div className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
                                <div className="text-3xl font-black text-gray-900">{stat.val}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* Main Content Area */}
            <div className={`mx-auto bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden ${viewMode === 'STATUTORY' ? 'max-w-none' : 'max-w-7xl'}`}>
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/30">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search Batch No or Brand..."
                            className="w-full pl-12 pr-4 py-4 bg-white border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left table-fixed min-w-[3000px]">
                        <thead>
                            <tr className="bg-gray-900 text-white font-black text-[9px] uppercase tracking-widest text-center">
                                {/* Groups */}
                                <th colSpan="4" className="p-3 border-r border-gray-700">Basic Information (1-4)</th>
                                <th colSpan="4" className="p-3 border-r border-gray-700 bg-blue-900">Receipt Volume (5-8)</th>
                                <th colSpan="4" className="p-3 border-r border-gray-700 bg-purple-900">Total Blend (9-12)</th>
                                <th colSpan="4" className="p-3 border-r border-gray-700">Batch Info (13-16)</th>
                                <th colSpan="5" className="p-3 border-r border-gray-700 bg-indigo-900">MFM Transfer (17-21)</th>
                                <th colSpan="6" className="p-3 border-r border-gray-700 bg-green-900">Bottling (22-27)</th>
                                <th colSpan="3" className="p-3 border-r border-gray-700">Finished Goods (28-30)</th>
                                <th colSpan="4" className="p-3 border-r border-gray-700 bg-red-900">Wastages (31-34)</th>
                                <th className="p-3">Actions</th>
                            </tr>
                            <tr className="bg-gray-100 text-gray-500 font-bold text-[8px] uppercase text-center border-b border-gray-200">
                                {/* 1-4 */}
                                <th className="p-2 border-r border-gray-200 w-32">Base Batch</th><th className="p-2 border-r border-gray-200 w-32">Start Date</th><th className="p-2 border-r border-gray-200 w-40">Brand</th><th className="p-2 border-r border-gray-200 w-24">VAT</th>
                                {/* 5-8 */}
                                <th className="p-2 border-r border-gray-200 w-24">From VAT</th><th className="p-2 border-r border-gray-200 w-20">STR</th><th className="p-2 border-r border-gray-200 w-24">BL</th><th className="p-2 border-r border-gray-200 w-24 border-gray-300">AL</th>
                                {/* 9-12 */}
                                <th className="p-2 border-r border-gray-200 w-24">To VAT</th><th className="p-2 border-r border-gray-200 w-20">STR</th><th className="p-2 border-r border-gray-200 w-24">BL</th><th className="p-2 border-r border-gray-200 w-24 border-gray-300">AL</th>
                                {/* 13-16 */}
                                <th className="p-2 border-r border-gray-200 w-40">Batch No/Date</th><th className="p-2 border-r border-gray-200 w-32">Prod Date</th><th className="p-2 border-r border-gray-200 w-24">Tot BL</th><th className="p-2 border-r border-gray-200 w-24">Tot AL</th>
                                {/* 17-21 */}
                                <th className="p-2 border-r border-gray-200 w-24">Density</th><th className="p-2 border-r border-gray-200 w-20">Temp</th><th className="p-2 border-r border-gray-200 w-20">STR</th><th className="p-2 border-r border-gray-200 w-24">MFM BL</th><th className="p-2 border-r border-gray-200 w-24">MFM AL</th>
                                {/* 22-27 */}
                                <th className="p-2 border-r border-gray-200 w-20">750</th><th className="p-2 border-r border-gray-200 w-20">600</th><th className="p-2 border-r border-gray-200 w-20">500</th><th className="p-2 border-r border-gray-200 w-20">375</th><th className="p-2 border-r border-gray-200 w-20">300</th><th className="p-2 border-r border-gray-200 w-20">180</th>
                                {/* 28-30 */}
                                <th className="p-2 border-r border-gray-200 w-24">Bottled BL</th><th className="p-2 border-r border-gray-200 w-20">Avg STR</th><th className="p-2 border-r border-gray-200 w-24">Bottled AL</th>
                                {/* 31-34 */}
                                <th className="p-2 border-r border-gray-200 w-24">Inc AL</th><th className="p-2 border-r border-gray-200 w-24">Wast AL</th><th className="p-2 border-r border-gray-200 w-24">Allow (1%)</th><th className="p-2 border-r border-gray-200 w-24">Chargeable</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-bold text-[9px] text-gray-700">
                            {filteredEntries.map(entry => (
                                <tr key={entry.id} className="hover:bg-blue-50/50 transition-all">
                                    <td className="p-3 border-r border-gray-100 text-center font-black">{entry.batch.baseBatchNo}</td>
                                    <td className="p-3 border-r border-gray-100 text-center">{format(new Date(entry.batch.startDate), 'dd-MM-yy')}</td>
                                    <td className="p-3 border-r border-gray-100 font-black">{entry.batch.brand?.name}</td>
                                    <td className="p-3 border-r border-gray-100 text-center">{entry.batch.vat?.vatCode}</td>

                                    <td className="p-3 border-r border-gray-100 text-center bg-blue-50/30">{entry.receiptFromVat || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-blue-50/30">{entry.receiptStrength || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-blue-50/30 font-black">{entry.receiptBl?.toLocaleString() || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-blue-50/30 font-black text-blue-600 border-gray-200">{entry.receiptAl?.toFixed(2) || '-'}</td>

                                    <td className="p-3 border-r border-gray-100 text-center bg-purple-50/30">{entry.blendingToVat || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-purple-50/30">{entry.blendingStrength || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-purple-50/30 font-black">{entry.blendingBl?.toLocaleString() || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-purple-50/30 font-black text-purple-600 border-gray-200">{entry.blendingAl?.toFixed(2) || '-'}</td>

                                    <td className="p-3 border-r border-gray-100 text-center font-black">{entry.batchNoDate || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center">{entry.productionDate ? format(new Date(entry.productionDate), 'dd-MM-yy') : '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center font-black">{entry.totalBatchBl?.toLocaleString() || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center font-black">{entry.totalBatchAl?.toFixed(2) || '-'}</td>

                                    <td className="p-3 border-r border-gray-100 text-center bg-indigo-50/30">{entry.mfmDensity || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-indigo-50/30">{entry.mfmTemp || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-indigo-50/30">{entry.mfmStrength || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-indigo-50/30 font-black">{entry.mfmTotalBl?.toLocaleString() || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-indigo-50/30 font-black text-indigo-600 border-gray-200">{entry.mfmTotalAl?.toFixed(2) || '-'}</td>

                                    <td className="p-3 border-r border-gray-100 text-center bg-green-50/30">{entry.bottling750 || 0}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-green-50/30">{entry.bottling600 || 0}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-green-50/30">{entry.bottling500 || 0}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-green-50/30">{entry.bottling375 || 0}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-green-50/30">{entry.bottling300 || 0}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-green-50/30 border-gray-200">{entry.bottling180 || 0}</td>

                                    <td className="p-3 border-r border-gray-100 text-center font-black">{entry.spiritBottledBl?.toFixed(2) || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center">{entry.avgStrength || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center font-black text-green-700 border-gray-200">{entry.spiritBottledAl?.toFixed(2) || '-'}</td>

                                    <td className="p-3 border-r border-gray-100 text-center bg-red-50/30 text-green-600 font-black">{entry.productionIncrease?.toFixed(2) || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-red-50/30 text-red-600 font-black">{entry.productionWastage?.toFixed(2) || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-red-50/30 italic text-gray-400">{entry.allowableWastage?.toFixed(2) || '-'}</td>
                                    <td className="p-3 border-r border-gray-100 text-center bg-red-50/30 text-red-900 font-black border-gray-200">{entry.chargeableWastage?.toFixed(2) || '-'}</td>

                                    <td className="p-3 text-center">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => {
                                                    setCurrentEntry(entry);
                                                    setShowRegAModal(true);
                                                }}
                                                className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-indigo-600 transition-all"
                                                title="Update Bottling Counts"
                                            >
                                                <Calculator size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleSync(entry.batchId)}
                                                className="p-1.5 bg-white border border-gray-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                                                title="Sync from Reg-74"
                                            >
                                                <RefreshCw size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reg-A Bottling Modal */}
            {showRegAModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-white">
                        <div className="p-10">
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Update Production Counts</h2>
                            <p className="text-gray-400 font-medium mb-8 uppercase text-[10px] tracking-widest">Entering Statutory Bottling Data (Cols 22-27)</p>

                            <form onSubmit={handleUpdateRegA} className="space-y-8">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {[
                                        { id: 'bottling750', label: '750 ML Bottles' },
                                        { id: 'bottling600', label: '600 ML Bottles' },
                                        { id: 'bottling500', label: '500 ML Bottles' },
                                        { id: 'bottling375', label: '375 ML Bottles' },
                                        { id: 'bottling300', label: '300 ML Bottles' },
                                        { id: 'bottling180', label: '180 ML Bottles' },
                                    ].map(f => (
                                        <div key={f.id}>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">{f.label}</label>
                                            <input
                                                type="number"
                                                className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-green-500 font-bold text-gray-700 text-xl"
                                                value={currentEntry[f.id] || 0}
                                                onChange={e => setCurrentEntry({ ...currentEntry, [f.id]: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Avg Strength (%)</label>
                                        <input
                                            type="number" step="0.1"
                                            className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 text-xl"
                                            value={currentEntry.avgStrength || ''}
                                            onChange={e => setCurrentEntry({ ...currentEntry, avgStrength: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Remarks</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                                            value={currentEntry.remarks || ''}
                                            onChange={e => setCurrentEntry({ ...currentEntry, remarks: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-gray-50">
                                    <button
                                        type="button"
                                        onClick={() => setShowRegAModal(false)}
                                        className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-5 bg-green-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-green-700 shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Save size={20} /> Finalize statutory figures
                                    </button>
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
