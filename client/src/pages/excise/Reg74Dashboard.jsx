import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ArrowLeft, Calculator, Database, Plus, Eye,
    ArrowUpRight, ArrowDownLeft, CheckCircle, Clock, AlertCircle, RefreshCw, Layers
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
            case 'IDLE': return 'bg-gray-100 text-gray-500 border-gray-200';
            case 'FILLING': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'BLENDING': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'READY': return 'bg-green-50 text-green-600 border-green-200';
            case 'EMPTYING': return 'bg-orange-50 text-orange-600 border-orange-200';
            default: return 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    const sstVats = vats.filter(v => v.vatType === 'SST');
    const brtVats = vats.filter(v => v.vatType === 'BRT');

    const VatCard = ({ vat }) => (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gradient-to-br from-white to-gray-50">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${vat.status === 'IDLE' ? 'bg-gray-300' : 'bg-green-500'}`}></span>
                        <h3 className="text-2xl font-black text-gray-800 tracking-tight">{vat.vatCode}</h3>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Capacity: {vat.capacityBl?.toLocaleString()} BL</p>
                </div>
                <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusStyles(vat.status)}`}>
                        {vat.status}
                    </span>
                    <div className="mt-3">
                        <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Live Balance</div>
                        <div className="text-lg font-black text-blue-600 leading-none">{vat.balanceBl?.toFixed(2)} <span className="text-[10px] text-blue-300">BL</span></div>
                        <div className="text-xs font-bold text-gray-400">{vat.balanceAl?.toFixed(2)} <span className="text-[10px]">AL</span></div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-50/30 grid grid-cols-2 gap-2">
                <button onClick={() => handleAddEvent(vat, 'OPENING')} className="p-2 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm text-[10px] font-black uppercase">
                    <Clock size={14} className="text-blue-500" /> Opening
                </button>
                <button onClick={() => handleAddEvent(vat, vat.vatType === 'SST' ? 'UNLOADING' : 'RECEIPT')} className="p-2 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm text-[10px] font-black uppercase">
                    <ArrowDownLeft size={14} className="text-green-500" /> {vat.vatType === 'SST' ? 'Unload' : 'Receipt'}
                </button>
                <button onClick={() => handleAddEvent(vat, 'INTERNAL_TRANSFER')} className="p-2 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm text-[10px] font-black uppercase">
                    <RefreshCw size={14} className="text-indigo-500" /> Transfer
                </button>
                <button onClick={() => handleAddEvent(vat, 'ADJUSTMENT')} className="p-2 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm text-[10px] font-black uppercase">
                    <AlertCircle size={14} className="text-orange-500" /> Adjust
                </button>
                {vat.vatType === 'BRT' && (
                    <button onClick={() => handleAddEvent(vat, 'PRODUCTION')} className="p-2 bg-white border border-gray-100 rounded-xl hover:border-purple-500 hover:text-purple-600 transition-all flex items-center gap-2 shadow-sm text-[10px] font-black uppercase col-span-1">
                        <Layers size={14} className="text-purple-500" /> Production
                    </button>
                )}
                <button onClick={() => handleAddEvent(vat, 'CLOSING')} className={`p-2 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm text-[10px] font-black uppercase ${vat.vatType === 'SST' ? '' : ''}`}>
                    <Clock size={14} className="text-gray-500" /> Closing
                </button>
            </div>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={() => navigate(`/registers/reg74/register/${vat.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                    <Eye size={16} /> View Register 74
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-8 min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/registers')} className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition text-gray-500 hover:text-blue-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reg 74 Control Centre</h1>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">SST & BRT Operational Terminal</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 px-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Spirit</span>
                            <span className="text-sm font-black text-blue-600">{vats.reduce((sum, v) => sum + (v.balanceBl || 0), 0).toLocaleString()} <span className="text-[10px]">BL</span></span>
                        </div>
                        <div className="w-px h-8 bg-gray-100"></div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Avg Strength</span>
                            <span className="text-sm font-black text-gray-800">
                                {(() => {
                                    const totalBl = vats.reduce((sum, v) => sum + (v.balanceBl || 0), 0);
                                    const totalAl = vats.reduce((sum, v) => sum + (v.balanceAl || 0), 0);
                                    return totalBl > 0 ? (totalAl / totalBl * 100).toFixed(2) : '0.00';
                                })()}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                    <RefreshCw className="animate-spin text-blue-600" size={48} />
                    <p className="font-black text-gray-400 uppercase text-xs tracking-widest">Synchronizing Vat Balances...</p>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto space-y-12">
                    {/* SST Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Database size={20} /></div>
                            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Spirit Storage Vats (SST)</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                            {sstVats.map(vat => <VatCard key={vat.id} vat={vat} />)}
                        </div>
                    </div>

                    {/* BRT Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Calculator size={20} /></div>
                            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Blending & Receipt Vats (BRT)</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                            {brtVats.map(vat => <VatCard key={vat.id} vat={vat} />)}
                        </div>
                    </div>
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
