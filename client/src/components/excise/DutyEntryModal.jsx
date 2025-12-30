import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    X, Plus, Calculator, Calendar, Database,
    AlertCircle, CheckCircle2, Info
} from 'lucide-react';
import { API_URL } from '../../config';

const DutyEntryModal = ({ isOpen, onClose, onSuccess, isDark, selectedMonth }) => {
    const [formData, setFormData] = useState({
        monthYear: selectedMonth ? `${selectedMonth}-01` : new Date().toISOString().slice(0, 10),
        category: 'CL',
        subcategory: '50° U.P.',
        totalBlIssued: 0,
        totalAlIssued: 0,
        remarks: '',
        autoFillFromRegB: false
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const strengths = ['50° U.P.', '60° U.P.', '70° U.P.', '80° U.P.'];

    useEffect(() => {
        if (formData.autoFillFromRegB) {
            handleAutoFill();
        }
    }, [formData.autoFillFromRegB, formData.subcategory, formData.monthYear]);

    useEffect(() => {
        if (isOpen && formData.totalBlIssued > 0) {
            handleCalculate();
        }
    }, [formData.totalBlIssued, formData.subcategory, isOpen]);

    const handleAutoFill = async () => {
        setLoading(true);
        try {
            // We use the calculate endpoint to preview what Reg-B has
            // Actually, we could use a dedicated endpoint, but /calculate works for preview
            const res = await axios.post(`${API_URL}/api/excise-duty/calculate`, {
                category: formData.category,
                subcategory: formData.subcategory,
                monthYear: formData.monthYear,
                totalBlIssued: 0 // Placeholder, backend will fill if we use a specific flag
            });
            // Note: Since backend /calculate doesn't have auto-fill logic yet, 
            // the user should probably use the bulk generate button, 
            // or we implement a /preview-regb endpoint.
            // For now, let's keep it simple and just set the flag for submission.
        } catch (err) {
            console.error('Auto-fill preview error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = async () => {
        try {
            const res = await axios.post(`${API_URL}/api/excise-duty/calculate`, {
                category: formData.category,
                subcategory: formData.subcategory,
                totalBlIssued: parseFloat(formData.totalBlIssued),
                monthYear: formData.monthYear
            });
            if (res.data.success) {
                setPreview(res.data.data);
            }
        } catch (err) {
            console.error('Calculation error:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post(`${API_URL}/api/excise-duty/ledger`, formData);
            if (res.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.error || "Error creating entry. Check if entry already exists.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} animate-in zoom-in-95 duration-300`}>
                {/* Modal Header */}
                <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-indigo-50/50 border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'} shadow-lg shadow-indigo-500/30`}>
                            <Database size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">New Duty Entry</h2>
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-400">Initialize monthly ledger line</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Month Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Production Month</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="month"
                                    value={formData.monthYear.slice(0, 7)}
                                    onChange={(e) => setFormData({ ...formData, monthYear: `${e.target.value}-01` })}
                                    className={`w-full pl-12 pr-4 py-4 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'}`}
                                    required
                                />
                            </div>
                        </div>

                        {/* Strength Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Spirit Strength</label>
                            <div className="relative">
                                <select
                                    value={formData.subcategory}
                                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                    className={`w-full px-4 py-4 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'} appearance-none`}
                                    required
                                >
                                    {strengths.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Auto-fill Toggle */}
                        <div className="md:col-span-2">
                            <label className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${formData.autoFillFromRegB ? 'bg-indigo-600/10 border-indigo-600 text-indigo-400' : 'bg-transparent border-gray-800 text-gray-400 hover:border-gray-700'}`}>
                                <input
                                    type="checkbox"
                                    checked={formData.autoFillFromRegB}
                                    onChange={(e) => setFormData({ ...formData, autoFillFromRegB: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="flex items-center gap-3">
                                    <Database size={20} />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest">Auto-fill from Reg-B</p>
                                        <p className="text-[10px] font-bold opacity-60">Automatically pull BL issued from this month's Reg-B records</p>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* BL Issued */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Bulk Liters (BL) Issued</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.totalBlIssued}
                                    onChange={(e) => setFormData({ ...formData, totalBlIssued: e.target.value })}
                                    className={`w-full px-4 py-4 rounded-2xl font-black text-xl border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'} ${formData.autoFillFromRegB ? 'opacity-50 pointer-events-none' : ''}`}
                                    placeholder="0.00"
                                    required={!formData.autoFillFromRegB}
                                    disabled={formData.autoFillFromRegB}
                                />
                            </div>
                        </div>

                        {/* AL Issued */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Absolute Liters (AL) issued</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.totalAlIssued}
                                    onChange={(e) => setFormData({ ...formData, totalAlIssued: e.target.value })}
                                    className={`w-full px-4 py-4 rounded-2xl font-black text-xl border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'}`}
                                    placeholder="0.00"
                                />
                                <p className="text-[9px] text-gray-500 font-bold mt-1 px-2 italic uppercase tracking-tighter">* Optional, for record only</p>
                            </div>
                        </div>
                    </div>

                    {/* Calculation Preview */}
                    {preview && (
                        <div className={`mb-8 p-6 rounded-3xl animate-in slide-in-from-bottom-2 duration-300 ${isDark ? 'bg-indigo-900/10 border border-indigo-900/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                            <div className="flex items-center gap-3 mb-4 text-indigo-500">
                                <Calculator size={18} />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Duty Calculation Preview</h4>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-black tracking-tight">
                                        ₹{new Intl.NumberFormat('en-IN').format(preview.dutyAccrued)}
                                    </p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                        {formData.totalBlIssued} L × ₹{preview.applicableRate}/BL
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 justify-end text-green-500">
                                        <CheckCircle2 size={12} />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Verified Rate</span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-bold mt-1">Eff: {new Date(preview.rateDetails.effectiveFrom).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Remarks */}
                    <div className="space-y-2 mb-8">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Remarks</label>
                        <textarea
                            value={formData.remarks}
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                            className={`w-full px-4 py-4 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'} h-24`}
                            placeholder="Optional notes about this entry..."
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-sm shadow-xl transition-all flex items-center justify-center gap-3 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/40 active:scale-[0.98]'}`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Plus size={20} /> Create Entry
                            </>
                        )}
                    </button>
                    <p className="text-center text-[9px] text-gray-500 font-bold mt-4 uppercase tracking-widest flex items-center justify-center gap-2">
                        <Info size={12} /> Opening balance will be auto-fetched from previous month.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default DutyEntryModal;
