import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Plus, Trash2, ExternalLink, FileSpreadsheet, ArrowLeft, Loader, Edit,
    Database, FileText, LayoutDashboard, ChevronRight, Calculator
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Registers = () => {
    const navigate = useNavigate();
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
            <div className="flex flex-col h-screen bg-gray-100">
                <div className="bg-white p-4 shadow-sm flex items-center justify-between">
                    <button onClick={() => setViewRegister(null)} className="flex items-center text-gray-600 hover:text-blue-600">
                        <ArrowLeft className="mr-2" /> Back to Registers
                    </button>
                    <h1 className="font-bold text-lg text-gray-800">{viewRegister.name} (Zoho Reference)</h1>
                    <div className="w-24"></div>
                </div>
                <div className="flex-1 p-4">
                    <iframe
                        src={viewRegister.url}
                        className="w-full h-full border rounded shadow-lg bg-white"
                        title={viewRegister.name}
                    ></iframe>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Register Engine</h1>
                        <p className="text-gray-500">Excise-compliant automated registers</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Excise Registers */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Database className="text-blue-600" size={24} />
                                Active Excise Registers
                            </h2>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                                System Generated
                            </span>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {/* Reg 76 */}
                            <div
                                onClick={() => navigate('/registers/reg76')}
                                className="p-6 hover:bg-gray-50 transition cursor-pointer group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600">Reg 76 – Spirit Receipt</h3>
                                        <p className="text-sm text-gray-500">Detailed record of daily spirit receipts from distilleries</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Live</span>
                                    <ChevronRight className="text-gray-300 group-hover:text-blue-600" />
                                </div>
                            </div>

                            {/* Reg 74 */}
                            <div
                                onClick={() => navigate('/registers/reg74')}
                                className="p-6 hover:bg-gray-50 transition cursor-pointer group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Calculator size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600">Reg 74 – Blending</h3>
                                        <p className="text-sm text-gray-500">Blending operations, spirit transfers and vat balance</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Live</span>
                                    <ChevronRight className="text-gray-300 group-hover:text-indigo-600" />
                                </div>
                            </div>

                            {/* Reg A */}
                            <div
                                onClick={() => navigate('/registers/reg-a')}
                                className="p-6 hover:bg-gray-50 transition cursor-pointer group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                        <LayoutDashboard size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-600">Reg A – Production</h3>
                                        <p className="text-sm text-gray-500">Bottling operations, finished goods and variance control</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">Live</span>
                                    <ChevronRight className="text-gray-300 group-hover:text-orange-600" />
                                </div>
                            </div>

                            {/* Reg 78 - Future */}
                            <div className="p-6 opacity-60 cursor-not-allowed flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 text-gray-400 rounded-xl">
                                        <FileSpreadsheet size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">Reg 78 – Consolidated</h3>
                                        <p className="text-sm text-gray-500">Consolidated monthly spirit and production summary (Coming Soon)</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-1 rounded">PLANNED</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Zoho Reference Links */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                <ExternalLink size={20} />
                                Reference Links (Zoho)
                            </h2>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="p-1 hover:bg-blue-50 text-blue-600 rounded transition"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {showForm && (
                            <div className="p-6 bg-blue-50/50 border-b border-gray-100">
                                <form onSubmit={handleAdd} className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        className="w-full p-2 text-sm border rounded"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="url"
                                        placeholder="URL"
                                        className="w-full p-2 text-sm border rounded"
                                        value={newUrl}
                                        onChange={e => setNewUrl(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700 disabled:bg-blue-300"
                                    >
                                        {loading ? 'Saving...' : 'Add Link'}
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className="max-h-[500px] overflow-y-auto">
                            {registers.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {registers.map(reg => (
                                        <div key={reg.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group">
                                            <div
                                                className="flex-1 cursor-pointer"
                                                onClick={() => setViewRegister(reg)}
                                            >
                                                <h4 className="text-sm font-bold text-gray-800 group-hover:text-blue-600">{reg.name}</h4>
                                                <p className="text-[10px] text-gray-400 truncate w-48">{reg.url}</p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(reg.id, e)}
                                                className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-400 text-sm">
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
