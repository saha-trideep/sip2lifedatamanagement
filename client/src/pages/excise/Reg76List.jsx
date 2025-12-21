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

const Reg76List = () => {
    const navigate = useNavigate();
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
            setVats(res.data);
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
        <div className="p-8 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/registers')} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Reg 76 – Spirit Receipt</h1>
                        <p className="text-gray-500">Daily receipt of spirit from distilleries</p>
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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Date Range</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="w-full p-2 border rounded-lg text-sm"
                            />
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="w-full p-2 border rounded-lg text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Storage Vat</label>
                        <select
                            name="vat"
                            value={filters.vat}
                            onChange={handleFilterChange}
                            className="w-full p-2 border rounded-lg text-sm"
                        >
                            <option value="">All Vats</option>
                            {vats.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Spirit Type</label>
                        <select
                            name="spiritType"
                            value={filters.spiritType}
                            onChange={handleFilterChange}
                            className="w-full p-2 border rounded-lg text-sm"
                        >
                            <option value="">All Types</option>
                            <option value="GENA">GENA</option>
                            <option value="ENA">ENA</option>
                            <option value="RS">RS</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Permit, Vehicle, Distillery..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Receipt Date</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Permit No</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Distillery</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Vat</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Advised AL</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Received AL</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Wastage AL</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
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
                                    <tr key={entry.id} className="hover:bg-blue-50/30 transition group">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{format(new Date(entry.receiptDate), 'dd MMM yyyy')}</div>
                                            <div className="text-[10px] text-gray-400 uppercase">By {entry.user?.name || 'Admin'}</div>
                                        </td>
                                        <td className="p-4 font-mono text-sm text-blue-600">{entry.permitNo}</td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-gray-700">{entry.exportingDistillery}</div>
                                            <div className="text-[10px] text-gray-400">{entry.vehicleNo}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">
                                                {entry.storageVat}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-sm">{entry.advisedAl.toFixed(2)}</td>
                                        <td className="p-4 text-right font-mono text-sm font-bold text-green-700">{entry.receivedAl.toFixed(2)}</td>
                                        <td className="p-4 text-right font-mono text-sm text-red-600">
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
