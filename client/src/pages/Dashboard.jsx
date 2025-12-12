import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { API_URL } from '../config';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ documents: 0, registers: 0 });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            navigate('/login');
        } else {
            setUser(JSON.parse(userData));
        }

        // Fetch stats
        axios.get(`${API_URL}/api/dashboard/stats`)
            .then(res => setStats(res.data))
            .catch(err => console.error(err));

    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar Placeholder */}
            <aside className="w-64 bg-blue-900 text-white p-6 hidden md:block">
                <h2 className="text-2xl font-bold mb-8">SIP2LIFE</h2>
                <nav className="space-y-4">
                    <a href="/dashboard" className="block p-2 bg-blue-800 rounded">Dashboard</a>
                    <a href="/registers" className="block p-2 hover:bg-blue-800 rounded opacity-70">Registers</a>
                    <a href="/documents" className="block p-2 hover:bg-blue-800 rounded opacity-70">Documents</a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.name}</h1>
                    <button onClick={handleLogout} className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50">
                        Logout
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded shadow flex items-center gap-4">
                        <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                            <FileText size={32} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-500">Total Documents</h3>
                            <p className="text-3xl font-bold text-blue-600">{stats.documents}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded shadow flex items-center gap-4">
                        <div className="p-4 bg-green-100 rounded-full text-green-600">
                            <FileSpreadsheet size={32} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-500">Live Registers</h3>
                            <p className="text-3xl font-bold text-green-600">{stats.registers}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
