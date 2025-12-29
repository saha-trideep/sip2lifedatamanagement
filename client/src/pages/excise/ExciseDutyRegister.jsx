import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import {
    Plus, Download, Filter, Edit, Trash2, Check, X,
    ArrowLeft, Calculator, CreditCard, AlertCircle, TrendingUp,
    Calendar, Moon, Sun, ChevronRight, FileText, Database, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';

// Import sub-components
import DutyLedgerTable from '../../components/excise/DutyLedgerTable';
import DutyEntryModal from '../../components/excise/DutyEntryModal';
import ChallanFormModal from '../../components/excise/ChallanFormModal';
import DutyRateConfig from '../../components/excise/DutyRateConfig';

const ExciseDutyRegister = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalDutyAccrued: 0,
        totalPayments: 0,
        outstandingBalance: 0,
        pendingEntries: 0,
        partialPaidEntries: 0,
        fullyPaidEntries: 0,
        byStrength: {}
    });
    const [entries, setEntries] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [showChallanModal, setShowChallanModal] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch stats
            const statsRes = await axios.get(`${API_URL}/api/excise-duty/summary/stats?monthYear=${selectedMonth}-01`);
            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }

            // Fetch ledger entries
            const ledgerRes = await axios.get(`${API_URL}/api/excise-duty/ledger?startMonth=${selectedMonth}-01&endMonth=${selectedMonth}-31`);
            if (ledgerRes.data.success) {
                setEntries(ledgerRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching duty data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEntry = async (id) => {
        if (!window.confirm("Are you sure you want to delete this duty entry? This cannot be undone.")) return;

        try {
            const res = await axios.delete(`${API_URL}/api/excise-duty/ledger/${id}`);
            if (res.data.success) {
                fetchData(); // Refresh both stats and table
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Error deleting entry");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const calculatePaidPercentage = () => {
        if (stats.totalDutyAccrued === 0) return 0;
        return Math.min(100, Math.round((stats.totalPayments / stats.totalDutyAccrued) * 100));
    };

    return (
        <div className={`p-8 min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/registers')} className={`p-2 rounded-full transition ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Excise Duty Register</h1>
                        <p className={`text-sm font-bold ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Personal Ledger Account (PLA) for Country Liquor</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className={`p-3 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-white shadow-sm'}`}
                    />
                    <button
                        onClick={() => setShowAdmin(!showAdmin)}
                        className={`p-3 rounded-xl transition ${isDark ? 'bg-gray-800 text-gray-400 hover:text-indigo-400' : 'bg-white text-gray-400 hover:text-indigo-600 shadow-sm'}`}
                        title="Duty Rate Settings"
                    >
                        <Settings size={22} />
                    </button>
                    <button onClick={toggleTheme} className={`p-4 rounded-2xl shadow-lg transition-all ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'}`}>
                        {isDark ? <Sun size={24} /> : <Moon size={24} />}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Stats Grid */}
                {/* ... (existing stats grid code) ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Accrued */}
                    <div className={`p-6 rounded-[2rem] shadow-xl border animate-in fade-in slide-in-from-bottom-4 duration-500 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-blue-50'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-900/40 text-indigo-400' : 'bg-blue-50 text-blue-600'}`}>
                                <TrendingUp size={24} />
                            </div>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isDark ? 'bg-indigo-900/20 text-indigo-300' : 'bg-blue-100 text-blue-700'}`}>
                                Accrued
                            </span>
                        </div>
                        <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Duty Accrued</h3>
                        <p className="text-2xl font-black">{formatCurrency(stats.totalDutyAccrued)}</p>
                    </div>

                    {/* Total Payments */}
                    <div className={`p-6 rounded-[2rem] shadow-xl border animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-green-50'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-50 text-green-600'}`}>
                                <CreditCard size={24} />
                            </div>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isDark ? 'bg-green-900/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                                Paid
                            </span>
                        </div>
                        <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Payments</h3>
                        <p className="text-2xl font-black">{formatCurrency(stats.totalPayments)}</p>
                    </div>

                    {/* Outstanding Balance */}
                    <div className={`p-6 rounded-[2rem] shadow-xl border animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-red-50'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                <AlertCircle size={24} />
                            </div>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-100 text-red-700'}`}>
                                Balance
                            </span>
                        </div>
                        <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Outstanding Balance</h3>
                        <p className="text-2xl font-black">{formatCurrency(stats.outstandingBalance)}</p>
                    </div>

                    {/* Pending Entries */}
                    <div className={`p-6 rounded-[2rem] shadow-xl border animate-in fade-in slide-in-from-bottom-4 duration-500 delay-225 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-orange-50'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${isDark ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                                <Calendar size={24} />
                            </div>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isDark ? 'bg-orange-900/20 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                                Pending
                            </span>
                        </div>
                        <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pending Entries</h3>
                        <p className="text-2xl font-black">{stats.pendingEntries}</p>
                    </div>
                </div>

                {/* Progress Bar Section */}
                <div className={`p-8 rounded-[2.5rem] shadow-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-black uppercase tracking-tight">Payment Status</h3>
                        <span className="text-sm font-bold text-gray-500">{calculatePaidPercentage()}% Collected</span>
                    </div>
                    <div className="h-6 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 shadow-lg"
                            style={{ width: `${calculatePaidPercentage()}%` }}
                        />
                        <div
                            className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-1000 opacity-50"
                            style={{ width: `${100 - calculatePaidPercentage()}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-3 px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Paid</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Outstanding</span>
                        </div>
                    </div>
                </div>

                {/* Ledger Section */}
                <div className={`rounded-[2.5rem] shadow-xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-blue-50/50 border-gray-100'}`}>
                        <h2 className="text-xl font-black flex items-center gap-3">
                            <Database className={isDark ? 'text-indigo-400' : 'text-blue-600'} size={28} />
                            Monthly Duty Ledger
                        </h2>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowChallanModal(true)}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2 ${isDark ? 'bg-gray-800 text-green-400 hover:bg-green-600 hover:text-white' : 'bg-white border border-gray-200 text-green-600 hover:bg-green-600 hover:text-white'}`}
                            >
                                <Plus size={16} /> Record Payment
                            </button>
                            <button
                                onClick={() => setShowEntryModal(true)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg flex items-center gap-2"
                            >
                                <Plus size={16} /> New Duty Entry
                            </button>
                        </div>
                    </div>

                    <DutyLedgerTable
                        entries={entries}
                        loading={loading}
                        isDark={isDark}
                        onEdit={(entry) => console.log('Edit', entry)}
                        onDelete={handleDeleteEntry}
                    />
                </div>

                {/* Admin Config Section */}
                {showAdmin && (
                    <div className="animate-in slide-in-from-bottom-8 duration-500">
                        <DutyRateConfig isDark={isDark} />
                    </div>
                )}
            </div>

            {/* Modals */}
            <DutyEntryModal
                isOpen={showEntryModal}
                onClose={() => setShowEntryModal(false)}
                onSuccess={fetchData}
                isDark={isDark}
                selectedMonth={selectedMonth}
            />

            <ChallanFormModal
                isOpen={showChallanModal}
                onClose={() => setShowChallanModal(false)}
                onSuccess={fetchData}
                isDark={isDark}
                entries={entries}
            />
        </div>
    );
};

export default ExciseDutyRegister;
