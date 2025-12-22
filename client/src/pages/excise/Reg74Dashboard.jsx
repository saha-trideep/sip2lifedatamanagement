import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ArrowLeft, Calculator, Database, Plus, Eye,
    ArrowUpRight, ArrowDownLeft, CheckCircle, Clock, AlertCircle, RefreshCw, Layers, Package, FlaskConical, Moon, Sun, ShieldCheck
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../../config';
import Reg74EventModal from './Reg74EventModal';
import ManualBatchModal from './ManualBatchModal';
import StorageAuditModal from './StorageAuditModal';
import { useTheme } from '../../context/ThemeContext';

const Reg74Dashboard = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [vats, setVats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedVat, setSelectedVat] = useState(null);
    const [eventType, setEventType] = useState('OPENING');
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);

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
            case 'IDLE': return isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200';
            case 'FILLING': return isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200';
            case 'BLENDING': return isDark ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-600 border-purple-200';
            case 'READY': return isDark ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-50 text-green-600 border-green-200';
            case 'EMPTYING': return isDark ? 'bg-orange-900/30 text-orange-400 border-orange-800' : 'bg-orange-50 text-orange-600 border-orange-200';
            default: return isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    const sstVats = vats.filter(v => v.vatType === 'SST');
    const brtVats = vats.filter(v => v.vatType === 'BRT');

    const VatCard = ({ vat }) => (
        <div className={`rounded-[2rem] shadow-sm border overflow-hidden hover:shadow-xl transition-all duration-300 group ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className={`p-6 border-b flex justify-between items-start ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'}`}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${vat.status === 'IDLE' ? 'bg-gray-500' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></span>
                        <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>{vat.vatCode}</h3>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Capacity: {vat.capacityBl?.toLocaleString()} BL</p>
                </div>
                <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusStyles(vat.status)}`}>
                        {vat.status}
                    </span>
                    <div className="mt-3">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Live Balance</div>
                        <div className={`text-lg font-black leading-none ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{vat.balanceBl?.toFixed(2)} <span className="text-[10px]">BL</span></div>
                        <div className="text-xs font-bold text-gray-500">{vat.balanceAl?.toFixed(2)} <span className="text-[10px]">AL</span></div>
                    </div>
                </div>
            </div>

            <div className={`p-4 grid grid-cols-2 gap-2 ${isDark ? 'bg-black/20' : 'bg-gray-50/30'}`}>
                {[
                    { type: 'OPENING', label: 'Opening', icon: Clock, iconCol: 'text-blue-500' },
                    { type: vat.vatType === 'SST' ? 'UNLOADING' : 'RECEIPT', label: vat.vatType === 'SST' ? 'Unload' : 'Receipt', icon: ArrowDownLeft, iconCol: 'text-green-500' },
                    { type: 'INTERNAL_TRANSFER', label: 'Transfer', icon: RefreshCw, iconCol: 'text-indigo-500' },
                    { type: 'ADJUSTMENT', label: 'Adjust', icon: AlertCircle, iconCol: 'text-orange-500' },
                    ...(vat.vatType === 'BRT' ? [{ type: 'PRODUCTION', label: 'Production', icon: Layers, iconCol: 'text-purple-500' }] : []),
                    { type: 'CLOSING', label: 'Closing', icon: Clock, iconCol: 'text-gray-500' }
                ].map((act, i) => (
                    <button key={i} onClick={() => handleAddEvent(vat, act.type)} className={`p-2 border rounded-xl transition-all flex items-center gap-2 shadow-sm text-[10px] font-black uppercase ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-indigo-500 hover:text-indigo-400' : 'bg-white border-gray-100 hover:border-blue-500 hover:text-blue-600'}`}>
                        <act.icon size={14} className={act.iconCol} /> {act.label}
                    </button>
                ))}
                <button
                    onClick={() => { setSelectedVat(vat); setShowAuditModal(true); }}
                    className={`col-span-2 p-2 mt-2 border-2 border-dashed rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase ${isDark ? 'border-orange-900/40 text-orange-400 hover:bg-orange-900/20' : 'border-orange-100 text-orange-600 hover:bg-orange-50'}`}
                >
                    <ShieldCheck size={14} /> Stock Audit (0.3% Rule)
                </button>
            </div>

            <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <button
                    onClick={() => navigate(`/registers/reg74/register/${vat.id}`)}
                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-[1.25rem] font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-900 text-white hover:bg-blue-600'}`}
                >
                    <Eye size={16} /> View Register 74
                </button>
            </div>
        </div>
    );

    return (
        <div className={`p-8 min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-[#F8FAFC]'}`}>
            {/* Header */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/registers')} className={`p-4 rounded-3xl shadow-sm border transition ${isDark ? 'bg-gray-900 border-gray-800 text-gray-500 hover:text-indigo-400' : 'bg-white border-gray-100 text-gray-500 hover:text-blue-600'}`}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Reg 74 Control Centre</h1>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">SST & BRT Operational Terminal</p>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <button onClick={() => setShowBatchModal(true)} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-900 text-white hover:bg-black'}`}>
                        <Plus size={20} /> New Blending Batch
                    </button>
                    <button onClick={toggleTheme} className={`p-4 rounded-3xl shadow-sm border transition ${isDark ? 'bg-gray-900 border-gray-800 text-yellow-400' : 'bg-white border-gray-100 text-gray-600'}`}>
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <div className={`p-2 rounded-2xl border shadow-sm flex items-center gap-6 px-6 overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isDark ? 'bg-orange-900/20 text-orange-400' : 'bg-orange-50 text-orange-600'}`}><AlertCircle size={20} /></div>
                            <div>
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Excise Limit (0.3%)</span>
                                <span className={`text-sm font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                    {(() => {
                                        const totalAl = vats.reduce((sum, v) => sum + (v.balanceAl || 0), 0);
                                        return (totalAl * 0.003).toFixed(2);
                                    })()} <span className="text-[10px]">AL</span>
                                </span>
                            </div>
                        </div>
                        <div className={`w-px h-8 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Total Spirit</span>
                            <span className={`text-sm font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{vats.reduce((sum, v) => sum + (v.balanceBl || 0), 0).toLocaleString()} <span className="text-[10px]">BL</span></span>
                        </div>
                        <div className={`w-px h-8 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">SST Avg Str</span>
                            <span className={`text-sm font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                {(() => {
                                    const filtered = vats.filter(v => v.vatType === 'SST');
                                    const bl = filtered.reduce((s, v) => s + (v.balanceBl || 0), 0);
                                    const al = filtered.reduce((s, v) => s + (v.balanceAl || 0), 0);
                                    return bl > 0 ? (al / bl * 100).toFixed(2) : '0.00';
                                })()}%
                            </span>
                        </div>
                        <div className={`w-px h-8 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">BRT Avg Str</span>
                            <span className={`text-sm font-black ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                {(() => {
                                    const filtered = vats.filter(v => v.vatType === 'BRT');
                                    const bl = filtered.reduce((s, v) => s + (v.balanceBl || 0), 0);
                                    const al = filtered.reduce((s, v) => s + (v.balanceAl || 0), 0);
                                    return bl > 0 ? (al / bl * 100).toFixed(2) : '0.00';
                                })()}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                    <RefreshCw className={`animate-spin ${isDark ? 'text-indigo-500' : 'text-blue-600'}`} size={48} />
                    <p className="font-black text-gray-500 uppercase text-xs tracking-widest">Synchronizing Vat Balances...</p>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto space-y-12">
                    {/* SST Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}><Database size={20} /></div>
                            <h2 className={`text-xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>Spirit Storage Vats (SST)</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {sstVats.map(vat => <VatCard key={vat.id} vat={vat} />)}
                        </div>
                    </div>

                    {/* BRT Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}><FlaskConical size={20} /></div>
                            <h2 className={`text-xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>Blending & Reduction Tanks (BRT)</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

            {showBatchModal && (
                <ManualBatchModal
                    onClose={() => setShowBatchModal(false)}
                    onSuccess={fetchVats}
                />
            )}

            {showAuditModal && (
                <StorageAuditModal
                    vat={selectedVat}
                    onClose={() => setShowAuditModal(false)}
                    onSuccess={fetchVats}
                />
            )}
        </div>
    );
};

export default Reg74Dashboard;
