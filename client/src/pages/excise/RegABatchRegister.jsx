import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
    Package,
    Edit,
    Trash2,
    Plus,
    Search,
    Filter,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    FlaskConical,
    RefreshCw
} from 'lucide-react';
import { API_URL } from '../../config';

const RegABatchRegister = () => {
    const [batches, setBatches] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [editingBatch, setEditingBatch] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [batchRes, brandRes] = await Promise.all([
                axios.get(`${API_URL}/api/reg74/batches`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/reg74/brands`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setBatches(batchRes.data);
            setBrands(brandRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBatch = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/reg74/batches/${editingBatch.id}`, editingBatch, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowEditModal(false);
            fetchData();
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredBatches = batches.filter(b => {
        const matchesSearch = b.baseBatchNo.toLowerCase().includes(search.toLowerCase()) ||
            b.brand?.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
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
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4 justify-center md:justify-start">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-indigo-200 shadow-lg">
                            <FlaskConical className="text-white" size={32} />
                        </div>
                        Reg-A Batch Register
                    </h1>
                    <p className="mt-2 text-gray-500 font-medium text-lg">Manage production batches and blending operations</p>
                </div>

                <div className="flex gap-4">
                    <button className="px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-3xl font-bold hover:bg-gray-50 hover:shadow-xl transition-all flex items-center gap-3">
                        <Filter size={20} /> Advanced Filters
                    </button>
                    <button className="px-8 py-4 bg-indigo-600 text-white rounded-3xl font-bold hover:bg-indigo-700 hover:shadow-indigo-400 shadow-xl transition-all flex items-center gap-3">
                        <Plus size={24} /> New Production Batch
                    </button>
                </div>
            </div>

            {/* Stats */}
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

            {/* Table Area */}
            <div className="max-w-7xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
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
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                        {['ALL', 'OPEN', 'IN_PRODUCTION', 'CLOSED'].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-gray-50">
                                <th className="px-8 py-5">Batch / Mother ID</th>
                                <th className="px-8 py-5">Brand & Recipe</th>
                                <th className="px-8 py-5">Start Date</th>
                                <th className="px-8 py-5 text-right">Target (BL)</th>
                                <th className="px-8 py-5 text-right">Target (AL)</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center">
                                        <RefreshCw className="animate-spin mx-auto text-indigo-400 mb-4" size={40} />
                                        <p className="text-gray-400 font-bold">Synchronizing Batch Registry...</p>
                                    </td>
                                </tr>
                            ) : filteredBatches.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center">
                                        <AlertCircle className="mx-auto text-gray-200 mb-4" size={60} />
                                        <p className="text-gray-400 font-bold text-xl">No batches found matching criteria</p>
                                    </td>
                                </tr>
                            ) : filteredBatches.map(batch => (
                                <tr key={batch.id} className="hover:bg-indigo-50/30 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-all">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-900 text-lg">{batch.baseBatchNo}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ID: #B-{batch.id.toString().padStart(4, '0')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-gray-800">{batch.brand?.name}</div>
                                        <div className="text-xs text-indigo-400 font-bold bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">{batch.brand?.category}</div>
                                    </td>
                                    <td className="px-8 py-6 font-medium text-gray-500 italic">
                                        {format(new Date(batch.startDate), 'do MMM, yyyy')}
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-gray-800">
                                        {(batch.totalVolumeBl || 0).toLocaleString()} <span className="text-[10px] text-gray-400">BL</span>
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-indigo-600">
                                        {(batch.totalVolumeAl || 0).toLocaleString()} <span className="text-[10px] text-indigo-400">AL</span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(batch.status)}`}>
                                            {batch.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => {
                                                    setEditingBatch(batch);
                                                    setShowEditModal(true);
                                                }}
                                                className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:shadow-lg rounded-2xl transition-all"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 rounded-2xl flex items-center gap-2 hover:shadow-lg transition-all pr-4">
                                                <ChevronRight size={18} /> <span className="text-xs font-bold uppercase">View Logs</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white">
                        <div className="p-10">
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Edit Production Batch</h2>
                            <p className="text-gray-400 font-medium mb-8">Update mother batch details and status</p>

                            <form onSubmit={handleUpdateBatch} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Base Batch No</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                                        value={editingBatch.baseBatchNo}
                                        onChange={e => setEditingBatch({ ...editingBatch, baseBatchNo: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Brand</label>
                                    <select
                                        className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 appearance-none"
                                        value={editingBatch.brandId}
                                        onChange={e => setEditingBatch({ ...editingBatch, brandId: parseInt(e.target.value) })}
                                        required
                                    >
                                        {brands.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Production Status</label>
                                    <select
                                        className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 appearance-none"
                                        value={editingBatch.status}
                                        onChange={e => setEditingBatch({ ...editingBatch, status: e.target.value })}
                                        required
                                    >
                                        <option value="OPEN">OPEN</option>
                                        <option value="IN_PRODUCTION">IN PRODUCTION</option>
                                        <option value="CLOSED">CLOSED</option>
                                    </select>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all"
                                    >
                                        Save Changes
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
