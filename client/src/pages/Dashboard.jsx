import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, FileSpreadsheet, LogOut, Moon, Sun, Menu, X, Home, FolderOpen, FileText as FileIcon } from 'lucide-react';
import { API_URL } from '../config';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        documents: 0,
        registers: 0,
        departmentCounts: [],
        registerList: []
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isDark, toggleTheme } = useTheme();

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

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Registers', path: '/registers', icon: FileSpreadsheet },
        { name: 'Documents', path: '/documents', icon: FileIcon }
    ];

    return (
        <div className={`flex min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-blue-50'} transition-colors duration-300`}>
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                w-64 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                border-r transition-all duration-300 transform
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo & Close Button */}
                    <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                        <h2 className={`text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                            SIP2LIFE
                        </h2>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <X size={20} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = window.location.pathname === item.path;
                            return (
                                <a
                                    key={item.path}
                                    href={item.path}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                                        ${isActive
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                            : isDark
                                                ? 'text-gray-300 hover:bg-gray-700'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.name}</span>
                                </a>
                            );
                        })}
                    </nav>

                    {/* Theme Toggle & User Info */}
                    <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} space-y-3`}>
                        <button
                            onClick={toggleTheme}
                            className={`
                                w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all
                                ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}
                            `}
                        >
                            <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                {isDark ? 'Dark Mode' : 'Light Mode'}
                            </span>
                            {isDark ? <Moon size={20} className="text-blue-400" /> : <Sun size={20} className="text-yellow-500" />}
                        </button>

                        <div className={`px-4 py-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{user.name}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 sm:px-6 py-4 sticky top-0 z-30`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <Menu size={24} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
                            </button>
                            <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                Welcome, {user.name}
                            </h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm sm:text-base"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {/* Documents Card */}
                            <div className={`
                                ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                                p-6 rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 hover:-translate-y-1
                            `}>
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                                        <FileText size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Total Documents
                                        </h3>
                                        <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {stats.documents}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Registers Card */}
                            <div className={`
                                ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                                p-6 rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 hover:-translate-y-1
                            `}>
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                                        <FileSpreadsheet size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Live Registers
                                        </h3>
                                        <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {stats.registers}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions Card */}
                            <div className={`
                                ${isDark ? 'bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'} 
                                p-6 rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 hover:-translate-y-1
                            `}>
                                <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Quick Actions
                                </h3>
                                <div className="space-y-2">
                                    <a
                                        href="/documents"
                                        className={`
                                            block px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                            ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-white hover:bg-gray-50 text-gray-700'}
                                        `}
                                    >
                                        Upload Document
                                    </a>
                                    <a
                                        href="/registers"
                                        className={`
                                            block px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                            ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-white hover:bg-gray-50 text-gray-700'}
                                        `}
                                    >
                                        Add Register
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Department Breakdown */}
                        {stats.departmentCounts && stats.departmentCounts.length > 0 && (
                            <div className={`
                                ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                                p-6 rounded-2xl shadow-lg border mt-6
                            `}>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Documents by Department
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {stats.departmentCounts.map((dept, idx) => (
                                        <div
                                            key={idx}
                                            className={`
                                                p-4 rounded-xl transition-all hover:scale-105
                                                ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}
                                            `}
                                        >
                                            <div className={`text-2xl font-bold mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                                {dept.count}
                                            </div>
                                            <div className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {dept.department}
                                            </div>
                                            {dept.latestDescription && (
                                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`} title={dept.latestDescription}>
                                                    Latest: {dept.latestDescription}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Register List */}
                        {stats.registerList && stats.registerList.length > 0 && (
                            <div className={`
                                ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                                p-6 rounded-2xl shadow-lg border mt-6
                            `}>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Recent Registers
                                </h3>
                                <div className="space-y-2">
                                    {stats.registerList.map((register) => (
                                        <div
                                            key={register.id}
                                            className={`
                                                flex items-center justify-between p-3 rounded-lg transition-colors
                                                ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-green-400' : 'bg-green-500'}`}></div>
                                                <span className={`font-medium text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                                    {register.name}
                                                </span>
                                            </div>
                                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {new Date(register.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <a
                                    href="/registers"
                                    className={`
                                        block mt-4 text-center py-2 rounded-lg text-sm font-medium transition-colors
                                        ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}
                                    `}
                                >
                                    View All Registers
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
