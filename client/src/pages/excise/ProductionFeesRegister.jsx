import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import {
    Plus, Download, Filter, Database, Calculator, ArrowLeft,
    Calendar, Moon, Sun, ChevronRight, FileText, AlertCircle,
    CheckCircle2, Info, TrendingUp, CreditCard, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ProductionFeesRegister = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState([]);
    const [summary, setSummary] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ledgerRes, summaryRes] = await Promise.all([
                axios.get(`${API_URL}/api/production-fees/ledger`),
                axios.get(`${API_URL}/api/production-fees/summary`)
            ]);

            if (ledgerRes.data.success) setEntries(ledgerRes.data.data);
            if (summaryRes.data.success) setSummary(summaryRes.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoGenerate = async () => {
        const dateStr = prompt("Enter date (YYYY-MM-DD) to generate from Reg-A:", selectedDate);
        if (!dateStr) return;

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/production-fees/auto-generate`, { date: dateStr });
            if (res.data.success) {
                alert(res.data.message);
                fetchData();
            }
        } catch (err) {
            alert(err.response?.data?.error || "Error generating entry");
        } finally {
            setLoading(false);
        }
    };

    const exportPDF = () => {
        const doc = jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // Title and Header
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text("REGISTER OF PRODUCTION FEES (PLA)", 14, 15);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${format(new Date(), 'dd/MMM/yyyy HH:mm')} | Paper Size: A4 Landscape`, 14, 22);

        // Custom Table Column Definition (Mapping to image columns)
        const tableHead = [
            [
                { content: 'Date', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Opening Bal', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Deposit', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Challan Info', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Total Credited', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'IML Bottles Production Quantity', colSpan: 16, styles: { halign: 'center' } },
                { content: 'Total BL', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Fees Debited', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'Closing Bal', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            ],
            [
                // 50 UP
                '50:750', '50:500', '50:375', '50:300', '50:180',
                // 60 UP
                '60:600', '60:500', '60:375', '60:300', '60:180',
                // 70 UP
                '70:300',
                // 80 UP
                '80:600', '80:500', '80:375', '80:300', '80:180'
            ]
        ];

        const tableBody = entries.map(e => [
            format(new Date(e.date), 'dd/MM/yy'),
            e.openingBalance.toFixed(2),
            e.depositAmount > 0 ? e.depositAmount.toFixed(2) : '-',
            e.challanNo || '-',
            e.totalCredited.toFixed(2),
            // 50 UP
            e.count50_750, e.count50_500, e.count50_375, e.count50_300, e.count50_180,
            // 60 UP
            e.count60_600, e.count60_500, e.count60_375, e.count60_300, e.count60_180,
            // 70 UP
            e.count70_300,
            // 80 UP
            e.count80_600, e.count80_500, e.count80_375, e.count80_300, e.count80_180,
            e.totalProductionBl.toFixed(2),
            e.feesDebited.toFixed(2),
            e.closingBalance.toFixed(2)
        ]);

        doc.autoTable({
            head: tableHead,
            body: tableBody,
            startY: 30,
            theme: 'grid',
            styles: { fontSize: 6, cellPadding: 1, overflow: 'linebreak', halign: 'center' },
            headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 15 }, // Date
                1: { cellWidth: 15 }, // Opening
                2: { cellWidth: 15 }, // Deposit
                3: { cellWidth: 20 }, // Challan
                4: { cellWidth: 15 }, // Total Credited
                // Bottles - default is narrow
                21: { cellWidth: 15, fontStyle: 'bold' }, // Total BL
                22: { cellWidth: 15, fontStyle: 'bold', textColor: [200, 0, 0] }, // Fees
                23: { cellWidth: 15, fontStyle: 'bold', textColor: [0, 150, 0] } // Closing
            },
            margin: { top: 30, left: 10, right: 10 }
        });

        doc.save(`ProductionFees_PLA_${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <div className={`p-8 min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className="max-w-[1600px] mx-auto flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/registers')} className={`p-3 rounded-2xl transition ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-600 shadow-sm'}`}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>Production Fees Register</h1>
                        <p className={`text-sm font-bold ${isDark ? 'text-gray-500' : 'text-gray-400 uppercase tracking-widest'}`}>Personal Ledger Account (PLA) • Bottling Fees @ ₹3.00/BL</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={exportPDF}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isDark ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'}`}
                    >
                        <Download size={16} /> Statutory PDF
                    </button>
                    <button
                        onClick={handleAutoGenerate}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'}`}
                    >
                        <RefreshCw size={16} /> Auto-Generate from Reg-A
                    </button>
                    <button onClick={toggleTheme} className={`p-4 rounded-2xl shadow-lg transition-all ${isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                        {isDark ? <Sun size={24} /> : <Moon size={24} />}
                    </button>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className={`p-6 rounded-[2rem] shadow-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                                <CreditCard size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Available Funds</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-500">Current PLA Balance</h3>
                        <p className="text-2xl font-black">{formatCurrency(summary?.currentBalance)}</p>
                    </div>

                    <div className={`p-6 rounded-[2rem] shadow-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                                <RefreshCw size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Usage (30d)</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-500">Fees Debited (30 Days)</h3>
                        <p className="text-2xl font-black">{formatCurrency(summary?.thirtyDayTotalFees)}</p>
                    </div>

                    <div className={`p-6 rounded-[2rem] shadow-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                                <FileText size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Production</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-500">Bulk Liters Bottled (30d)</h3>
                        <p className="text-2xl font-black">{(summary?.thirtyDayTotalProductionBl || 0).toLocaleString()} BL</p>
                    </div>

                    <div className={`p-6 rounded-[2rem] shadow-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                                <Calendar size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Timeline</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-500">Last Entry Date</h3>
                        <p className="text-2xl font-black">{summary?.lastEntryDate ? new Date(summary.lastEntryDate).toLocaleDateString() : 'No entries'}</p>
                    </div>
                </div>

                {/* Main Register Card */}
                <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-blue-50/50 border-gray-100'}`}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg">
                                <Database size={24} />
                            </div>
                            <h2 className="text-xl font-black tracking-tight uppercase tracking-widest">Daily Bottling Fees Ledger (PLA)</h2>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[2000px]">
                            <thead>
                                <tr className={`${isDark ? 'bg-gray-800/80 text-gray-400' : 'bg-gray-50 text-gray-500'} text-[10px] font-black uppercase tracking-widest`}>
                                    <th rowSpan="2" className="p-6 border border-gray-700">Date</th>
                                    <th rowSpan="2" className="p-6 border border-gray-700">Opening Balance</th>
                                    <th rowSpan="2" className="p-6 border border-gray-700">Deposit Amount</th>
                                    <th rowSpan="2" className="p-6 border border-gray-700">E Challan No. & Date</th>
                                    <th rowSpan="2" className="p-6 border border-gray-700 text-indigo-400">Total Credit</th>
                                    <th colSpan="5" className="p-4 border border-gray-700 text-center bg-gray-700/20">IML Bottles Quantity (50° UP)</th>
                                    <th colSpan="5" className="p-4 border border-gray-700 text-center bg-gray-700/10">IML Bottles Quantity (60° UP)</th>
                                    <th className="p-4 border border-gray-700 text-center bg-gray-700/20">70° UP</th>
                                    <th colSpan="5" className="p-4 border border-gray-700 text-center bg-gray-700/10">IML Bottles Quantity (80° UP)</th>
                                    <th rowSpan="2" className="p-6 border border-gray-700 text-blue-400">Total BL</th>
                                    <th rowSpan="2" className="p-6 border border-gray-700 text-red-400">Fees Debited</th>
                                    <th rowSpan="2" className="p-6 border border-gray-700 text-emerald-400 font-black">Closing Balance</th>
                                </tr>
                                <tr className={`${isDark ? 'bg-gray-800/50 text-gray-500' : 'bg-gray-100/50 text-gray-400'} text-[9px] font-bold text-center`}>
                                    {/* 50 UP */}
                                    <th className="p-2 border border-gray-700 w-16 text-xs">750ml</th>
                                    <th className="p-2 border border-gray-700 w-16 text-xs">500ml</th>
                                    <th className="p-2 border border-gray-700 w-16 text-xs">375ml</th>
                                    <th className="p-2 border border-gray-700 w-16 text-xs">300ml</th>
                                    <th className="p-2 border border-gray-700 w-16 text-xs text-indigo-400">180ml</th>
                                    {/* 60 UP */}
                                    <th className="p-2 border border-gray-700 w-16 text-xs text-orange-400">600ml</th>
                                    <th className="p-2 border border-gray-700 w-16 text-xs">500ml</th>
                                    <th className="p-2 border border-gray-700 w-16 text-xs">375ml</th>
                                    <th className="p-2 border border-gray-700 w-16 text-xs">300ml</th>
                                    <th className="p-2 border border-gray-700 w-16 text-xs">180ml</th>
                                    {/* 70 UP */}
                                    <th className="p-2 border border-gray-700 w-16 text-xs">300ml</th>
                                    {/* 80 UP */}
                                    <th className="p-2 border border-gray-700 w-16 text-xs text-purple-400">600ml</th>
                                    <th className="p-2 border border-gray-700 w-16 text-xs">500ml</th>
                                    <th className="p-2 border border-gray-700 w-16 text-xs">375ml</th>
                                    <th className="p-2 border border-gray-700 w-16 text-xs">300ml</th>
                                    <th className="p-2 border border-gray-700 w-16 text-xs">180ml</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {entries.length > 0 ? (
                                    entries.map((entry) => (
                                        <tr key={entry.id} className={`${isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'} transition-colors`}>
                                            <td className="p-4 border border-gray-800 whitespace-nowrap font-black">{new Date(entry.date).toLocaleDateString()}</td>
                                            <td className="p-4 border border-gray-800 font-medium text-gray-500">{formatCurrency(entry.openingBalance)}</td>
                                            <td className="p-4 border border-gray-800 font-bold text-emerald-400">{entry.depositAmount > 0 ? formatCurrency(entry.depositAmount) : '-'}</td>
                                            <td className="p-4 border border-gray-800 text-[10px] font-black">{entry.challanNo ? `${entry.challanNo} (${new Date(entry.challanDate).toLocaleDateString()})` : '-'}</td>
                                            <td className="p-4 border border-gray-800 font-black text-indigo-400">{formatCurrency(entry.totalCredited)}</td>

                                            {/* 50 UP Counts */}
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count50_750 || '-'}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count50_500 || '-'}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count50_375 || '-'}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count50_300 || '-'}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count50_180 || '-'}</td>

                                            {/* 60 UP Counts */}
                                            <td className="p-2 border border-gray-800 text-center font-bold text-orange-400/80">{entry.count60_600 || '-'}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count60_500 || '-'}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count60_375 || '-'}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count60_300 || '-'}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count60_180 || '-'}</td>

                                            {/* 70 UP */}
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count70_300 || '-'}</td>

                                            {/* 80 UP Counts */}
                                            <td className="p-2 border border-gray-800 text-center font-bold text-purple-400/80">{entry.count80_600 || '-'}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count80_500 || '-'}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count80_375 || '-'}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count80_300 || '-'}</td>
                                            <td className="p-2 border border-gray-800 text-center font-bold">{entry.count80_180 || '-'}</td>

                                            <td className="p-4 border border-gray-800 font-black text-blue-400">{entry.totalProductionBl.toLocaleString()} BL</td>
                                            <td className="p-4 border border-gray-800 font-black text-red-400">{formatCurrency(entry.feesDebited)}</td>
                                            <td className="p-4 border border-gray-800 font-black text-emerald-400 bg-emerald-500/5">{formatCurrency(entry.closingBalance)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="24" className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400">
                                                    <Info size={40} />
                                                </div>
                                                <p className="text-gray-500 font-bold uppercase tracking-widest">No entries found for the selected period.</p>
                                                <button onClick={handleAutoGenerate} className="text-indigo-500 font-black hover:underline px-4 py-2 bg-indigo-500/10 rounded-xl transition-all">
                                                    Click here to pull data from Reg-A
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest px-4">
                    <p className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-indigo-400" />
                        This ledger aggregates completed production from Reg-A for daily fee calculation.
                    </p>
                    <p>Total Records: {entries.length}</p>
                </div>

                <style>{`
                    @media print {
                        @page { size: A4 landscape; margin: 5mm; }
                        body { background: white !important; color: black !important; }
                        .p-8, .max-w-[1600px] { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
                        button, .shadow-2xl, .shadow-xl, .grid { display: none !important; }
                        .rounded-[2.5rem], .rounded-2xl { border-radius: 0 !important; border: 1px solid #eee !important; }
                        table { min-width: 100% !important; font-size: 7pt !important; border-collapse: collapse !important; }
                        th, td { border: 1px solid #000 !important; padding: 2px !important; }
                        .text-indigo-400, .text-emerald-400, .text-blue-400, .text-red-400 { color: black !important; font-weight: bold !important; }
                        .bg-gray-700\\/20, .bg-gray-700\\/10, .bg-blue-50\\/50 { background: #f9f9f9 !important; }
                        .overflow-x-auto { overflow: visible !important; }
                        h1 { font-size: 16pt !important; margin-bottom: 5px !important; }
                        p { font-size: 9pt !important; }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default ProductionFeesRegister;
