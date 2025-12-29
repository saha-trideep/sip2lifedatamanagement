import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    X, Plus, CreditCard, Calendar, Landmark,
    AlertCircle, CheckCircle2, FileText, Info
} from 'lucide-react';
import { API_URL } from '../../config';

const ChallanFormModal = ({ isOpen, onClose, onSuccess, isDark, entries }) => {
    const [formData, setFormData] = useState({
        dutyEntryId: '',
        challanNumber: '',
        challanDate: new Date().toISOString().slice(0, 10),
        amountPaid: '',
        bankName: 'SBI',
        branchName: '',
        remarks: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null);

    useEffect(() => {
        if (formData.dutyEntryId) {
            const entry = entries.find(e => e.id === parseInt(formData.dutyEntryId));
            setSelectedEntry(entry);
            // Default amount to closing balance
            if (entry) {
                setFormData(prev => ({ ...prev, amountPaid: entry.closingBalance }));
            }
        }
    }, [formData.dutyEntryId, entries]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post(`${API_URL}/api/excise-duty/challans`, {
                ...formData,
                amountPaid: parseFloat(formData.amountPaid)
            });
            if (res.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.error || "Error recording challan. Check if challan number is duplicate.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} animate-in zoom-in-95 duration-300`}>
                {/* Modal Header */}
                <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-green-50/50 border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-green-600 text-white' : 'bg-green-600 text-white'} shadow-lg shadow-green-500/30`}>
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">Record Payment</h2>
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-green-500">Treasury Challan Submission</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-white text-gray-600 shadow-sm'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-3">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <div className="space-y-6 mb-8">
                        {/* Select Duty Entry */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Link to Month/Strength</label>
                            <select
                                value={formData.dutyEntryId}
                                onChange={(e) => setFormData({ ...formData, dutyEntryId: e.target.value })}
                                className={`w-full px-4 py-4 rounded-2xl font-black border-0 focus:ring-2 focus:ring-green-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'} appearance-none`}
                                required
                            >
                                <option value="">Select Ledger Entry...</option>
                                {entries.map(e => (
                                    <option key={e.id} value={e.id}>
                                        {new Date(e.monthYear).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - {e.subcategory} (Balance: {formatCurrency(e.closingBalance)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selected Entry Preview */}
                        {selectedEntry && (
                            <div className={`p-6 rounded-3xl animate-in fade-in duration-300 ${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-100 dark:border-0'}`}>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                                    <span>Current Liability</span>
                                    <span>Pending Balance</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-bold">{formatCurrency(selectedEntry.dutyAccrued)}</p>
                                    <p className="text-xl font-black text-red-500">{formatCurrency(selectedEntry.closingBalance)}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Challan Number */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Challan / GRN Number</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.challanNumber}
                                        onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
                                        className={`w-full pl-12 pr-4 py-4 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-green-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'}`}
                                        placeholder="TR-2024-..."
                                        required
                                    />
                                </div>
                            </div>

                            {/* Challan Date */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Payment Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="date"
                                        value={formData.challanDate}
                                        onChange={(e) => setFormData({ ...formData, challanDate: e.target.value })}
                                        className={`w-full pl-12 pr-4 py-4 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-green-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'}`}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Amount Paid */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Amount Paid (₹)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amountPaid}
                                        onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                                        className={`w-full px-4 py-4 rounded-2xl font-black text-2xl border-0 focus:ring-2 focus:ring-green-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-green-600'}`}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Bank Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Treasury / Bank</label>
                                <div className="relative">
                                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        className={`w-full pl-12 pr-4 py-4 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-green-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'}`}
                                        placeholder="SBI / IFMS"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-sm shadow-xl transition-all flex items-center justify-center gap-3 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-green-500/40 active:scale-[0.98]'}`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Plus size={20} /> Record Payment
                            </>
                        )}
                    </button>
                    <p className="text-center text-[9px] text-gray-500 font-bold mt-4 uppercase tracking-widest flex items-center justify-center gap-2">
                        <Info size={12} /> This will automatically update the ledger balance and status.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ChallanFormModal;
