import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Clock, Info, Shield, Droplets, Truck, RefreshCw, Archive, Settings } from 'lucide-react';
import { API_URL } from '../../config';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';

const Reg74EventModal = ({ vat, type, onClose, initialData = null }) => {
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        eventDateTime: initialData ? format(new Date(initialData.eventDateTime), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        vatId: vat?.id || initialData?.vatId,
        remarks: initialData?.remarks || '',
        openingData: initialData?.openingData || {},
        receiptData: initialData?.receiptData || {},
        issueData: initialData?.issueData || {},
        adjustmentData: initialData?.adjustmentData || {},
        productionData: initialData?.productionData || {},
        closingData: initialData?.closingData || {},
        batchId: initialData?.batchId || ''
    });

    const [brands, setBrands] = useState([]);
    const [batches, setBatches] = useState([]);
    const [showBatchForm, setShowBatchForm] = useState(false);
    const [newBatch, setNewBatch] = useState({ baseBatchNo: '', brandId: '', startDate: format(new Date(), "yyyy-MM-dd") });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [brandRes, batchRes] = await Promise.all([
                    axios.get(`${API_URL}/api/reg74/brands`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/reg74/batches?status=OPEN&vatId=${vat?.id}`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setBrands(brandRes.data);
                setBatches(batchRes.data);
            } catch (error) {
                console.error("Failed to fetch metadata", error);
            }
        };
        fetchData();
    }, [vat?.id]);

    const handleChange = (block, field, value) => {
        if (block === 'root') {
            setFormData(prev => ({ ...prev, [field]: value }));
        } else {
            setFormData(prev => ({
                ...prev,
                [block]: { ...prev[block], [field]: value }
            }));
        }
    };

    const handleCreateBatch = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/reg74/batches`, {
                ...newBatch,
                vatId: vat.id,
                totalVolumeBl: formData.adjustmentData.qtyBl || 0,
                totalVolumeAl: (formData.adjustmentData.qtyBl * 0.428) || 0
            }, { headers: { Authorization: `Bearer ${token}` } });
            setBatches([...batches, res.data]);
            handleChange('root', 'batchId', res.data.id);
            setShowBatchForm(false);
            alert("Batch created successfully!");
        } catch (error) {
            alert("Error creating batch: " + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = { ...formData, eventType: type };
            const url = initialData ? `${API_URL}/api/reg74/event/${initialData.id}` : `${API_URL}/api/reg74/event`;
            const method = initialData ? 'put' : 'post';
            await axios[method](url, payload, { headers: { Authorization: `Bearer ${token}` } });
            alert(`${type} ${initialData ? 'updated' : 'recorded'} successfully!`);
            onClose();
        } catch (error) {
            alert("Error: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const inputClass = `w-full p-3 border rounded-xl font-bold transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-indigo-500' : 'bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500'}`;
    const labelClass = `block text-[10px] font-black mb-1 uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-500'}`;

    const renderFields = () => {
        switch (type) {
            case 'OPENING':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className={`col-span-2 p-3 rounded-xl mb-2 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${isDark ? 'bg-indigo-900/20 text-indigo-400' : 'bg-blue-50 text-blue-700'}`}>
                            <Shield size={14} /> Opening Balance (Cols 1-7)
                        </div>
                        <div>
                            <label className={labelClass}>Dip (CM)</label>
                            <input type="number" step="0.1" value={formData.openingData.dipCm || ''} onChange={e => handleChange('openingData', 'dipCm', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Temp (C)</label>
                            <input type="number" step="0.1" value={formData.openingData.temp || ''} onChange={e => handleChange('openingData', 'temp', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Strength % v/v</label>
                            <input type="number" step="0.1" value={formData.openingData.strength || ''} onChange={e => handleChange('openingData', 'strength', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Volume BL</label>
                            <input type="number" step="0.01" value={formData.openingData.volumeBl || ''} onChange={e => handleChange('openingData', 'volumeBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                    </div>
                );

            case 'UNLOADING':
            case 'RECEIPT':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className={`col-span-2 p-3 rounded-xl mb-2 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'}`}>
                            <Truck size={14} /> Spirit Receipt (Cols 8-11)
                        </div>
                        <div className="col-span-2">
                            <label className={labelClass}>From Which Receiver</label>
                            <input type="text" placeholder="e.g. Tanker WB65-1234 or SST-5" value={formData.receiptData.source || ''} onChange={e => handleChange('receiptData', 'source', e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Qty BL (MFM-I)</label>
                            <input type="number" step="0.01" value={formData.receiptData.qtyBl || ''} onChange={e => handleChange('receiptData', 'qtyBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Strength % v/v</label>
                            <input type="number" step="0.1" value={formData.receiptData.strength || ''} onChange={e => handleChange('receiptData', 'strength', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                    </div>
                );

            case 'INTERNAL_TRANSFER':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className={`col-span-2 p-3 rounded-xl mb-2 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${isDark ? 'bg-indigo-900/20 text-indigo-400' : 'bg-indigo-50 text-indigo-700'}`}>
                            <RefreshCw size={14} /> Internal Issue (Cols 12-15)
                        </div>
                        <div className="col-span-2">
                            <label className={labelClass}>To Which VAT/CASK</label>
                            <input type="text" value={formData.issueData.dest || ''} onChange={e => handleChange('issueData', 'dest', e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Qty BL</label>
                            <input type="number" step="0.01" value={formData.issueData.qtyBl || ''} onChange={e => handleChange('issueData', 'qtyBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Strength % v/v</label>
                            <input type="number" step="0.1" value={formData.issueData.strength || ''} onChange={e => handleChange('issueData', 'strength', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                    </div>
                );

            case 'ADJUSTMENT':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className={`col-span-2 p-3 rounded-xl mb-2 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${isDark ? 'bg-orange-900/20 text-orange-400' : 'bg-orange-50 text-orange-700'}`}>
                            <Settings size={14} /> Adjustment/Increase (Cols 16-19)
                        </div>
                        <div>
                            <label className={labelClass}>Adjustment Type</label>
                            <select value={formData.adjustmentData.type || 'INCREASE'} onChange={e => handleChange('adjustmentData', 'type', e.target.value)} className={inputClass}>
                                <option value="INCREASE">INCREASE (Gain/Water)</option>
                                <option value="WASTAGE">WASTAGE (Loss)</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Qty BL</label>
                            <input type="number" step="0.01" value={formData.adjustmentData.qtyBl || ''} onChange={e => handleChange('adjustmentData', 'qtyBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Qty AL (Excise Chargeable)</label>
                            <input type="number" step="0.01" value={formData.adjustmentData.qtyAl || ''} onChange={e => handleChange('adjustmentData', 'qtyAl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Audit Reason</label>
                            <select value={formData.adjustmentData.reason || 'OPERATIONAL'} onChange={e => handleChange('adjustmentData', 'reason', e.target.value)} className={inputClass}>
                                <option value="OPERATIONAL">Operational</option>
                                <option value="STOCK_AUDIT">Stock Audit (Physical vs Book)</option>
                            </select>
                        </div>
                    </div>
                );

            case 'PRODUCTION':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className={`col-span-2 p-3 rounded-xl mb-2 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${isDark ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-50 text-purple-700'}`}>
                            <Droplets size={14} /> Production Issue (Cols 25-33)
                        </div>
                        <div className="col-span-2">
                            <label className={labelClass}>Active Blend Batch</label>
                            <select
                                className={inputClass}
                                value={formData.batchId || ''}
                                onChange={e => handleChange('root', 'batchId', e.target.value)}
                                required
                            >
                                <option value="">Select Mother Batch</option>
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>{b.baseBatchNo} - {b.brand?.name} (Started: {format(new Date(b.startDate), 'dd/MM/yy')})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Session Suffix</label>
                            <input type="text" placeholder="e.g. -1 or -2" value={formData.productionData.batchSessionSuffix || ''} onChange={e => handleChange('productionData', 'batchSessionSuffix', e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Strength % v/v</label>
                            <input type="number" step="0.1" value={formData.productionData.strength || ''} onChange={e => handleChange('productionData', 'strength', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>RLT Volume BL</label>
                            <input type="number" step="0.01" value={formData.productionData.rltBl || ''} onChange={e => handleChange('productionData', 'rltBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>MFM-II Qty BL</label>
                            <input type="number" step="0.01" value={formData.productionData.mfmBl || ''} onChange={e => handleChange('productionData', 'mfmBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                    </div>
                );

            case 'CLOSING':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className={`col-span-2 p-3 rounded-xl mb-2 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-700'}`}>
                            <Archive size={14} /> Closing Snapshot (Cols 34-37)
                        </div>
                        <div>
                            <label className={labelClass}>Final Dip (CM)</label>
                            <input type="number" step="0.1" value={formData.closingData.finalDipCm || ''} onChange={e => handleChange('closingData', 'finalDipCm', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Final BL</label>
                            <input type="number" step="0.01" value={formData.closingData.finalBl || ''} onChange={e => handleChange('closingData', 'finalBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Strength % v/v</label>
                            <input type="number" step="0.1" value={formData.closingData.finalStrength || ''} onChange={e => handleChange('closingData', 'finalStrength', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className={`rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border transition-all ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-white'}`}>
                <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50/50 border-gray-100'}`}>
                    <div>
                        <h2 className={`text-2xl font-black flex items-center gap-3 tracking-tighter ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {type.replace('_', ' ')}
                            <span className={`text-[10px] px-3 py-1 rounded-full font-black ${isDark ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'}`}>{vat?.vatCode}</span>
                        </h2>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Reg-74 Statutory Incident</p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-all ${isDark ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-white hover:shadow-sm text-gray-400'}`}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className={`p-6 rounded-3xl border ${isDark ? 'bg-indigo-900/10 border-indigo-900/30' : 'bg-blue-50/30 border-blue-100/50'}`}>
                        <label className={labelClass}>Event Date & Time</label>
                        <div className="relative">
                            <Clock className={`absolute left-4 top-3.5 ${isDark ? 'text-indigo-400' : 'text-blue-400'}`} size={18} />
                            <input
                                type="datetime-local"
                                value={formData.eventDateTime}
                                onChange={e => handleChange('root', 'eventDateTime', e.target.value)}
                                className={`${inputClass} pl-12 shadow-sm`}
                                required
                            />
                        </div>
                    </div>

                    {renderFields()}

                    <div className="space-y-2">
                        <label className={labelClass}>Remarks / Operational Notes</label>
                        <textarea
                            value={formData.remarks}
                            onChange={e => handleChange('root', 'remarks', e.target.value)}
                            className={`${inputClass} h-32 pt-4 px-4`}
                            placeholder="Provide regulatory context for this entry..."
                        ></textarea>
                    </div>

                    <div className={`flex gap-4 pt-6 sticky bottom-0 transition-colors ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 py-5 px-6 border rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all ${isDark ? 'border-gray-800 text-gray-500 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-[2] py-5 px-6 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-900/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'}`}
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                            {initialData ? 'Update Record' : 'Commit Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Reg74EventModal;
