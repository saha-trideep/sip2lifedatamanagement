import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, ExternalLink, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';

const Registers = () => {
    const [registers, setRegisters] = useState([]);
    const [viewRegister, setViewRegister] = useState(null); // If set, we are viewing this register
    const [showForm, setShowForm] = useState(false);

    // Form State
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
        try {
            const res = await axios.post(`${API_URL}/api/registers`, { name: newName, url: newUrl });
            setRegisters([res.data, ...registers]);
            setShowForm(false);
            setNewName('');
            setNewUrl('');
        } catch (error) {
            console.error(error);
            alert("Error adding register: " + (error.response?.data?.details || error.message));
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this register link?")) return;
        try {
            await axios.delete(`${API_URL}/api/registers/${id}`);
            const updated = registers.filter(r => r.id !== id);
            setRegisters(updated);
            if (viewRegister && viewRegister.id === id) {
                setViewRegister(null);
            }
        } catch (error) {
            alert("Error deleting");
        }
    };

    // View Mode (Iframe)
    if (viewRegister) {
        return (
            <div className="flex flex-col h-screen bg-gray-100">
                <div className="bg-white p-4 shadow-sm flex items-center justify-between">
                    <button onClick={() => setViewRegister(null)} className="flex items-center text-gray-600 hover:text-blue-600">
                        <ArrowLeft className="mr-2" /> Back to List
                    </button>
                    <h1 className="font-bold text-lg text-gray-800">{viewRegister.name}</h1>
                    <div className="w-24"></div> {/* Spacer for center alignment */}
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

    // List Mode
    return (
        <div className="p-8 min-h-screen bg-gray-50">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <a href="/dashboard" className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition text-gray-600">
                        <ArrowLeft size={20} />
                    </a>
                    <h1 className="text-3xl font-bold text-gray-800">Shop Registers</h1>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    <Plus size={20} /> Add Live Link
                </button>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-blue-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Add New Register Sheet</h3>
                    <form onSubmit={handleAdd} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Spirit Transaction"
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex-[2]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Zoho Publish URL</label>
                            <input
                                type="url"
                                placeholder="https://sheet.zohopublic.in/..."
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                value={newUrl}
                                onChange={e => setNewUrl(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 h-10">Save</button>
                    </form>
                </div>
            )}

            {/* Grid of Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registers.map(reg => (
                    <div
                        key={reg.id}
                        onClick={() => setViewRegister(reg)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer group hover:border-blue-300"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                <FileSpreadsheet size={24} />
                            </div>
                            <button
                                onClick={(e) => handleDelete(reg.id, e)}
                                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">{reg.name}</h3>
                        <p className="text-gray-500 text-sm flex items-center gap-1">
                            Click to view live sheet <ExternalLink size={12} />
                        </p>
                    </div>
                ))}

                {registers.length === 0 && !showForm && (
                    <div className="col-span-full text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No registers found.</p>
                        <p className="text-sm">Click "Add Live Link" to start.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Registers;
