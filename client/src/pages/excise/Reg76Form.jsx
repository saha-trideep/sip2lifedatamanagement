import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ArrowLeft, Save, Loader, Calculator, Calendar, Truck,
    Droplets, Scale, Info, AlertTriangle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../config';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';

const Reg76Form = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [vats, setVats] = useState([]);

    const [formData, setFormData] = useState({
        receiptDate: format(new Date(), 'yyyy-MM-dd'),
        arrivalDate: format(new Date(), 'yyyy-MM-dd'),
        permitNo: '',
        permitDate: '',
        exportingDistillery: '',
        invoiceNo: '',
        invoiceDate: '',
        vehicleNo: '',
        tankerMakeModel: '',
        natureOfSpirit: 'GENA',
        storageVat: '',

        advisedBl: 0,
        advisedAl: 0,
        advisedStrength: 0,
        advisedMassKg: 0,

        ladenWeightKg: 0,
        unladenWeightKg: 0,
        avgDensity: 0,
        avgTemperature: 0,

        receivedStrength: 0,
        remarks: '',

        // Calculated (Frontend)
        calcReceivedMass: 0,
        calcReceivedBl: 0,
        calcReceivedAl: 0,
        calcTransitWastageAl: 0
    });

    const [editReason, setEditReason] = useState('');

    // Auto-unload to Reg-74 state
    const [autoUnload, setAutoUnload] = useState(false);
    const [unloadVatId, setUnloadVatId] = useState('');
    const [finalStrength, setFinalStrength] = useState('');

    useEffect(() => {
        fetchVats();
        if (isEdit) fetchEntry();
    }, [id]);

    const fetchVats = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/reg74/vats`);
            setVats(res.data);
            if (!isEdit && res.data.length > 0) {
                setFormData(prev => ({ ...prev, storageVat: res.data[0].vatCode }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEntry = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/registers/reg76/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && res.data.entry) {
                const entry = res.data.entry;
                setFormData({
                    ...entry,
                    receiptDate: format(new Date(entry.receiptDate), 'yyyy-MM-dd'),
                    arrivalDate: entry.arrivalDate ? format(new Date(entry.arrivalDate), 'yyyy-MM-dd') : '',
                    permitDate: entry.permitDate ? format(new Date(entry.permitDate), 'yyyy-MM-dd') : '',
                    invoiceDate: entry.invoiceDate ? format(new Date(entry.invoiceDate), 'yyyy-MM-dd') : '',
                });
            }
        } catch (error) {
            console.error(error);
            alert('Error loading entry: ' + (error.response?.data?.error || error.message));
        } finally {
            setFetching(false);
        }
    };

    // Auto-calculations
    useEffect(() => {
        const mass = formData.ladenWeightKg - formData.unladenWeightKg;
        const bl = formData.avgDensity > 0 ? (mass / formData.avgDensity) : 0;
        const al = (bl * formData.receivedStrength) / 100;
        const wastage = formData.advisedAl - al;

        setFormData(prev => ({
            ...prev,
            calcReceivedMass: mass,
            calcReceivedBl: bl,
            calcReceivedAl: al,
            calcTransitWastageAl: wastage
        }));
    }, [
        formData.ladenWeightKg,
        formData.unladenWeightKg,
        formData.avgDensity,
        formData.receivedStrength,
        formData.advisedAl
    ]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            let savedEntryId = null;

            if (isEdit) {
                await axios.put(`${API_URL}/api/registers/reg76/${id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Reg-76 Entry updated successfully!");
            } else {
                const response = await axios.post(`${API_URL}/api/registers/reg76`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                savedEntryId = response.data.entry.id;

                // Show calculation results
                if (response.data.calculated) {
                    const calc = response.data.calculated;
                    const message = `Entry saved successfully!\n\n` +
                        `Received: ${response.data.entry.receivedAl.toFixed(2)} AL\n` +
                        `Wastage: ${calc.wastageAl || 0} AL (${calc.percentageWastage || 0}%)\n` +
                        `Status: ${calc.isChargeable ? '⚠️ Chargeable Wastage' : '✅ Within Limits'}`;
                    alert(message);
                } else {
                    alert("Reg-76 Entry saved successfully!");
                }

                // AUTO-UNLOAD: Create Reg-74 event if checkbox is checked
                if (autoUnload && savedEntryId && unloadVatId) {
                    try {
                        const unloadResponse = await axios.post(
                            `${API_URL}/api/reg74/auto-unload/${savedEntryId}`,
                            {
                                vatId: parseInt(unloadVatId),
                                eventDateTime: new Date().toISOString(),
                                finalStrength: finalStrength ? parseFloat(finalStrength) : null
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        alert(`✅ Vat unload event created successfully in Reg-74!\n\nEvent ID: ${unloadResponse.data.id}\nVat: ${unloadResponse.data.vat.vatCode}\nStrength: ${unloadResponse.data.receiptData.strength}%`);
                    } catch (unloadError) {
                        console.error('Auto-unload failed:', unloadError);
                        alert(`⚠️ Reg-76 saved, but auto-unload failed:\n${unloadError.response?.data?.error || unloadError.message}\n\nYou can manually create the unload event in Reg-74.`);
                    }
                }
            }

            navigate('/registers/reg76');
        } catch (error) {
            console.error(error);
            alert("Error saving entry: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className={`p-10 text-center ${isDark ? 'text-gray-500 bg-gray-950 min-h-screen' : 'text-gray-400 bg-gray-50'}`}>Loading entry details...</div>;

    return (
        <div className={`p-8 min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950 mt-1' : 'bg-gray-50'} flex justify-center`}>
            <div className="max-w-5xl w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/registers/reg76')} className={`p-2 rounded-full transition ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{isEdit ? 'Edit' : 'New'} Reg-76 Entry</h1>
                            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Excise Spirit Receipt Register</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 pb-20">

                    {/* Section 1: Permit & Identification */}
                    <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl shadow-sm border overflow-hidden`}>
                        <div className={`p-4 border-b flex items-center gap-2 font-black uppercase text-[10px] tracking-widest ${isDark ? 'bg-gray-800 text-gray-300 border-gray-800' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                            <Truck size={18} className={isDark ? "text-indigo-400" : "text-blue-600"} />
                            1. Transit & Permit Details
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Receipt Date (System)</label>
                                <input type="date" name="receiptDate" value={formData.receiptDate} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Arrival Date (Physical)</label>
                                <input type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Storage Vat</label>
                                <select name="storageVat" value={formData.storageVat} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}>
                                    <option value="">Select Vat</option>
                                    {vats.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Permit No</label>
                                <input type="text" name="permitNo" value={formData.permitNo} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-700' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Permit Date</label>
                                <input type="date" name="permitDate" value={formData.permitDate} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Exporting Distillery</label>
                                <input type="text" name="exportingDistillery" value={formData.exportingDistillery} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-700' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Invoice No</label>
                                <input type="text" name="invoiceNo" value={formData.invoiceNo} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-700' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Invoice Date</label>
                                <input type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Vehicle No</label>
                                <input type="text" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-700' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Tanker Make/Model</label>
                                <input type="text" name="tankerMakeModel" value={formData.tankerMakeModel} onChange={handleChange} placeholder="e.g., Tata 1613" className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-700' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Dispatch (Advised) Data */}
                    <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl shadow-sm border overflow-hidden`}>
                        <div className={`p-4 border-b flex items-center gap-2 font-black uppercase text-[10px] tracking-widest ${isDark ? 'bg-gray-800 text-gray-300 border-gray-800' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                            <Info size={18} className={isDark ? "text-indigo-400" : "text-blue-600"} />
                            2. Advised Data (From Permit/Invoice)
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Nature of Spirit</label>
                                <select name="natureOfSpirit" value={formData.natureOfSpirit} onChange={handleChange} className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}>
                                    <option value="GENA">GENA</option>
                                    <option value="ENA">ENA</option>
                                    <option value="RS">RS</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Advised BL</label>
                                <input type="number" step="0.01" name="advisedBl" value={formData.advisedBl} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Advised AL</label>
                                <input type="number" step="0.01" name="advisedAl" value={formData.advisedAl} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Advised Strength</label>
                                <input type="number" step="0.1" name="advisedStrength" value={formData.advisedStrength} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div className="md:col-start-2">
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Advised Mass (Kg)</label>
                                <input type="number" step="0.01" name="advisedMassKg" value={formData.advisedMassKg} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Receipt Measurement */}
                    <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl shadow-sm border overflow-hidden`}>
                        <div className={`p-4 border-b flex items-center gap-2 font-black uppercase text-[10px] tracking-widest ${isDark ? 'bg-gray-800 text-gray-300 border-gray-800' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                            <Scale size={18} className={isDark ? "text-indigo-400" : "text-blue-600"} />
                            3. Physical Receipt Measurement
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Laden Weight (Kg)</label>
                                <input type="number" step="0.01" name="ladenWeightKg" value={formData.ladenWeightKg} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Unladen Weight (Kg)</label>
                                <input type="number" step="0.01" name="unladenWeightKg" value={formData.unladenWeightKg} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Avg Density</label>
                                <input type="number" step="0.0001" name="avgDensity" value={formData.avgDensity} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Avg Temperature (°C)</label>
                                <input type="number" step="0.1" name="avgTemperature" value={formData.avgTemperature} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Received Strength</label>
                                <input type="number" step="0.1" name="receivedStrength" value={formData.receivedStrength} onChange={handleChange} required className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Live Results & Remarks */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className={`${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200'} p-6 rounded-2xl shadow-sm border`}>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Remarks</label>
                                <textarea
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    rows="4"
                                    className={`w-full p-4 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-700' : 'bg-gray-50 text-gray-900'}`}
                                    placeholder="Enter any transit notes or wastage explanations..."
                                ></textarea>
                            </div>

                            {/* Auto-Unload to Reg-74 */}
                            {!isEdit && (
                                <div className={`${isDark ? 'bg-indigo-950/20 border-indigo-900/40' : 'bg-indigo-50 border-indigo-200'} p-6 rounded-2xl border`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <input
                                            type="checkbox"
                                            id="autoUnload"
                                            checked={autoUnload}
                                            onChange={e => setAutoUnload(e.target.checked)}
                                            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="autoUnload" className={`text-sm font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                            ✨ Auto-create vat unload event in Reg-74
                                        </label>
                                    </div>

                                    {autoUnload && (
                                        <div className="space-y-4 pl-8 animate-in slide-in-from-top-2">
                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    Destination Vat (for unloading)
                                                </label>
                                                <select
                                                    value={unloadVatId}
                                                    onChange={e => setUnloadVatId(e.target.value)}
                                                    required={autoUnload}
                                                    className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                                                >
                                                    <option value="">Select Vat for Unloading</option>
                                                    {vats.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.vatCode} - {v.name} ({v.capacity} L)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    Final Strength After Mixing (% v/v) - Optional
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={finalStrength}
                                                    onChange={e => setFinalStrength(e.target.value)}
                                                    placeholder={`Default: ${formData.receivedStrength}% (from Reg-76)`}
                                                    className={`w-full p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-600' : 'bg-white text-gray-900'}`}
                                                />
                                                <p className="text-xs text-gray-500 mt-2 italic">
                                                    💡 Leave blank to use Reg-76 strength ({formData.receivedStrength}%).
                                                    Enter manually verified strength after mixing with existing vat spirit.
                                                </p>
                                            </div>

                                            <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-200'}`}>
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                                                    <div className="text-xs text-amber-700 dark:text-amber-400">
                                                        <strong>Important:</strong> The strength will be pre-filled from Reg-76 ({formData.receivedStrength}%),
                                                        but you should manually verify it after mixing. You can edit the Reg-74 event later to update the final strength.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isEdit && (
                                <div className={`${isDark ? 'bg-orange-950/20 border-orange-900/40' : 'bg-orange-50 border-orange-200'} p-6 rounded-2xl border`}>
                                    <label className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-orange-500' : 'text-orange-700'}`}>
                                        <AlertTriangle size={16} />
                                        Reason for Edit (Mandatory)
                                    </label>
                                    <input
                                        type="text"
                                        value={editReason}
                                        onChange={e => setEditReason(e.target.value)}
                                        placeholder="Explain why this data is being changed..."
                                        className={`w-full p-4 rounded-xl font-bold border-0 focus:ring-2 focus:ring-orange-500 transition-all ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-700' : 'bg-white text-gray-900'}`}
                                        required={isEdit}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Summary / Calculations Sidebar */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl space-y-6 h-fit">
                            <h3 className="font-bold flex items-center gap-2 text-lg border-b border-blue-400 pb-4">
                                <Calculator size={20} />
                                Receipt Summary
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-blue-100 text-xs uppercase font-medium">Net Received Mass</p>
                                    <p className="text-2xl font-bold">{formData.calcReceivedMass.toFixed(2)} Kg</p>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-xs uppercase font-medium">Calc. Bulk Liters (BL)</p>
                                    <p className="text-2xl font-bold">{formData.calcReceivedBl.toFixed(2)} L</p>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-xs uppercase font-medium">Calc. Alcoholic Liters (AL)</p>
                                    <p className="text-2xl font-bold">{formData.calcReceivedAl.toFixed(2)} AL</p>
                                </div>

                                {/* Enhanced Wastage Analysis */}
                                <div className="border-t border-blue-400 pt-4 space-y-3">
                                    <p className="text-blue-100 text-xs uppercase font-medium mb-2">Wastage Analysis</p>

                                    <div className={`p-3 rounded-lg ${formData.calcTransitWastageAl > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                                        <p className="text-blue-100 text-xs uppercase font-medium">Transit Difference</p>
                                        <p className="text-xl font-bold">{formData.calcTransitWastageAl.toFixed(2)} AL</p>
                                        <p className="text-[10px] text-blue-200 mt-1">
                                            {formData.calcTransitWastageAl > 0 ? 'Wastage detected' : formData.calcTransitWastageAl < 0 ? 'Transit Increase' : 'Exact match'}
                                        </p>
                                    </div>

                                    {formData.advisedAl > 0 && (
                                        <>
                                            <div className="bg-white/10 p-3 rounded-lg">
                                                <p className="text-xs text-blue-200">Wastage Percentage</p>
                                                <p className="text-lg font-bold">
                                                    {((formData.calcTransitWastageAl / formData.advisedAl) * 100).toFixed(2)}%
                                                </p>
                                            </div>

                                            <div className="bg-white/10 p-3 rounded-lg">
                                                <p className="text-xs text-blue-200">Allowable Limit (0.5%)</p>
                                                <p className="text-lg font-bold">
                                                    {(formData.advisedAl * 0.005).toFixed(2)} AL
                                                </p>
                                            </div>

                                            {(() => {
                                                const allowable = formData.advisedAl * 0.005;
                                                const isChargeable = formData.calcTransitWastageAl > allowable;
                                                const chargeable = Math.max(0, formData.calcTransitWastageAl - allowable);

                                                return (
                                                    <div className={`p-3 rounded-lg font-bold ${isChargeable ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                                        <p className="text-xs opacity-90">Status</p>
                                                        <p className="text-sm">
                                                            {isChargeable ? `⚠️ Chargeable: ${chargeable.toFixed(2)} AL` : '✅ Within Limits'}
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || (isEdit && !editReason)}
                                className="w-full bg-white text-blue-600 py-4 rounded-xl font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2 shadow-lg disabled:bg-blue-300 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="animate-spin" size={20} />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        <span>{isEdit ? 'Update Register' : 'Finalize & Save'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Reg76Form;
