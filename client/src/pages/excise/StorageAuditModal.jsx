import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, ShieldCheck, Ruler, Thermometer, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { API_URL } from '../../config';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';

const StorageAuditModal = ({ vat, onClose, onSuccess }) => {
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [formData, setFormData] = useState({
        measuredDip: '',
        measuredTemp: '',
        measuredStrength: '',
        measuredBl: '',
        lastClosingBl: vat?.balanceBl || 0,
        lastClosingAl: vat?.balanceAl || 0,
        remarks: ''
    });

    const calculateDifference = () => {
        const bl = parseFloat(formData.measuredBl || 0);
        const str = parseFloat(formData.measuredStrength || 0);
        const physicalAl = (bl * str / 100);
        const bookAl = formData.lastClosingAl;
        const diffAl = bookAl - physicalAl;
        const threshold = bookAl * 0.003; // 0.3% rule

        setResult({
            physicalAl: physicalAl.toFixed(2),
            diffAl: diffAl.toFixed(2),
            threshold: threshold.toFixed(2),
            isChargeable: diffAl > threshold
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!result) return alert("Please calculate findings first");

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const eventPayload = {
                vatId: vat.id,
                eventDateTime: new Date().toISOString(),
                eventType: 'ADJUSTMENT',
                adjustmentData: {
                    type: 'WASTAGE',
                    reason: `STOCK_AUDIT: Physical=${result.physicalAl} vs Book=${formData.lastClosingAl}`,
                    qtyBl: (formData.lastClosingBl - formData.measuredBl),
                    qtyAl: result.diffAl,
                    isChargeable: result.isChargeable
                },
                remarks: formData.remarks || "Statutory 0.3% check performed"
            };

            await axios.post(`${API_URL}/api/reg74/event`, eventPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(result.isChargeable ? "Chargeable Wastage Recorded!" : "Stock Verified (Pass)");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            alert("Record failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = `w-full p-4 border rounded-2xl font-bold transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-100'}`;
    const labelClass = `block text-[10px] font-black mb-2 uppercase tracking-widest text-gray-400`;

    return (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className={`rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border transition-all ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-white'}`}>
                <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'bg-orange-900/20 border-gray-800' : 'bg-orange-50 border-gray-50'}`}>
                    <div>
                        <h2 className={`text-3xl font-black flex items-center gap-3 tracking-tighter ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            <ShieldCheck className="text-orange-500" /> Physical Stock Audit
                        </h2>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Vat: {vat.vatCode} | 0.3% Threshold Check</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white transition-all"><X /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/40 p-6 rounded-3xl border border-dashed border-gray-200">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Current Book Stock</span>
                                <div className="text-xl font-black text-indigo-500">{formData.lastClosingBl} <span className="text-xs">BL</span></div>
                                <div className="text-xs font-bold text-gray-400">{formData.lastClosingAl} <span className="text-[10px]">AL</span></div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-widest">Allowable Loss (0.3%)</span>
                                <div className="text-xl font-black text-orange-500">{(formData.lastClosingAl * 0.003).toFixed(2)} <span className="text-xs">AL</span></div>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Measured Dip (CM)</label>
                            <input type="number" step="0.1" value={formData.measuredDip} onChange={e => setFormData({ ...formData, measuredDip: e.target.value })} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Measured Strength %</label>
                            <input type="number" step="0.1" value={formData.measuredStrength} onChange={e => setFormData({ ...formData, measuredStrength: e.target.value })} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Calculated BL (from Dip)</label>
                            <input type="number" step="0.01" value={formData.measuredBl} onChange={e => setFormData({ ...formData, measuredBl: e.target.value })} className={inputClass} required />
                        </div>
                        <div className="flex items-end">
                            <button type="button" onClick={calculateDifference} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all">Calculate Findings</button>
                        </div>
                    </div>

                    {result && (
                        <div className={`p-8 rounded-[2rem] border animate-in zoom-in-95 ${result.isChargeable ? 'bg-red-50 border-red-200 text-red-900' : 'bg-green-50 border-green-200 text-green-900'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-black uppercase text-xs tracking-widest">Audit Result</h4>
                                {result.isChargeable ? <AlertTriangle className="text-red-500" /> : <CheckCircle className="text-green-500" />}
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <div className="text-[8px] font-black uppercase opacity-60">Physical AL</div>
                                    <div className="text-lg font-black">{result.physicalAl}</div>
                                </div>
                                <div>
                                    <div className="text-[8px] font-black uppercase opacity-60">Difference (Loss)</div>
                                    <div className="text-lg font-black">{result.diffAl}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] font-black uppercase opacity-60">Status</div>
                                    <div className={`text-xs font-black uppercase ${result.isChargeable ? 'text-red-600' : 'text-green-600'}`}>
                                        {result.isChargeable ? 'Chargeable' : 'Allowable'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 py-5 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase text-xs">Cancel</button>
                        <button type="submit" disabled={loading || !result} className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2">
                            <Save size={18} /> Commit Audit to Reg-74
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StorageAuditModal;
