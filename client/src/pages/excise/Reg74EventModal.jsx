import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Clock, Info, Shield, Droplets, Truck, RefreshCw, Archive, Settings } from 'lucide-react';
import { API_URL } from '../../config';
import { format } from 'date-fns';

const Reg74EventModal = ({ vat, type, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        eventDateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        vatId: vat?.id,
        remarks: '',

        // Contextual Blocks
        openingData: {},
        receiptData: {},
        issueData: {},
        adjustmentData: {},
        productionData: {},
        closingData: {}
    });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                eventType: type
            };

            await axios.post(`${API_URL}/api/reg74/event`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`${type} recorded successfully!`);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full p-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all";
    const labelClass = "block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider";

    const renderFields = () => {
        switch (type) {
            case 'OPENING':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="col-span-2 p-3 bg-blue-50 rounded-xl mb-2 flex items-center gap-2 text-blue-700 font-bold text-xs uppercase">
                            <Shield size={14} /> Opening Balance (Cols 1-7)
                        </div>
                        <div>
                            <label className={labelClass}>Dip (CM)</label>
                            <input type="number" step="0.1" onChange={e => handleChange('openingData', 'dipCm', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Temp (C)</label>
                            <input type="number" step="0.1" onChange={e => handleChange('openingData', 'temp', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Strength % v/v</label>
                            <input type="number" step="0.1" onChange={e => handleChange('openingData', 'strength', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Volume BL</label>
                            <input type="number" step="0.01" onChange={e => handleChange('openingData', 'volumeBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                    </div>
                );

            case 'UNLOADING':
            case 'RECEIPT':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="col-span-2 p-3 bg-green-50 rounded-xl mb-2 flex items-center gap-2 text-green-700 font-bold text-xs uppercase">
                            <Truck size={14} /> Spirit Receipt (Cols 8-11)
                        </div>
                        <div className="col-span-2">
                            <label className={labelClass}>From Which Receiver</label>
                            <input type="text" placeholder="e.g. Tanker WB65-1234 or SST-5" onChange={e => handleChange('receiptData', 'source', e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Qty BL (MFM-I)</label>
                            <input type="number" step="0.01" onChange={e => handleChange('receiptData', 'qtyBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Strength % v/v</label>
                            <input type="number" step="0.1" onChange={e => handleChange('receiptData', 'strength', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                    </div>
                );

            case 'INTERNAL_TRANSFER':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="col-span-2 p-3 bg-indigo-50 rounded-xl mb-2 flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                            <RefreshCw size={14} /> Internal Issue (Cols 12-15)
                        </div>
                        <div className="col-span-2">
                            <label className={labelClass}>To Which VAT/CASK</label>
                            <input type="text" onChange={e => handleChange('issueData', 'dest', e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Qty BL</label>
                            <input type="number" step="0.01" onChange={e => handleChange('issueData', 'qtyBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Strength % v/v</label>
                            <input type="number" step="0.1" onChange={e => handleChange('issueData', 'strength', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                    </div>
                );

            case 'WATER_ADDITION':
            case 'ADJUSTMENT':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="col-span-2 p-3 bg-orange-50 rounded-xl mb-2 flex items-center gap-2 text-orange-700 font-bold text-xs uppercase">
                            <Settings size={14} /> Adjustment/Increase (Cols 16-19)
                        </div>
                        <div>
                            <label className={labelClass}>Adjustment Type</label>
                            <select onChange={e => handleChange('adjustmentData', 'type', e.target.value)} className={inputClass}>
                                <option value="INCREASE">INCREASE (Gain/Water)</option>
                                <option value="WASTAGE">WASTAGE (Loss)</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Qty BL</label>
                            <input type="number" step="0.01" onChange={e => handleChange('adjustmentData', 'qtyBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                    </div>
                );

            case 'PRODUCTION':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="col-span-2 p-3 bg-purple-50 rounded-xl mb-2 flex items-center gap-2 text-purple-700 font-bold text-xs uppercase">
                            <Droplets size={14} /> Production Issue (Cols 25-33)
                        </div>
                        <div>
                            <label className={labelClass}>RLT Volume BL</label>
                            <input type="number" step="0.01" onChange={e => handleChange('productionData', 'rltBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Strength % v/v</label>
                            <input type="number" step="0.1" onChange={e => handleChange('productionData', 'strength', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>MFM-II Qty BL</label>
                            <input type="number" step="0.01" onChange={e => handleChange('productionData', 'mfmBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Avg Density</label>
                            <input type="number" step="0.0001" onChange={e => handleChange('productionData', 'density', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                    </div>
                );

            case 'CLOSING':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="col-span-2 p-3 bg-gray-100 rounded-xl mb-2 flex items-center gap-2 text-gray-700 font-bold text-xs uppercase">
                            <Archive size={14} /> Closing Snapshot (Cols 34-37)
                        </div>
                        <div>
                            <label className={labelClass}>Final Dip (CM)</label>
                            <input type="number" step="0.1" onChange={e => handleChange('closingData', 'finalDipCm', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Final BL</label>
                            <input type="number" step="0.01" onChange={e => handleChange('closingData', 'finalBl', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Strength % v/v</label>
                            <input type="number" step="0.1" onChange={e => handleChange('closingData', 'finalStrength', parseFloat(e.target.value))} className={inputClass} required />
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            {type.replace('_', ' ')}
                            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">{vat?.vatCode}</span>
                        </h2>
                        <p className="text-xs text-gray-400 font-medium">Capture operational event for Reg-74</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50">
                        <label className={labelClass}>Event Date & Time</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-2.5 text-blue-400" size={16} />
                            <input
                                type="datetime-local"
                                value={formData.eventDateTime}
                                onChange={e => handleChange('root', 'eventDateTime', e.target.value)}
                                className={`${inputClass} pl-10 border-blue-100 shadow-sm`}
                                required
                            />
                        </div>
                    </div>

                    {renderFields()}

                    <div className="space-y-2">
                        <label className={labelClass}>Remarks / Nature of Operation</label>
                        <textarea
                            onChange={e => handleChange('root', 'remarks', e.target.value)}
                            className={`${inputClass} h-24 pt-3`}
                            placeholder="Enter any additional context or batch numbers..."
                        ></textarea>
                    </div>

                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 border border-gray-200 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-4 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:shadow-lg disabled:bg-blue-300 transition-all text-sm flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                            Record Event
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Reg74EventModal;
