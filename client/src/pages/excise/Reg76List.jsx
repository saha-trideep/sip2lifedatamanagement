import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Plus, Search, Filter, Download as DownloadIcon, ArrowLeft, Loader,
    Edit, Calendar, User, Info, FileSpreadsheet, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTheme } from '../../context/ThemeContext';

const Reg76List = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [entries, setEntries] = useState([]);
    const [vats, setVats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        vat: '',
        spiritType: '',
        search: ''
    });

    useEffect(() => {
        fetchEntries();
        fetchVats();
    }, []);

    const fetchVats = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/excise/vats`);
            // Filter to show only Storage Vats (SST), not Blending Vats (BRT)
            const storageVats = res.data.filter(v => v.vatType === 'SST');
            setVats(storageVats);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/excise/reg76`, { params: filters });
            setEntries(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEntries();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [filters]);

    const exportExcel = () => {
        const data = entries.map(e => ({
            'Receipt Date': format(new Date(e.receiptDate), 'dd/MM/yyyy'),
            'Permit No': e.permitNo,
            'Distillery': e.exportingDistillery,
            'Vehicle No': e.vehicleNo,
            'Spirit Type': e.natureOfSpirit,
            'Vat': e.storageVat,
            'Advised BL': e.advisedBl,
            'Advised AL': e.advisedAl,
            'Received BL': e.receivedBl.toFixed(2),
            'Received AL': e.receivedAl.toFixed(2),
            'Transit Wastage AL': e.transitWastageAl.toFixed(2),
            'Remarks': e.remarks || ''
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reg-76");
        XLSX.writeFile(wb, `Reg76_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const exportPDF = () => {
        const doc = jsPDF({ orientation: 'landscape' });

        doc.setFontSize(18);
        doc.text("EXCISE REGISTER REG-76: SPIRIT RECEIPT", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${format(new Date(), 'dd/MMM/yyyy HH:mm')}`, 14, 28);
        doc.text("System-generated internal register for reference. Official submission as per WB Excise portal.", 14, 34);

        const tableColumn = [
            "Date", "Permit No", "Distillery", "Vehicle", "Vat",
            "Advised AL", "Received AL", "Wastage AL", "Remarks"
        ];

        const tableRows = entries.map(e => [
            format(new Date(e.receiptDate), 'dd/MM/yy'),
            e.permitNo,
            e.exportingDistillery,
            e.vehicleNo,
            e.storageVat,
            e.advisedAl.toFixed(2),
            e.receivedAl.toFixed(2),
            e.transitWastageAl.toFixed(2),
            e.remarks || ''
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 25 },
                2: { cellWidth: 40 },
                3: { cellWidth: 25 },
                4: { cellWidth: 15 },
                5: { cellWidth: 20, halign: 'right' },
                6: { cellWidth: 20, halign: 'right' },
                7: { cellWidth: 20, halign: 'right' },
            }
        });

        doc.save(`Reg76_${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    return (
        <div className={`p-8 min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950 mt-1' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/registers')} className={`p-2 rounded-full transition ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Reg 76 – Spirit Receipt</h1>
                        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Daily receipt of spirit from distilleries</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
                    >
                        <FileSpreadsheet size={18} />
                        Excel
                    </button>
                    <button
                        onClick={exportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm"
                    >
                        <FileText size={18} />
                        PDF
                    </button>
                    <button
                        onClick={() => navigate('/registers/reg76/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
                    >
                        <Plus size={20} />
                        New Receipt
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} p-6 rounded-2xl shadow-sm border mb-8`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                    <div className="lg:col-span-2">
                        <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Date Range</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className={`w-full p-2.5 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}
                            />
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className={`w-full p-2.5 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Storage Vat</label>
                        <select
                            name="vat"
                            value={filters.vat}
                            onChange={handleFilterChange}
                            className={`w-full p-2.5 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}
                        >
                            <option value="">All Vats</option>
                            {vats.map(v => <option key={v.id} value={v.vatCode}>{v.vatCode}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Spirit Type</label>
                        <select
                            name="spiritType"
                            value={filters.spiritType}
                            onChange={handleFilterChange}
                            className={`w-full p-2.5 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}
                        >
                            <option value="">All Types</option>
                            <option value="GENA">GENA</option>
                            <option value="ENA">ENA</option>
                            <option value="RS">RS</option>
                        </select>
                    </div>
                    <div className="lg:col-span-2">
                        <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Search Resources</label>
                        <div className="relative">
                            <Search className={`absolute left-3 top-2.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} size={18} />
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Permit, Vehicle, Distillery..."
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-600' : 'bg-gray-50 text-gray-900'}`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl shadow-sm border overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-100'} border-b`}>
                                <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Receipt Date</th>
                                <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Permit No</th>
                                <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Distillery</th>
                                <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Vat</th>
                                <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-500'} text-right`}>Advised AL</th>
                                <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-500'} text-right`}>Received AL</th>
                                <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-500'} text-right`}>Wastage AL</th>
                                <th className={`p-4 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-500'} text-center`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center text-gray-400">
                                        <Loader className="animate-spin mx-auto mb-2" size={32} />
                                        Loading entries...
                                    </td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center text-gray-500 italic">
                                        No entries found.
                                    </td>
                                </tr>
                            ) : (
                                entries.map(entry => (
                                    <tr key={entry.id} className={`transition group ${isDark ? 'hover:bg-indigo-900/10' : 'hover:bg-blue-50/30'}`}>
                                        <td className="p-4">
                                            <div className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>{format(new Date(entry.receiptDate), 'dd MMM yyyy')}</div>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">By {entry.user?.name || 'Admin'}</div>
                                        </td>
                                        <td className={`p-4 font-black text-sm ${isDark ? 'text-indigo-400' : 'text-blue-600'}`}>{entry.permitNo}</td>
                                        <td className="p-4">
                                            <div className={`text-sm font-black ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{entry.exportingDistillery}</div>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{entry.vehicleNo}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-800' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                                {entry.storageVat}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-right font-black text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{entry.advisedAl.toFixed(2)}</td>
                                        <td className={`p-4 text-right font-black text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>{entry.receivedAl.toFixed(2)}</td>
                                        <td className={`p-4 text-right font-black text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                            {entry.transitWastageAl.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => navigate(`/registers/reg76/edit/${entry.id}`)}
                                                className="p-2 text-gray-400 hover:text-blue-600 transition"
                                                title="Edit Entry"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reg76List;
