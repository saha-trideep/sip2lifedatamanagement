import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ArrowLeft, Download, Search, Filter, Loader,
    FileText, FileSpreadsheet, Info, ChevronRight, User, Edit2, Trash2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../config';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Reg74EventModal from './Reg74EventModal';

const Reg74Register = () => {
    const navigate = useNavigate();
    const { vatId } = useParams();
    const [vat, setVat] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event? This will affect live balances.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/reg74/event/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEvents();
        } catch (error) {
            alert("Error deleting event");
        }
    };

    const handleEdit = (event) => {
        setSelectedEvent(event);
        setShowEditModal(true);
    };

    const exportPDF = () => {
        const doc = jsPDF({ orientation: 'landscape', format: 'a3' });
        doc.setFontSize(18);
        doc.text(`EXCISE REGISTER REG-74: SPIRIT STORAGE & BLENDING (${vat?.vatCode})`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${format(new Date(), 'dd/MMM/yyyy HH:mm')} | Period: ${filters.startDate} to ${filters.endDate}`, 14, 28);

        const tableColumn = [
            "Date", "Op", "Dip", "Temp", "Str", "Open BL", "Open AL",
            "Src", "MFM-I BL", "MFM-I Str", "MFM-I AL",
            "Dest", "Qty BL", "Str",
            "Inc BL", "Inc AL",
            "Loss BL", "Loss AL",
            "RLT BL", "Str", "RLT AL", "MFM-II BL", "MFM-II Str", "MFM-II AL",
            "Final Dip", "Final BL", "Final Str", "Final AL"
        ];

        let runningAl = 0; // Simplified for report

        const tableRows = events.map(e => {
            const open = e.openingData || {};
            const rec = e.receiptData || {};
            const issue = e.issueData || {};
            const adj = e.adjustmentData || {};
            const prod = e.productionData || {};
            const close = e.closingData || {};

            return [
                format(new Date(e.eventDateTime), 'dd/MM HH:mm'),
                e.eventType,
                open.dipCm || '', open.temp || '', open.strength || '', open.volumeBl || '', open.volumeAl || '',
                rec.source || '', rec.qtyBl || '', rec.strength || '', (rec.qtyBl * (rec.strength / 100))?.toFixed(2) || '',
                issue.dest || '', issue.qtyBl || '', issue.strength || '',
                adj.type === 'INCREASE' ? adj.qtyBl : '', adj.type === 'INCREASE' ? adj.qtyAl : '',
                adj.type === 'WASTAGE' ? adj.qtyBl : '', adj.type === 'WASTAGE' ? adj.qtyAl : '',
                prod.rltBl || '', prod.strength || '', prod.rltAl || '', prod.mfmBl || '', prod.mfmStrength || '', prod.mfmAl || '',
                close.finalDipCm || '', close.finalBl || '', close.finalStrength || '', close.finalAl || ''
            ];
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            styles: { fontSize: 6, cellPadding: 1 },
            headStyles: { fillColor: [15, 23, 42], textColor: 255 }
        });

        doc.save(`Reg74_${vat?.vatCode}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    return (
        <div className="p-8 min-h-screen bg-[#FDFDFF]">
            {/* Header */}
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/registers/reg74')} className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition text-gray-500 hover:text-blue-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black bg-gray-900 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Register 74</span>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{vat?.vatCode} Operational Ledger</h1>
                        </div>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Live system-generated WB excise compliance view</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportPDF} className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                        <Download size={16} /> Export Statutory PDF
                    </button>
                    <button onClick={fetchEvents} className="p-3 bg-white border border-gray-100 rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all flex justify-center shadow-sm">
                        <Search size={20} />
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="max-w-[1600px] mx-auto bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Date Range Selection</label>
                    <div className="flex items-center gap-3">
                        <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" />
                        <ChevronRight size={14} className="text-gray-300" />
                        <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold" />
                    </div>
                </div>
                <div>
                    <button onClick={fetchEvents} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">
                        Record Filter
                    </button>
                </div>
            </div>

            {/* Statutory Table */}
            <div className="max-w-[1600px] mx-auto bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[2200px]">
                        <thead>
                            <tr className="bg-gray-900 text-white text-[9px] font-black uppercase tracking-[0.1em]">
                                <th className="p-4 border-r border-gray-800" rowSpan="2">Time / User</th>
                                <th className="p-4 border-r border-gray-800" rowSpan="2">Operation</th>
                                <th className="p-2 text-center border-r border-gray-800 bg-blue-600/20" colSpan="7">Opening Balance (Cols 1-7)</th>
                                <th className="p-2 text-center border-r border-gray-800 bg-green-600/20" colSpan="4">Spirit Receipt (Cols 8-11)</th>
                                <th className="p-2 text-center border-r border-gray-800 bg-indigo-600/20" colSpan="4">Issue to VAT (Cols 12-15)</th>
                                <th className="p-2 text-center border-r border-gray-800 bg-orange-600/20" colSpan="4">Increase (Cols 16-19)</th>
                                <th className="p-2 text-center border-r border-gray-800 bg-red-600/20" colSpan="3">Wastage (Cols 22-24)</th>
                                <th className="p-2 text-center border-r border-gray-800 bg-purple-600/20" colSpan="9">Production Issue (Cols 25-33)</th>
                                <th className="p-2 text-center bg-gray-600/20" colSpan="4">Closing Balance (Cols 34-37)</th>
                                <th className="p-4 border-l border-gray-800" rowSpan="2">Actions</th>
                            </tr>
                            <tr className="bg-gray-800 text-gray-400 text-[8px] font-black uppercase tracking-widest">
                                {/* Opening 1-7 */}
                                <th className="p-2 border-r border-gray-700">Dip</th><th className="p-2 border-r border-gray-700">Temp</th>
                                <th className="p-2 border-r border-gray-700">Ind</th><th className="p-2 border-r border-gray-700">Str</th>
                                <th className="p-2 border-r border-gray-700">BL</th><th className="p-2 border-r border-gray-700">AL</th><th className="p-2 border-r border-gray-700">RLT</th>
                                {/* Receipt 8-11 */}
                                <th className="p-2 border-r border-gray-700">Src</th><th className="p-2 border-r border-gray-700">BL</th>
                                <th className="p-2 border-r border-gray-700">Str</th><th className="p-2 border-r border-gray-700">AL</th>
                                {/* Issue 12-15 */}
                                <th className="p-2 border-r border-gray-700">Dest</th><th className="p-2 border-r border-gray-700">Cask</th>
                                <th className="p-2 border-r border-gray-700">BL</th><th className="p-2 border-r border-gray-700">Str</th>
                                {/* Inc 16-19 */}
                                <th className="p-2 border-r border-gray-700">Inc BL</th><th className="p-2 border-r border-gray-700">Audit</th>
                                <th className="p-2 border-r border-gray-700">Dip</th><th className="p-2 border-r border-gray-700">AL</th>
                                {/* Loss 22-24 */}
                                <th className="p-2 border-r border-gray-700">Loss BL</th><th className="p-2 border-r border-gray-700">Audit</th><th className="p-2 border-r border-gray-700">AL</th>
                                {/* Prod 25-33 */}
                                <th className="p-2 border-r border-gray-700">RLT BL</th><th className="p-2 border-r border-gray-700">Str</th><th className="p-2 border-r border-gray-700">AL</th>
                                <th className="p-2 border-r border-gray-700">Vats</th><th className="p-2 border-r border-gray-700">MFM BL</th><th className="p-2 border-r border-gray-700">Dens</th>
                                <th className="p-2 border-r border-gray-700">Str</th><th className="p-2 border-r border-gray-700">AL</th><th className="p-2 border-r border-gray-700">Dead</th>
                                {/* Closing 34-37 */}
                                <th className="p-2 border-r border-gray-700">Dip</th><th className="p-2 border-r border-gray-700">BL</th>
                                <th className="p-2 border-r border-gray-700">Str</th><th className="p-2">AL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="42" className="p-20 text-center font-black text-gray-300 uppercase text-xs tracking-[0.5em]">Synchronizing Statutory Data...</td></tr>
                            ) : events.length === 0 ? (
                                <tr><td colSpan="42" className="p-20 text-center font-bold text-gray-400">No events found for the selected period.</td></tr>
                            ) : (
                                events.map((e, idx) => {
                                    const op = e.openingData || {};
                                    const rec = e.receiptData || {};
                                    const iss = e.issueData || {};
                                    const adj = e.adjustmentData || {};
                                    const prd = e.productionData || {};
                                    const cls = e.closingData || {};

                                    return (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors text-[9px] font-bold text-gray-600">
                                            <td className="p-3 border-r border-gray-100 whitespace-nowrap bg-gray-50/50">
                                                <div className="text-gray-900">{format(new Date(e.eventDateTime), 'dd MMM HH:mm')}</div>
                                                <div className="text-[7px] text-blue-500 uppercase flex items-center gap-1 mt-0.5"><User size={8} /> {e.user?.name || 'System'}</div>
                                            </td>
                                            <td className="p-3 border-r border-gray-100 font-black text-gray-900 uppercase tracking-tighter">{e.eventType.replace('_', ' ')}</td>

                                            {/* Cols 1-7 */}
                                            <td className="p-2 border-r border-gray-100 text-center">{op.dipCm || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center">{op.temp || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center">{op.alcInd || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center">{op.strength || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center font-black">{op.volumeBl?.toLocaleString() || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center font-black">{(op.volumeBl * (op.strength / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center text-gray-400">{op.rltDipCm || '-'}</td>

                                            {/* Cols 8-11 */}
                                            <td className="p-2 border-r border-gray-100 text-center">{rec.source || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center font-black text-green-600">{rec.qtyBl?.toLocaleString() || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center">{rec.strength || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center font-black text-green-600">{(rec.qtyBl * (rec.strength / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td>

                                            {/* Cols 12-15 */}
                                            <td className="p-2 border-r border-gray-100 text-center">{iss.dest || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center">{iss.caskNo || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center font-black text-indigo-600">{iss.qtyBl?.toLocaleString() || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center">{iss.strength || '-'}</td>

                                            {/* Cols 16-19 */}
                                            <td className="p-2 border-r border-gray-100 text-center font-black text-orange-600">{adj.type === 'INCREASE' ? adj.qtyBl?.toLocaleString() : '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center text-[7px] leading-tight">
                                                {adj.type === 'INCREASE' ? (adj.reason || '-') : '-'}
                                            </td>
                                            <td className="p-2 border-r border-gray-100 text-center text-gray-400">{adj.rltDip || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center font-black text-orange-600">
                                                {adj.type === 'INCREASE' ? (adj.qtyAl || (adj.qtyBl * adj.strength / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                            </td>

                                            {/* Cols 22-24 */}
                                            <td className="p-2 border-r border-gray-100 text-center font-black text-red-600">{adj.type === 'WASTAGE' ? adj.qtyBl?.toLocaleString() : '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center text-[7px] leading-tight">
                                                {adj.type === 'WASTAGE' ? (adj.reason || '-') : '-'}
                                            </td>
                                            <td className="p-2 border-r border-gray-100 text-center font-black text-red-600">
                                                {adj.type === 'WASTAGE' ? (adj.qtyAl || (adj.qtyBl * adj.strength / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                            </td>

                                            {/* Cols 25-33 */}
                                            <td className="p-2 border-r border-gray-100 text-center">{prd.rltBl?.toLocaleString() || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center">{prd.strength || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center">{(prd.rltBl * (prd.strength / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center">{prd.vatCount || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center font-black text-purple-600">{prd.mfmBl?.toLocaleString() || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center text-gray-400">{prd.density || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center">{prd.mfmStrength || prd.strength || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center font-black text-purple-600">{(prd.mfmBl * ((prd.mfmStrength || prd.strength) / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center text-red-400">{prd.deadStockAl || '-'}</td>

                                            {/* Cols 34-37 */}
                                            <td className="p-2 border-r border-gray-100 text-center">{cls.finalDipCm || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center font-black">{cls.finalBl?.toLocaleString() || '-'}</td>
                                            <td className="p-2 border-r border-gray-100 text-center">{cls.finalStrength || '-'}</td>
                                            <td className="p-2 text-center font-black border-r border-gray-100">{(cls.finalBl * (cls.finalStrength / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td>

                                            {/* Actions */}
                                            <td className="p-2 text-center bg-gray-50">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEdit(e)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="Edit Event">
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button onClick={() => handleDelete(e.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all" title="Delete Event">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showEditModal && (
                <Reg74EventModal
                    vat={vat}
                    type={selectedEvent?.eventType}
                    initialData={selectedEvent}
                    onClose={() => {
                        setShowEditModal(false);
                        fetchEvents();
                    }}
                />
            )}
        </div>
    );
};

export default Reg74Register;
