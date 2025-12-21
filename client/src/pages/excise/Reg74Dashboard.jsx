import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ArrowLeft, Calculator, Database, Plus, Eye,
    ArrowUpRight, ArrowDownLeft, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import Reg74EventModal from './Reg74EventModal';

const Reg74Dashboard = () => {
    const navigate = useNavigate();
    const [vats, setVats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedVat, setSelectedVat] = useState(null);
    const [eventType, setEventType] = useState('OPENING');

    useEffect(() => {
        fetchVats();
    }, []);

    const fetchVats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/reg74/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVats(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = (vat, type) => {
        setSelectedVat(vat);
        setEventType(type);
        setShowModal(true);
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'IDLE': return 'bg-gray-100 text-gray-600';
            case 'FILLING': return 'bg-blue-100 text-blue-600';
            case 'BLENDING': return 'bg-purple-100 text-purple-600';
            case 'READY': return 'bg-green-100 text-green-600';
            case 'EMPTYING': return 'bg-orange-100 text-orange-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/registers')} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Reg 74 – Blending Operations</h1>
                        <p className="text-gray-500">Manage spirit receipts, blending and production issues</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center">Loading Blending Vats...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vats.map(vat => (
                        <div key={vat.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">{vat.vatCode}</h3>
                                    <p className="text-sm text-gray-500">Capacity: {vat.capacityBl} BL</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusStyles(vat.status)}`}>
                                        {vat.status}
                                    </span>
                                    <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase">Live Balance</div>
                                    <div className="text-sm font-bold text-blue-600">{vat.balanceBl?.toFixed(2)} BL</div>
                                    <div className="text-xs font-medium text-gray-400">{vat.balanceAl?.toFixed(2)} AL</div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50/50 grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handleAddEvent(vat, 'OPENING')}
                                    className="flex flex-col items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition text-[10px] font-bold uppercase"
                                >
                                    <Clock size={16} /> Opening
                                </button>
                                <button
                                    onClick={() => handleAddEvent(vat, 'RECEIPT')}
                                    className="flex flex-col items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition text-[10px] font-bold uppercase"
                                >
                                    <ArrowDownLeft size={16} /> Receipt
                                </button>
                                <button
                                    onClick={() => handleAddEvent(vat, 'QC')}
                                    className="flex flex-col items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition text-[10px] font-bold uppercase"
                                >
                                    <CheckCircle size={16} /> QC Pass
                                </button>
                                <button
                                    onClick={() => handleAddEvent(vat, 'ISSUE')}
                                    className="flex flex-col items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition text-[10px] font-bold uppercase"
                                >
                                    <ArrowUpRight size={16} /> Issue
                                </button>
                                <button
                                    onClick={() => handleAddEvent(vat, 'ADJUSTMENT')}
                                    className="flex flex-col items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition text-[10px] font-bold uppercase"
                                >
                                    <AlertCircle size={16} /> Adjust
                                </button>
                                <button
                                    onClick={() => handleAddEvent(vat, 'CLOSING')}
                                    className="flex flex-col items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition text-[10px] font-bold uppercase"
                                >
                                    <Clock size={16} /> Closing
                                </button>
                            </div>

                            <div className="p-4 border-t border-gray-100">
                                <button
                                    onClick={() => navigate(`/registers/reg74/register/${vat.id}`)}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm"
                                >
                                    <Eye size={18} /> View Register 74
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <Reg74EventModal
                    vat={selectedVat}
                    type={eventType}
                    onClose={() => {
                        setShowModal(false);
                        fetchVats();
                    }}
                />
            )}
        </div>
    );
};

export default Reg74Dashboard;
