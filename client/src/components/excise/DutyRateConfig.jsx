import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Plus, Edit, Trash2, CheckCircle2, XCircle,
    ShieldCheck, Settings, AlertCircle, Calendar
} from 'lucide-react';
import { API_URL } from '../../config';

const DutyRateConfig = ({ isDark }) => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        category: 'CL',
        subcategory: '50° U.P.',
        ratePerAl: '',
        effectiveFrom: new Date().toISOString().slice(0, 10),
        remarks: ''
    });

    const strengths = ['50° U.P.', '60° U.P.', '70° U.P.', '80° U.P.'];

    useEffect(() => {
        fetchRates();
    }, []);

    const fetchRates = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/excise-duty/rates`);
            if (res.data.success) {
                setRates(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching rates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/excise-duty/rates`, {
                ...formData,
                ratePerAl: parseFloat(formData.ratePerAl)
            });
            if (res.data.success) {
                setShowAddForm(false);
                fetchRates();
                alert("Duty rate updated successfully");
            }
        } catch (err) {
            alert(err.response?.data?.error || "Error updating rate");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this duty rate? This may affect future calculations.")) return;
        try {
            await axios.delete(`${API_URL}/api/excise-duty/rates/${id}`);
            fetchRates();
        } catch (err) {
            alert("Error deleting rate");
        }
    };

    return (
        <div className={`p-8 rounded-[2.5rem] shadow-xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Settings size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black flex items-center gap-3">
                            Duty Rate Configuration
                            <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full uppercase tracking-widest">Admin</span>
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage strength-based ₹/BL rates</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2 ${isDark ? 'bg-gray-800 text-indigo-400 hover:bg-indigo-600 hover:text-white' : 'bg-white border border-gray-200 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
                >
                    {showAddForm ? <XCircle size={16} /> : <Plus size={16} />}
                    {showAddForm ? 'Cancel' : 'Update Rate'}
                </button>
            </div>

            {showAddForm && (
                <div className={`mb-8 p-8 rounded-3xl animate-in slide-in-from-top-4 duration-300 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Strength</label>
                            <select
                                value={formData.subcategory}
                                onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                                className={`w-full p-4 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-white'}`}
                            >
                                {strengths.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Rate (₹ per BL)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.ratePerAl}
                                onChange={e => setFormData({ ...formData, ratePerAl: e.target.value })}
                                className={`w-full p-4 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-white'}`}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Effective From</label>
                            <input
                                type="date"
                                value={formData.effectiveFrom}
                                onChange={e => setFormData({ ...formData, effectiveFrom: e.target.value })}
                                className={`w-full p-4 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-white'}`}
                                required
                            />
                        </div>
                        <button type="submit" className="bg-indigo-600 text-white p-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition shadow-lg">
                            Save Rate
                        </button>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 dark:border-gray-800">
                            <th className="px-6 py-4">Strength</th>
                            <th className="px-6 py-4">Rate / BL</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Effective From</th>
                            <th className="px-6 py-4">Remarks</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                        {rates.map(rate => (
                            <tr key={rate.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4 font-black text-indigo-400">{rate.subcategory}</td>
                                <td className="px-6 py-4 font-black">₹{rate.ratePerAl}</td>
                                <td className="px-6 py-4">
                                    {rate.isActive ? (
                                        <span className="flex items-center gap-1 text-green-500 text-[10px] font-black uppercase">
                                            <CheckCircle2 size={12} /> Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-gray-400 text-[10px] font-black uppercase">
                                            <AlertCircle size={12} /> Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-500">
                                    {new Date(rate.effectiveFrom).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-[10px] text-gray-400 font-bold uppercase w-48 truncate">
                                    {rate.remarks || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handleDelete(rate.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={`mt-8 p-4 rounded-2xl flex items-start gap-4 ${isDark ? 'bg-indigo-900/10' : 'bg-indigo-50'}`}>
                <ShieldCheck className="text-indigo-500 mt-1" size={20} />
                <div>
                    <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">Calculated Logic</p>
                    <p className="text-[10px] text-indigo-400 font-bold mt-1 tracking-tight leading-relaxed">
                        The system uses the most recent active rate whose 'Effective From' date is less than or equal to the entry's month.
                        Updating a rate will NOT automatically change existing record balances unless they are manually recalculated.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DutyRateConfig;
