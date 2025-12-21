import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ArrowLeft, Download, Search, Filter, Loader,
    FileText, FileSpreadsheet, Info
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../config';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reg74Register = () => {
    const navigate = useNavigate();
    const { vatId } = useParams();
    const [vat, setVat] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: format(new Date(), 'yyyy-MM-01'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });

    useEffect(() => {
        fetchVatInfo();
        fetchEvents();
    }, [vatId]);

    const fetchVatInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/reg74/vats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const v = res.data.find(v => v.id === parseInt(vatId));
            setVat(v);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/reg74/generate`, {
                params: { vatId, ...filters },
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvents(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const exportExcel = () => {
        const data = events.map(e => ({
            'Date/Time': format(new Date(e.dateTime), 'dd/MM/yyyy HH:mm'),
            'Type': e.type,
            'Dip (cm)': e.dipCm || e.finalDipCm || '',
            'Temp (C)': e.temperatureC || '',
            'BL': e.volumeBl || e.qtyBl || e.finalVolumeBl || '',
            'Strength': e.strengthVv || e.avgStrengthVv || e.finalStrengthVv || '',
            'AL': e.volumeAl || e.qtyAl || e.finalQtyAl || '',
            'RLT Dip': e.rltDipCm || '',
            'Source/Dest': e.sourceVat || e.destination || '',
            'Remarks': e.remarks || ''
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reg-74");
        XLSX.writeFile(wb, `Reg74_${vat?.vatCode}_${filters.startDate}.xlsx`);
    };

    const exportPDF = () => {
        const doc = jsPDF({ orientation: 'landscape' });
        doc.setFontSize(16);
        doc.text(`EXCISE REGISTER REG-74: BLENDING (${vat?.vatCode})`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 22);

        const tableColumn = ["Date/Time", "Event", "Dip", "Temp", "Strength", "Volume BL", "Volume AL", "Source/Dest", "Remarks"];
        const tableRows = events.map(e => [
            format(new Date(e.dateTime), 'dd/MM HH:mm'),
            e.type,
            (e.dipCm || e.finalDipCm || '').toString(),
            (e.temperatureC || '').toString(),
            (e.strengthVv || e.avgStrengthVv || e.finalStrengthVv || '').toString(),
            (e.volumeBl || e.qtyBl || e.finalVolumeBl || '').toFixed(2),
            (e.volumeAl || e.qtyAl || e.finalQtyAl || '').toFixed(2),
            e.sourceVat || e.destination || '-',
            e.remarks || ''
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            theme: 'grid',
            styles: { fontSize: 8 }
        });
        doc.save(`Reg74_${vat?.vatCode}.pdf`);
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/registers/reg74')} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Blending Register – {vat?.vatCode || '...'}</h1>
                        <p className="text-gray-500">System-generated WB Excise Reg-74</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                        <FileSpreadsheet size={18} /> Excel
                    </button>
                    <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                        <FileText size={18} /> PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Start Date</label>
                    <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="p-2 border rounded-lg text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">End Date</label>
                    <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="p-2 border rounded-lg text-sm" />
                </div>
                <button onClick={fetchEvents} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition">
                    Apply Filters
                </button>
            </div>

            {/* Register Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="p-3 border-r">Date / Time</th>
                                <th className="p-3 border-r">Operation</th>
                                <th className="p-3 text-center border-b bg-blue-50/50" colSpan="5">Opening / Snapshot (Col 1-7)</th>
                                <th className="p-3 text-center border-b bg-green-50/50" colSpan="3">Receipt (Col 8-12)</th>
                                <th className="p-3 text-center border-b bg-orange-50/50" colSpan="3">Issue (Col 22-30)</th>
                                <th className="p-3 text-right">Remarks</th>
                            </tr>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[9px] text-gray-400 uppercase">
                                <th className="p-2 border-r">Event</th>
                                <th className="p-2 border-r">Type</th>
                                {/* Opening */}
                                <th className="p-2 text-center border-r">Dip</th>
                                <th className="p-2 text-center border-r">Temp</th>
                                <th className="p-2 text-center border-r">Str</th>
                                <th className="p-2 text-center border-r">BL</th>
                                <th className="p-2 text-center border-r">AL</th>
                                {/* Receipt */}
                                <th className="p-2 text-center border-r">Src</th>
                                <th className="p-2 text-center border-r">BL</th>
                                <th className="p-2 text-center border-r">AL</th>
                                {/* Issue */}
                                <th className="p-2 text-center border-r">Dest</th>
                                <th className="p-2 text-center border-r">BL</th>
                                <th className="p-2 text-center border-r">AL</th>

                                <th className="p-3 text-right">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="14" className="p-10 text-center text-gray-400">Loading register rows...</td></tr>
                            ) : events.length === 0 ? (
                                <tr><td colSpan="14" className="p-10 text-center text-gray-500 italic">No events recorded for this period.</td></tr>
                            ) : (
                                events.map((e, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/20 text-xs transition">
                                        <td className="p-2 border-r font-medium">{format(new Date(e.dateTime), 'dd/MM HH:mm')}</td>
                                        <td className="p-2 border-r">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.type === 'OPENING' ? 'bg-blue-100 text-blue-700' :
                                                    e.type === 'RECEIPT' ? 'bg-green-100 text-green-700' :
                                                        e.type === 'ISSUE' ? 'bg-orange-100 text-orange-700' :
                                                            e.type === 'QC' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-gray-100 text-gray-700'
                                                }`}>
                                                {e.type}
                                            </span>
                                        </td>

                                        {/* Opening Data */}
                                        <td className="p-2 text-center border-r text-gray-500">{e.type === 'OPENING' || e.type === 'CLOSING' ? (e.dipCm || e.finalDipCm || '-') : ''}</td>
                                        <td className="p-2 text-center border-r text-gray-500">{e.type === 'OPENING' ? (e.temperatureC || '-') : ''}</td>
                                        <td className="p-2 text-center border-r text-gray-500">{e.type === 'OPENING' || e.type === 'CLOSING' ? (e.strengthVv || e.finalStrengthVv || '-') : ''}</td>
                                        <td className="p-2 text-center border-r font-mono">{e.type === 'OPENING' || e.type === 'CLOSING' ? (e.volumeBl || e.finalVolumeBl || '-').toLocaleString() : ''}</td>
                                        <td className="p-2 text-center border-r font-mono">{e.type === 'OPENING' || e.type === 'CLOSING' ? (e.volumeAl || e.finalQtyAl || '-').toLocaleString() : ''}</td>

                                        {/* Receipt Data */}
                                        <td className="p-2 text-center border-r text-gray-500">{e.type === 'RECEIPT' ? e.sourceVat : ''}</td>
                                        <td className="p-2 text-center border-r font-mono text-green-700">{e.type === 'RECEIPT' ? e.qtyBl.toLocaleString() : ''}</td>
                                        <td className="p-2 text-center border-r font-mono text-green-700">{e.type === 'RECEIPT' ? e.qtyAl.toLocaleString() : ''}</td>

                                        {/* Issue Data */}
                                        <td className="p-2 text-center border-r text-gray-500">{e.type === 'ISSUE' ? e.destination : ''}</td>
                                        <td className="p-2 text-center border-r font-mono text-orange-700">{e.type === 'ISSUE' ? e.qtyBl.toLocaleString() : ''}</td>
                                        <td className="p-2 text-center border-r font-mono text-orange-700">{e.type === 'ISSUE' ? e.qtyAl.toLocaleString() : ''}</td>

                                        <td className="p-2 text-right text-gray-400 italic text-[10px]">{e.remarks || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Panel */}
            <div className="mt-8 bg-blue-900 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                    <Info className="text-blue-300" />
                    <h3 className="font-bold text-lg">Reg-74 Compliance Guide</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-100">
                    <div className="space-y-2">
                        <p className="font-bold text-white uppercase text-xs">Event Driven</p>
                        <p>This register is auto-generated from physical events. No manual row editing is allowed to prevent audit mismatches.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-bold text-white uppercase text-xs">QC Clearance</p>
                        <p>All Issues to production (Col 22-30) require a prior 'QC PASS' event at the same strength.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-bold text-white uppercase text-xs">RLT Monitoring</p>
                        <p>Remote Level Transmitter readings are captured in opening/closing to ensure RLT-Physical sync.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reg74Register;
