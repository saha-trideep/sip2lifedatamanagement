import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Package, FlaskConical, Database, Calendar, RefreshCw } from 'lucide-react';
import { API_URL } from '../../config';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';

const ManualBatchModal = ({ onClose, onSuccess }) => {
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [brands, setBrands] = useState([]);
    const [vats, setVats] = useState([]);
    const [formData, setFormData] = useState({
        baseBatchNo: '',
        brandId: '',
        vatId: '', // Destination BRT
        sourceVatId: '', // Source SST
        startDate: format(new Date(), 'yyyy-MM-dd'),
        receiptBl: '',
        receiptStrength: '',
        receiptAl: '',
        totalVolumeBl: '', // Target blend size
        totalVolumeAl: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [brandRes, vatRes] = await Promise.all([
                    axios.get(`${API_URL}/api/reg74/brands`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/reg74/vats`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setBrands(brandRes.data);
                setVats(vatRes.data);
            } catch (error) {
                console.error("Failed to fetch metadata", error);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate AL if BL and Strength change
            if (name === 'receiptBl' || name === 'receiptStrength') {
                const bl = parseFloat(newData.receiptBl || 0);
                const str = parseFloat(newData.receiptStrength || 0);
                newData.receiptAl = (bl * str / 100).toFixed(2);
            }

            // Auto-calculate Total AL for blending
            if (name === 'totalVolumeBl') {
                const bl = parseFloat(newData.totalVolumeBl || 0);
                // Default to 42.8 for IMFL if possible
                const brand = brands.find(b => b.id === parseInt(newData.brandId));
                if (brand?.category === 'IMFL') {
                    newData.totalVolumeAl = (bl * 0.428).toFixed(2);
                }
            }

            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const sourceVat = vats.find(v => v.id === parseInt(formData.sourceVatId));

            await axios.post(`${API_URL}/api/reg74/batches`, {
                ...formData,
                sourceVatCode: sourceVat?.vatCode || 'SST',
                totalVolumeAl: parseFloat(formData.totalVolumeAl) || (parseFloat(formData.totalVolumeBl) * 0.428)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Blending Batch Created Successfully!");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            alert("Failed to create batch: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const inputClass = `w-full p-4 border rounded-2xl font-bold transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-indigo-500' : 'bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500'}`;
    const labelClass = `block text-[10px] font-black mb-2 uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`;

    return (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className={`rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border transition-all ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-white'}`}>
                <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'bg-indigo-900/20 border-gray-800' : 'bg-blue-50 border-gray-50'}`}>
                    <div>
                        <h2 className={`text-3xl font-black flex items-center gap-3 tracking-tighter ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            <FlaskConical className="text-indigo-500" /> Manual Batch Initialization
                        </h2>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">SST to BRT Blending Procedure</p>
                    </div>
                    <button onClick={onClose} className={`p-3 rounded-full transition-all ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-white text-gray-400'}`}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Identification */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className={labelClass}>Base Batch Number</label>
                            <input type="text" name="baseBatchNo" value={formData.baseBatchNo} onChange={handleChange} placeholder="e.g. 10AJD01" className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Target Brand</label>
                            <select name="brandId" value={formData.brandId} onChange={handleChange} className={inputClass} required>
                                <option value="">Select Brand</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name} ({b.category})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Start Date</label>
                            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={inputClass} required />
                        </div>
                    </div>

                    {/* Infrastructure */}
                    <div className="grid grid-cols-2 gap-6 p-8 rounded-[2rem] bg-gray-50/50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700">
                        <div>
                            <label className={labelClass}>Source SST Vat</label>
                            <select name="sourceVatId" value={formData.sourceVatId} onChange={handleChange} className={inputClass} required>
                                <option value="">Select Source</option>
                                {vats.filter(v => v.vatType === 'SST').map(v => <option key={v.id} value={v.id}>{v.vatCode}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Destination BRT Vat</label>
                            <select name="vatId" value={formData.vatId} onChange={handleChange} className={inputClass} required>
                                <option value="">Select Destination</option>
                                {vats.filter(v => v.vatType === 'BRT').map(v => <option key={v.id} value={v.id}>{v.vatCode}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Spirit Transfer Data */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 border-b border-indigo-100 dark:border-indigo-900/40 pb-2">Spirit Receipt Data (Statutory Columns 6-9)</h4>
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className={labelClass}>Transferred BL</label>
                                <input type="number" step="0.01" name="receiptBl" value={formData.receiptBl} onChange={handleChange} className={inputClass} required />
                            </div>
                            <div>
                                <label className={labelClass}>Strength %</label>
                                <input type="number" step="0.1" name="receiptStrength" value={formData.receiptStrength} onChange={handleChange} className={inputClass} required />
                            </div>
                            <div>
                                <label className={labelClass}>Calculated AL</label>
                                <input type="number" name="receiptAl" value={formData.receiptAl} readOnly className={`${inputClass} border-indigo-200/50 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400`} />
                            </div>
                        </div>
                    </div>

                    {/* Final Blend Target */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-500 border-b border-purple-100 dark:border-purple-900/40 pb-2">Blend Prepared Data (Statutory Columns 10-13)</h4>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Total Blend Prepared (BL)</label>
                                <input type="number" step="0.01" name="totalVolumeBl" value={formData.totalVolumeBl} onChange={handleChange} className={inputClass} required />
                            </div>
                            <div>
                                <label className={labelClass}>Target Total AL</label>
                                <input type="number" step="0.01" name="totalVolumeAl" value={formData.totalVolumeAl} onChange={handleChange} className={inputClass} required />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={onClose} className={`flex-1 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${isDark ? 'bg-gray-800 text-gray-500 hover:bg-gray-700' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>Cancel</button>
                        <button type="submit" disabled={loading} className={`flex-[2] py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-900 text-white hover:bg-blue-600'}`}>
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />} Initialize Blending Batch
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualBatchModal;
