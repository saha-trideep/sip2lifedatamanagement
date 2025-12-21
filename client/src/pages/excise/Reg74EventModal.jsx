import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Calculator, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { API_URL } from '../../config';
import { format } from 'date-fns';

const Reg74EventModal = ({ vat, type, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        vatId: vat?.id,
        // Common / Event Specific
        dipCm: 0,
        temperatureC: 0,
        alcoholmeterIndication: 0,
        strengthVv: 0,
        volumeBl: 0,
        volumeAl: 0,
        rltDipCm: 0,
        rltVolumeBl: 0,
        sourceVat: '',
        qtyBl: 0,
        qtyAl: 0,
        avgStrengthVv: 0,
        avgDensity: 0,
        adjustmentType: 'WASTAGE',
        reason: 'OPERATIONAL',
        approvedBy: '',
        finalStrengthVv: 0,
        destination: 'PRODUCTION',
        deadStockAl: 0,
        remarks: ''
    });

    const handleChange = (e) => {
        const { name, value, type: inputType } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: inputType === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');
        const endpoint = type.toLowerCase().replace('_', '-');

        try {
            const dataToSubmit = { ...formData };
            if (type === 'QC') dataToSubmit.qcDateTime = formData.dateTime;

            await axios.post(`${API_URL}/api/reg74/${endpoint}`, dataToSubmit, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`${type} record saved successfully!`);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error saving record: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const renderForm = () => {
        switch (type) {
            case 'OPENING':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Dip (CM)</label>
                                <input type="number" step="0.1" name="dipCm" value={formData.dipCm} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Temp (C)</label>
                                <input type="number" step="0.1" name="temperatureC" value={formData.temperatureC} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Vol (BL)</label>
                                <input type="number" step="0.01" name="volumeBl" value={formData.volumeBl} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Strength (v/v)</label>
                                <input type="number" step="0.1" name="strengthVv" value={formData.strengthVv} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <label className="flex items-center gap-2 text-xs font-bold text-blue-700 mb-2 uppercase">
                                <Info size={14} /> Remote Level Transmitter (RLT)
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" step="0.1" name="rltDipCm" placeholder="RLT Dip" value={formData.rltDipCm} onChange={handleChange} className="p-2 border rounded bg-white" required />
                                <input type="number" step="0.01" name="rltVolumeBl" placeholder="RLT Vol" value={formData.rltVolumeBl} onChange={handleChange} className="p-2 border rounded bg-white" required />
                            </div>
                        </div>
                    </>
                );
            case 'RECEIPT':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Source Vat</label>
                                <input type="text" name="sourceVat" value={formData.sourceVat} onChange={handleChange} placeholder="e.g. SST-5" className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">MFM1 Qty (BL)</label>
                                <input type="number" step="0.01" name="qtyBl" value={formData.qtyBl} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Strength (v/v)</label>
                                <input type="number" step="0.1" name="avgStrengthVv" value={formData.avgStrengthVv} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Avg Density</label>
                                <input type="number" step="0.0001" name="avgDensity" value={formData.avgDensity} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                        </div>
                    </div>
                );
            case 'QC':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Final Strength (v/v)</label>
                            <input type="number" step="0.1" name="finalStrengthVv" value={formData.finalStrengthVv} onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Approved By</label>
                            <input type="text" name="approvedBy" value={formData.approvedBy} onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                    </div>
                );
            case 'ISSUE':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Destination</label>
                                <select name="destination" value={formData.destination} onChange={handleChange} className="w-full p-2 border rounded">
                                    <option value="PRODUCTION">PRODUCTION</option>
                                    <option value="VAT">VAT TRANSFER</option>
                                    <option value="CASK">CASK</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">MFM2 Qty (BL)</label>
                                <input type="number" step="0.01" name="qtyBl" value={formData.qtyBl} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Strength (v/v)</label>
                                <input type="number" step="0.1" name="strengthVv" value={formData.strengthVv} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Dead Stock (AL)</label>
                                <input type="number" step="0.01" name="deadStockAl" value={formData.deadStockAl} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                        </div>
                    </div>
                );
            case 'ADJUSTMENT':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Type</label>
                                <select name="adjustmentType" value={formData.adjustmentType} onChange={handleChange} className="w-full p-2 border rounded">
                                    <option value="WASTAGE">WASTAGE</option>
                                    <option value="INCREASE">INCREASE</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Reason</label>
                                <select name="reason" value={formData.reason} onChange={handleChange} className="w-full p-2 border rounded">
                                    <option value="OPERATIONAL">OPERATIONAL</option>
                                    <option value="STOCK_AUDIT">STOCK AUDIT</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Qty BL</label>
                                <input type="number" step="0.01" name="qtyBl" value={formData.qtyBl} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Qty AL</label>
                                <input type="number" step="0.01" name="qtyAl" value={formData.qtyAl} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                        </div>
                    </div>
                )
            case 'CLOSING':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Final Dip (CM)</label>
                            <input type="number" step="0.1" name="finalDipCm" value={formData.finalDipCm} onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Final BL</label>
                            <input type="number" step="0.01" name="finalVolumeBl" value={formData.finalVolumeBl} onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Final Strength</label>
                            <input type="number" step="0.1" name="finalStrengthVv" value={formData.finalStrengthVv} onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Final AL</label>
                            <input type="number" step="0.01" name="finalQtyAl" value={formData.finalQtyAl} onChange={handleChange} className="w-full p-2 border rounded" required />
                        </div>
                    </div>
                )
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{type} Record</h2>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">{vat?.vatCode}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase flex items-center gap-1">
                            <Clock size={12} /> Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            name="dateTime"
                            value={formData.dateTime}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg text-sm bg-gray-50"
                            required
                        />
                    </div>

                    {renderForm()}

                    <div className="pt-4">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Remarks</label>
                        <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="2" className="w-full p-2 border rounded text-sm" placeholder="Any additional notes..."></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg disabled:bg-blue-300"
                    >
                        {loading ? 'Saving...' : <><Save size={20} /> Save {type} Record</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Reg74EventModal;
