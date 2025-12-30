import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import {
    Plus, Trash2, ExternalLink, FileSpreadsheet, ArrowLeft, Loader, Edit,
    Database, FileText, LayoutDashboard, ChevronRight, Calculator, Moon, Sun, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Registers = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [registers, setRegisters] = useState([]);
    const [viewRegister, setViewRegister] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRegister, setEditingRegister] = useState(null);
    const [loading, setLoading] = useState(false);

    // Form State for Zoho links
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');

    useEffect(() => {
        fetchRegisters();
    }, []);

    const fetchRegisters = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/registers`);
            setRegisters(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/registers`, { name: newName, url: newUrl });
            setRegisters([res.data, ...registers]);
            setShowForm(false);
            setNewName('');
            setNewUrl('');
        } catch (error) {
            console.error(error);
            alert("Error adding register link");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this reference link?")) return;
        try {
            await axios.delete(`${API_URL}/api/registers/${id}`);
            setRegisters(registers.filter(r => r.id !== id));
        } catch (error) {
            alert("Error deleting");
        }
    };

    // View Mode (Iframe for Zoho)
    if (viewRegister) {
        return (
            <div className={`flex flex-col h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-100'}`}>
                <div className={`p-4 shadow-sm flex items-center justify-between ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-white'}`}>
                    <button onClick={() => setViewRegister(null)} className={`flex items-center ${isDark ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-600 hover:text-blue-600'}`}>
                        <ArrowLeft className="mr-2" /> Back to Registers
                    </button>
                    <h1 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{viewRegister.name} (Zoho Reference)</h1>
                    <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
                    </button>
                </div>
                <div className="flex-1 p-4">
                    <iframe
                        src={viewRegister.url}
                        className={`w-full h-full border rounded shadow-lg ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}
                        title={viewRegister.name}
                    ></iframe>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-8 min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className={`p-2 rounded-full transition ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Register Engine</h1>
                        <p className={`text-sm font-bold ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Excise-compliant automated registers</p>
                    </div>
                </div>
                <button onClick={toggleTheme} className={`p-4 rounded-2xl shadow-lg transition-all ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'}`}>
                    {isDark ? <Sun size={24} /> : <Moon size={24} />}
                </button>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Excise Registers */}
                <div className="lg:col-span-2 space-y-6">
                    <div className={`rounded-[2.5rem] shadow-xl border overflow-hidden transition-all ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                        <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-blue-50/50 border-gray-100'}`}>
                            <h2 className="text-xl font-black flex items-center gap-3">
                                <Database className={isDark ? 'text-indigo-400' : 'text-blue-600'} size={28} />
                                Active Excise Registers
                            </h2>
                            <span className={`px-4 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${isDark ? 'bg-indigo-900/40 text-indigo-300' : 'bg-blue-100 text-blue-700'}`}>
                                System Generated
                            </span>
                        </div>

                        <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                            {/* Reg 76 */}
                            <div
                                onClick={() => navigate('/registers/reg76')}
                                className={`p-8 transition cursor-pointer group flex items-center justify-between ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-gray-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                        <FileText size={28} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Reg 76 – Spirit Receipt</h3>
                                        <p className="text-sm text-gray-500 font-medium">Detailed record of daily spirit receipts from distilleries</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full uppercase tracking-widest">Live</span>
                                    <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Reg 74 */}
                            <div
                                onClick={() => navigate('/registers/reg74')}
                                className={`p-8 transition cursor-pointer group flex items-center justify-between ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-gray-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                        <Calculator size={28} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Reg 74 – Blending</h3>
                                        <p className="text-sm text-gray-500 font-medium">Blending operations, spirit transfers and vat balance</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full uppercase tracking-widest">Live</span>
                                    <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Reg A */}
                            <div
                                onClick={() => navigate('/registers/reg-a')}
                                className={`p-8 transition cursor-pointer group flex items-center justify-between ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-gray-800 text-orange-400 group-hover:bg-orange-600 group-hover:text-white' : 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'}`}>
                                        <LayoutDashboard size={28} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Reg A – Production</h3>
                                        <p className="text-sm text-gray-500 font-medium">Bottling operations, finished goods and variance control</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full uppercase tracking-widest">Live</span>
                                    <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Reg B */}
                            <div
                                onClick={() => navigate('/registers/reg-b')}
                                className={`p-8 transition cursor-pointer group flex items-center justify-between ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-gray-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-gray-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                        <Database size={28} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Reg B – Inventory</h3>
                                        <p className="text-sm text-gray-500 font-medium">Issue of Country Liquor, daily inventory & fees</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full uppercase tracking-widest">Live</span>
                                    <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Reg 78 - Consolidated */}
                            <div
                                onClick={() => navigate('/registers/reg78')}
                                className={`p-8 transition cursor-pointer group flex items-center justify-between ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-gray-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-gray-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                        <FileSpreadsheet size={28} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Reg 78 – Consolidated</h3>
                                        <p className="text-sm text-gray-500 font-medium tracking-tight">Master Distillery Spirit Account & Consolidation</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full uppercase tracking-widest">Live</span>
                                    <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Excise Duty Register */}
                            <div
                                onClick={() => navigate('/registers/excise-duty')}
                                className={`p-8 transition cursor-pointer group flex items-center justify-between ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-gray-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-gray-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                        <Calculator size={28} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Excise Duty Register</h3>
                                        <p className="text-sm text-gray-500 font-medium tracking-tight">Personal Ledger Account (PLA) for Duty Payments</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full uppercase tracking-widest">New</span>
                                    <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Daily Handbook */}
                            <div
                                onClick={() => navigate('/registers/daily-handbook')}
                                className={`p-8 transition cursor-pointer group flex items-center justify-between ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-gray-800 text-purple-400 group-hover:bg-purple-600 group-hover:text-white' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'}`}>
                                        <ClipboardList size={28} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Daily Handbook</h3>
                                        <p className="text-sm text-gray-500 font-medium tracking-tight">Consolidated Operations Dashboard & Compliance</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full uppercase tracking-widest">New</span>
                                    <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Production Fees Register */}
                            <div
                                onClick={() => navigate('/registers/production-fees')}
                                className={`p-8 transition cursor-pointer group flex items-center justify-between ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl transition-all ${isDark ? 'bg-indigo-900/40 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white'}`}>
                                        <Calculator size={28} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Production Fees Register</h3>
                                        <p className="text-sm text-gray-500 font-medium tracking-tight">Bottling Fees Account & PLA tracking (₹3/BL)</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full uppercase tracking-widest">New</span>
                                    <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Zoho Reference Links */}
                <div className="space-y-6">
                    <div className={`rounded-[2.5rem] shadow-xl border overflow-hidden transition-all ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                        <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'bg-gray-800/80 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                            <h2 className="text-lg font-black flex items-center gap-3 tracking-tight">
                                <ExternalLink size={20} className="text-blue-500" />
                                Reference Links
                            </h2>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className={`p-2 rounded-xl transition ${isDark ? 'bg-gray-800 text-indigo-400 hover:bg-indigo-600 hover:text-white' : 'bg-white border border-gray-200 text-blue-600 hover:bg-blue-50'}`}
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {showForm && (
                            <div className={`p-8 border-b ${isDark ? 'bg-gray-800/20 border-gray-800' : 'bg-blue-50/30 border-gray-100'}`}>
                                <form onSubmit={handleAdd} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        className={`w-full p-4 text-sm rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-white'}`}
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="url"
                                        placeholder="URL"
                                        className={`w-full p-4 text-sm rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-white'}`}
                                        value={newUrl}
                                        onChange={e => setNewUrl(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-indigo-600 text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 disabled:bg-gray-400 transition-all shadow-lg"
                                    >
                                        {loading ? 'Saving...' : 'Add Reference'}
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className="max-h-[600px] overflow-y-auto">
                            {registers.length > 0 ? (
                                <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                                    {registers.map(reg => (
                                        <div key={reg.id} className={`p-6 transition flex items-center justify-between group ${isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'}`}>
                                            <div
                                                className="flex-1 cursor-pointer"
                                                onClick={() => setViewRegister(reg)}
                                            >
                                                <h4 className={`text-sm font-black transition-colors ${isDark ? 'text-gray-200 group-hover:text-indigo-400' : 'text-gray-800 group-hover:text-blue-600'}`}>{reg.name}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold truncate w-48 mt-1">{reg.url}</p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(reg.id, e)}
                                                className="p-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-16 text-center text-gray-400 font-bold italic">
                                    No reference links found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Registers;
