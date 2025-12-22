import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Download, FileText, Calendar, Filter, ArrowLeft,
    Database, Calculator, FileSpreadsheet, RefreshCw, Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reg78Register = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState({
        startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/reg78/report`, {
                params: filters,
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) {
            console.error("Failed to fetch Reg 78", error);
        } finally {
            setLoading(false);
        }
    };

    const exportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(data.map(r => ({
            'Date Hour': format(new Date(r.dateHour), 'dd-MM-yy HH:mm'),
            'Balance in Hand (2)': r.openingAl?.toFixed(2),
            'Rec via Pass (3)': r.receiptPassAl?.toFixed(2),
            'Rec via MFM-I (4)': r.receiptMfmAl?.toFixed(2),
            'Op. Inc (5)': r.operationalInc?.toFixed(2),
            'Prod. Inc (6)': r.productionInc?.toFixed(2),
            'Audit Inc (7)': r.auditInc?.toFixed(2),
            'Total Bal (8)': r.totalAlInHand?.toFixed(2),
            'Duty Issue (9)': r.issueDutyAl?.toFixed(2),
            'Sample (10)': r.sampleAl?.toFixed(2),
            'Op. Wastage (11)': r.operationalWastage?.toFixed(2),
            'Prod. Wastage (12)': r.productionWastage?.toFixed(2),
            'Audit Wastage (13)': r.auditWastage?.toFixed(2),
            'Total Debit (14)': r.totalDebitAl?.toFixed(2),
            'Left in Vats (15)': r.closingAl?.toFixed(2)
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reg 78");
        XLSX.writeFile(workbook, `Reg78_Distillery_${filters.startDate}_to_${filters.endDate}.xlsx`);
    };

    const exportPDF = () => {
        const doc = new jsPDF('landscape');
        doc.setFontSize(14);
        doc.text("REG-78: REGISTER OF SPIRITS IN DISTILLERY", 14, 15);
        doc.setFontSize(10);
        doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 22);

        const tableBody = data.map(r => [
            format(new Date(r.dateHour), 'dd-MM HH:mm'),
            r.openingAl?.toFixed(2),
            r.receiptPassAl?.toFixed(2),
            r.receiptMfmAl?.toFixed(2),
            r.operationalInc?.toFixed(2),
            r.productionInc?.toFixed(2),
            r.auditInc?.toFixed(2),
            r.totalAlInHand?.toFixed(2),
            r.issueDutyAl?.toFixed(2),
            r.sampleAl?.toFixed(2),
            r.operationalWastage?.toFixed(2),
            r.productionWastage?.toFixed(2),
            r.auditWastage?.toFixed(2),
            r.totalDebitAl?.toFixed(2),
            r.closingAl?.toFixed(2)
        ]);

        doc.autoTable({
            startY: 28,
            head: [['Date', 'Bal(2)', 'Pass(3)', 'MFM1(4)', 'OpInc(5)', 'PrInc(6)', 'AdInc(7)', 'TotBal(8)', 'Issue(9)', 'Samp(10)', 'OpWst(11)', 'PrWst(12)', 'AdWst(13)', 'TotDeb(14)', 'Left(15)']],
            body: tableBody,
            styles: { fontSize: 7, cellPadding: 1 },
            headStyles: { fillStyle: 'F0F0F0', textColor: 0, fontStyle: 'bold' }
        });

        doc.save(`Reg78_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    };

    return (
        <div className={`p-8 min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50'}`}>
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/registers')} className={`p-4 rounded-3xl shadow-sm border transition ${isDark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-100 text-gray-500 hover:text-blue-600'}`}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter">Reg 78 – Spirit Account</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mt-1">Master Statutory Operational Ledger</p>
                        </div>
                    </div>

                    <div className={`p-2 rounded-3xl border flex items-center gap-4 px-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <div className="flex items-center gap-2 group">
                            <Calendar size={18} className="text-gray-400 group-hover:text-indigo-500" />
                            <input
                                type="date"
                                className="bg-transparent border-0 text-xs font-black uppercase focus:ring-0"
                                value={filters.startDate}
                                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-800"></div>
                        <div className="flex items-center gap-2 group">
                            <input
                                type="date"
                                className="bg-transparent border-0 text-xs font-black uppercase focus:ring-0"
                                value={filters.endDate}
                                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={fetchReport}
                            className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition shadow-lg"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={exportExcel} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-lg ${isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100'}`}>
                        <FileSpreadsheet size={16} /> Excel Export
                    </button>
                    <button onClick={exportPDF} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-lg ${isDark ? 'bg-rose-900/30 text-rose-400 border border-rose-900/50' : 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100'}`}>
                        <FileText size={16} /> Statutory PDF
                    </button>
                    <button onClick={() => window.print()} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white hover:bg-black'}`}>
                        <Printer size={16} /> Print Report
                    </button>
                </div>

                {/* Statutory Table */}
                <div className={`rounded-[2.5rem] border shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1400px]">
                            <thead>
                                <tr className={`${isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-500'} text-[9px] font-black uppercase tracking-widest`}>
                                    <th className="p-5 border-r dark:border-gray-800" rowSpan="2">Date Hour</th>
                                    <th className="p-5 border-r dark:border-gray-800" rowSpan="2">Balance in Hand <br />(Opening)</th>
                                    <th className="p-3 text-center border-b dark:border-gray-800 border-r" colSpan="5">Receipts & Increases</th>
                                    <th className="p-5 border-r dark:border-gray-800" rowSpan="2">Total Bal <br />(Sum 2-7)</th>
                                    <th className="p-5 border-r dark:border-gray-800" rowSpan="2">Issues on <br />Duty</th>
                                    <th className="p-3 text-center border-b dark:border-gray-800 border-r" colSpan="4">Differences (Distillery/Production)</th>
                                    <th className="p-5 border-r dark:border-gray-800" rowSpan="2">Total Debit <br />(Sum 9-13)</th>
                                    <th className="p-5" rowSpan="2">Left in Vats <br />(Closing)</th>
                                </tr>
                                <tr className={`${isDark ? 'bg-gray-800/30 text-gray-500' : 'bg-gray-100/50 text-gray-400'} text-[8px] font-black uppercase tracking-tighter`}>
                                    <th className="p-3 border-r dark:border-gray-800">Pass (3)</th>
                                    <th className="p-3 border-r dark:border-gray-800">MFM-I (4)</th>
                                    <th className="p-3 border-r dark:border-gray-800">Op (5)</th>
                                    <th className="p-3 border-r dark:border-gray-800">Prod (6)</th>
                                    <th className="p-3 border-r dark:border-gray-800">Audit (7)</th>

                                    <th className="p-3 border-r dark:border-gray-800">Samp (10)</th>
                                    <th className="p-3 border-r dark:border-gray-800">Op (11)</th>
                                    <th className="p-3 border-r dark:border-gray-800">Prod (12)</th>
                                    <th className="p-3 border-r dark:border-gray-800">Audit (13)</th>
                                </tr>
                            </thead>
                            <tbody className="text-[10px] font-bold">
                                {data.map((r, i) => (
                                    <tr key={i} className={`border-t ${isDark ? 'border-gray-800 hover:bg-indigo-900/10' : 'hover:bg-blue-50/30 border-gray-50'}`}>
                                        <td className="p-4 whitespace-nowrap border-r dark:border-gray-800 font-black">
                                            {format(new Date(r.dateHour), 'dd MMM HH:mm')}
                                            <div className="text-[8px] text-gray-400 uppercase">{r.eventType} @ {r.vatCode}</div>
                                        </td>
                                        <td className="p-4 border-r dark:border-gray-800 text-gray-500">{r.openingAl?.toFixed(2)}</td>
                                        <td className="p-4 border-r dark:border-gray-800 text-blue-600">{r.receiptPassAl > 0 ? r.receiptPassAl.toFixed(2) : '-'}</td>
                                        <td className="p-4 border-r dark:border-gray-800 text-blue-600">{r.receiptMfmAl > 0 ? r.receiptMfmAl.toFixed(2) : '-'}</td>
                                        <td className="p-4 border-r dark:border-gray-800 text-green-600">{r.operationalInc > 0 ? r.operationalInc.toFixed(2) : '-'}</td>
                                        <td className="p-4 border-r dark:border-gray-800 text-purple-600">{r.productionInc > 0 ? r.productionInc.toFixed(2) : '-'}</td>
                                        <td className="p-4 border-r dark:border-gray-800 text-orange-600">{r.auditInc > 0 ? r.auditInc.toFixed(2) : '-'}</td>
                                        <td className="p-4 border-r dark:border-gray-800 font-black text-gray-900 dark:text-gray-100">{r.totalAlInHand?.toFixed(2)}</td>
                                        <td className="p-4 border-r dark:border-gray-800">
                                            <div className="text-red-600">{r.issueDutyAl > 0 ? r.issueDutyAl.toFixed(2) : '-'} <span className="text-[7px]">AL</span></div>
                                            {r.productionFees > 0 && (
                                                <div className="text-[7px] font-black text-gray-400 mt-1 uppercase">
                                                    Fee: ₹{r.productionFees.toFixed(2)}
                                                    <br />({r.issueDutyBl} BL)
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 border-r dark:border-gray-800 text-gray-500">{r.sampleAl > 0 ? r.sampleAl.toFixed(2) : '-'}</td>
                                        <td className="p-4 border-r dark:border-gray-800 text-red-400">{r.operationalWastage > 0 ? r.operationalWastage.toFixed(2) : '-'}</td>
                                        <td className="p-4 border-r dark:border-gray-800 text-red-500">{r.productionWastage > 0 ? r.productionWastage.toFixed(2) : '-'}</td>
                                        <td className="p-4 border-r dark:border-gray-800 text-red-700">{r.auditWastage > 0 ? r.auditWastage.toFixed(2) : '-'}</td>
                                        <td className="p-4 border-r dark:border-gray-800 font-black text-gray-900 dark:text-gray-100">{r.totalDebitAl?.toFixed(2)}</td>
                                        <td className="p-4 font-black text-indigo-600">{r.closingAl?.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {data.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="15" className="p-20 text-center text-gray-400 font-black uppercase tracking-widest italic">
                                            No spirit transactions found for this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reg78Register;
