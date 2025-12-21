import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ArrowLeft, Save, Loader, Calculator, Calendar, Truck,
    Droplets, Scale, Info, AlertTriangle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../config';
import { format } from 'date-fns';

const Reg76Form = () => {
    const navigate = useNavigate();
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

    useEffect(() => {
        fetchVats();
        if (isEdit) fetchEntry();
    }, [id]);

    const fetchVats = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/excise/vats`);
            setVats(res.data);
            if (!isEdit && res.data.length > 0) {
                setFormData(prev => ({ ...prev, storageVat: res.data[0].name }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEntry = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/excise/reg76`);
            const entry = res.data.find(e => e.id === parseInt(id));
            if (entry) {
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
            if (isEdit) {
                await axios.put(`${API_URL}/api/excise/reg76/${id}`, {
                    newData: formData,
                    reason: editReason
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Reg-76 Entry updated successfully!");
            } else {
                await axios.post(`${API_URL}/api/excise/reg76`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Reg-76 Entry saved successfully!");
            }
            navigate('/registers/reg76');
        } catch (error) {
            console.error(error);
            alert("Error saving entry: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-10 text-center text-gray-400">Loading entry details...</div>;

    return (
        <div className="p-8 min-h-screen bg-gray-50 flex justify-center">
            <div className="max-w-5xl w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/registers/reg76')} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition text-gray-600">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{isEdit ? 'Edit' : 'New'} Reg-76 Entry</h1>
                            <p className="text-gray-500">Excise Spirit Receipt Register</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 pb-20">

                    {/* Section 1: Permit & Identification */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2 font-bold text-gray-700">
                            <Truck size={18} className="text-blue-600" />
                            1. Transit & Permit Details
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Receipt Date (System)</label>
                                <input type="date" name="receiptDate" value={formData.receiptDate} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Arrival Date (Physical)</label>
                                <input type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Storage Vat</label>
                                <select name="storageVat" value={formData.storageVat} onChange={handleChange} required className="w-full p-2 border rounded-lg">
                                    <option value="">Select Vat</option>
                                    {vats.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Permit No</label>
                                <input type="text" name="permitNo" value={formData.permitNo} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Permit Date</label>
                                <input type="date" name="permitDate" value={formData.permitDate} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Exporting Distillery</label>
                                <input type="text" name="exportingDistillery" value={formData.exportingDistillery} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Invoice No</label>
                                <input type="text" name="invoiceNo" value={formData.invoiceNo} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Invoice Date</label>
                                <input type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Vehicle No</label>
                                <input type="text" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Dispatch (Advised) Data */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2 font-bold text-gray-700">
                            <Info size={18} className="text-blue-600" />
                            2. Advised Data (From Permit/Invoice)
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nature of Spirit</label>
                                <select name="natureOfSpirit" value={formData.natureOfSpirit} onChange={handleChange} className="w-full p-2 border rounded-lg">
                                    <option value="GENA">GENA</option>
                                    <option value="ENA">ENA</option>
                                    <option value="RS">RS</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Advised BL</label>
                                <input type="number" step="0.01" name="advisedBl" value={formData.advisedBl} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Advised AL</label>
                                <input type="number" step="0.01" name="advisedAl" value={formData.advisedAl} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Advised Strength</label>
                                <input type="number" step="0.1" name="advisedStrength" value={formData.advisedStrength} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="md:col-start-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Advised Mass (Kg)</label>
                                <input type="number" step="0.01" name="advisedMassKg" value={formData.advisedMassKg} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Receipt Measurement */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2 font-bold text-gray-700">
                            <Scale size={18} className="text-blue-600" />
                            3. Physical Receipt Measurement
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Laden Weight (Kg)</label>
                                <input type="number" step="0.01" name="ladenWeightKg" value={formData.ladenWeightKg} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Unladen Weight (Kg)</label>
                                <input type="number" step="0.01" name="unladenWeightKg" value={formData.unladenWeightKg} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Avg Density</label>
                                <input type="number" step="0.0001" name="avgDensity" value={formData.avgDensity} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Received Strength</label>
                                <input type="number" step="0.1" name="receivedStrength" value={formData.receivedStrength} onChange={handleChange} required className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Live Results & Remarks */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Remarks</label>
                                <textarea
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    rows="4"
                                    className="w-full p-3 border rounded-lg text-sm"
                                    placeholder="Enter any transit notes or wastage explanations..."
                                ></textarea>
                            </div>

                            {isEdit && (
                                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
                                    <label className="flex items-center gap-2 text-xs font-bold text-orange-700 mb-2 uppercase">
                                        <AlertTriangle size={16} />
                                        Reason for Edit (Mandatory)
                                    </label>
                                    <input
                                        type="text"
                                        value={editReason}
                                        onChange={e => setEditReason(e.target.value)}
                                        placeholder="Explain why this data is being changed..."
                                        className="w-full p-3 border border-orange-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500"
                                        required={isEdit}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Summary / Calculations Sidebar */}
                        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl space-y-6 h-fit">
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
                                <div className={`p-3 rounded-lg ${formData.calcTransitWastageAl > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                                    <p className="text-blue-100 text-xs uppercase font-medium">Transit Difference</p>
                                    <p className="text-xl font-bold">{formData.calcTransitWastageAl.toFixed(2)} AL</p>
                                    <p className="text-[10px] text-blue-200 mt-1">
                                        {formData.calcTransitWastageAl > 0 ? 'Wastage detected' : 'Transit Increase/Exact'}
                                    </p>
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
