import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ArrowLeft, Download, Search, Filter, Loader,
    FileText, FileSpreadsheet, Info, ChevronRight, User, Edit2, Trash2, Moon, Sun
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../../config';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Reg74EventModal from './Reg74EventModal';
import { useTheme } from '../../context/ThemeContext';

const Reg74Register = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
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
        <div className={`p-8 min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950 text-white' : 'bg-[#FDFDFF]'}`}>
            {/* Header */}
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/registers/reg74')} className={`p-4 rounded-3xl shadow-sm border transition ${isDark ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-indigo-400' : 'bg-white border-gray-100 text-gray-500 hover:text-blue-600'}`}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isDark ? 'bg-indigo-900/40 text-indigo-300' : 'bg-gray-900 text-white'}`}>Register 74</span>
                            <button onClick={toggleTheme} className={`p-2 rounded-xl transition ${isDark ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-white border border-gray-100'}`}>
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        </div>
                        <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{vat?.vatCode} Operational Ledger</h1>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Live system-generated WB excise compliance view</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportPDF} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-900 text-white hover:bg-blue-600'}`}>
                        <Download size={18} /> Export Statutory PDF
                    </button>
                    <button onClick={fetchEvents} className={`p-4 rounded-2xl border transition-all flex justify-center shadow-sm ${isDark ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-indigo-400' : 'bg-white border-gray-100 hover:border-blue-500 text-gray-600'}`}>
                        <Search size={24} />
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className={`max-w-[1600px] mx-auto p-6 rounded-[2rem] shadow-sm border mb-8 flex flex-wrap gap-8 items-end transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="flex-1 min-w-[300px]">
                    <label className="block text-[10px] font-black text-gray-500 mb-3 uppercase tracking-widest">Date Range Selection</label>
                    <div className="flex items-center gap-4">
                        <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className={`flex-1 p-3 rounded-xl text-xs font-bold border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                        <ChevronRight size={16} className="text-gray-400" />
                        <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className={`flex-1 p-3 rounded-xl text-xs font-bold border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} />
                    </div>
                </div>
                <button onClick={fetchEvents} className={`px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    Refresh Ledger
                </button>
            </div>

            {/* Statutory Table */}
            <div className={`max-w-[1600px] mx-auto rounded-[3rem] shadow-xl border overflow-hidden transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[2400px]">
                        <thead>
                            <tr className={`text-[10px] font-black uppercase tracking-[0.1em] ${isDark ? 'bg-black text-gray-400' : 'bg-gray-900 text-white'}`}>
                                <th className="p-5 border-r border-gray-800" rowSpan="2">Time / User</th>
                                <th className="p-5 border-r border-gray-800" rowSpan="2">Operation</th>
                                <th className={`p-3 text-center border-r border-gray-800 ${isDark ? 'bg-blue-900/40' : 'bg-blue-600/20'}`} colSpan="7">Opening Balance (Cols 1-7)</th>
                                <th className={`p-3 text-center border-r border-gray-800 ${isDark ? 'bg-green-900/40' : 'bg-green-600/20'}`} colSpan="4">Spirit Receipt (Cols 8-11)</th>
                                <th className={`p-3 text-center border-r border-gray-800 ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-600/20'}`} colSpan="4">Issue to VAT (Cols 12-15)</th>
                                <th className={`p-3 text-center border-r border-gray-800 ${isDark ? 'bg-orange-900/40' : 'bg-orange-600/20'}`} colSpan="4">Increase (Cols 16-19)</th>
                                <th className={`p-3 text-center border-r border-gray-800 ${isDark ? 'bg-red-900/40' : 'bg-red-600/20'}`} colSpan="3">Wastage (Cols 22-24)</th>
                                <th className={`p-3 text-center border-r border-gray-800 ${isDark ? 'bg-purple-900/40' : 'bg-purple-600/20'}`} colSpan="9">Production Issue (Cols 25-33)</th>
                                <th className={`p-3 text-center ${isDark ? 'bg-gray-800/40' : 'bg-gray-600/20'}`} colSpan="4">Closing Balance (Cols 34-37)</th>
                                <th className="p-5 border-l border-gray-800" rowSpan="2">Actions</th>
                            </tr>
                            <tr className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'bg-gray-900 text-gray-500' : 'bg-gray-800 text-gray-400 font-bold'}`}>
                                <th className="p-2 border-r border-gray-700">Dip</th><th className="p-2 border-r border-gray-700">Temp</th>
                                <th className="p-2 border-r border-gray-700">Ind</th><th className="p-2 border-r border-gray-700">Str</th>
                                <th className="p-2 border-r border-gray-700">BL</th><th className="p-2 border-r border-gray-700">AL</th><th className="p-2 border-r border-gray-700">RLT</th>
                                <th className="p-2 border-r border-gray-700">Src</th><th className="p-2 border-r border-gray-700">BL</th>
                                <th className="p-2 border-r border-gray-700">Str</th><th className="p-2 border-r border-gray-700">AL</th>
                                <th className="p-2 border-r border-gray-700">Dest</th><th className="p-2 border-r border-gray-700">Cask</th>
                                <th className="p-2 border-r border-gray-700">BL</th><th className="p-2 border-r border-gray-700">Str</th>
                                <th className="p-2 border-r border-gray-700">Inc BL</th><th className="p-2 border-r border-gray-700">Audit</th>
                                <th className="p-2 border-r border-gray-700">Dip</th><th className="p-2 border-r border-gray-700">AL</th>
                                <th className="p-2 border-r border-gray-700">Loss BL</th><th className="p-2 border-r border-gray-700">Audit</th><th className="p-2 border-r border-gray-700">AL</th>
                                <th className="p-2 border-r border-gray-700">RLT BL</th><th className="p-2 border-r border-gray-700">Str</th><th className="p-2 border-r border-gray-700">AL</th>
                                <th className="p-2 border-r border-gray-700">Vats</th><th className="p-2 border-r border-gray-700">MFM BL</th><th className="p-2 border-r border-gray-700">Dens</th>
                                <th className="p-2 border-r border-gray-700">Str</th><th className="p-2 border-r border-gray-700">AL</th><th className="p-2 border-r border-gray-700">Dead</th>
                                <th className="p-2 border-r border-gray-700">Dip</th><th className="p-2 border-r border-gray-700">BL</th>
                                <th className="p-2 border-r border-gray-700">Str</th><th className="p-2">AL</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-gray-800 text-gray-300' : 'divide-gray-100 text-gray-600'}`}>
                            {loading ? (
                                <tr><td colSpan="42" className="p-24 text-center font-black text-gray-600 uppercase text-xs tracking-[0.8em]">Synchronizing Statutory Data...</td></tr>
                            ) : events.length === 0 ? (
                                <tr><td colSpan="42" className="p-24 text-center font-bold text-gray-500">No events found for the selected period.</td></tr>
                            ) : (
                                events.map((e, idx) => {
                                    const op = e.openingData || {};
                                    const rec = e.receiptData || {};
                                    const iss = e.issueData || {};
                                    const adj = e.adjustmentData || {};
                                    const prd = e.productionData || {};
                                    const cls = e.closingData || {};

                                    return (
                                        <tr key={idx} className={`transition-colors text-[10px] font-bold ${isDark ? 'hover:bg-indigo-900/10' : 'hover:bg-blue-50/30'}`}>
                                            <td className={`p-4 border-r whitespace-nowrap ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50/50'}`}>
                                                <div className={isDark ? 'text-white' : 'text-gray-900'}>{format(new Date(e.eventDateTime), 'dd MMM HH:mm')}</div>
                                                <div className={`text-[7px] uppercase flex items-center gap-2 mt-1 ${isDark ? 'text-indigo-400' : 'text-blue-500'}`}><User size={10} /> {e.user?.name || 'System'}</div>
                                            </td>
                                            <td className={`p-4 border-r font-black uppercase tracking-tighter ${isDark ? 'border-gray-800 text-white' : 'border-gray-100 text-gray-900'}`}>{e.eventType.replace('_', ' ')}</td>

                                            {/* Cols 1-7 */}
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{op.dipCm || '-'}</td>
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{op.temp || '-'}</td>
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{op.alcInd || '-'}</td>
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{op.strength || '-'}</td>
                                            <td className={`p-2 border-r text-center font-black ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{op.volumeBl?.toLocaleString() || '-'}</td>
                                            <td className={`p-2 border-r text-center font-black ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{(op.volumeBl * (op.strength / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td>
                                            <td className={`p-2 border-r text-center text-gray-500 italic ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{op.rltDipCm || '-'}</td>

                                            {/* Cols 8-11 */}
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{rec.source || '-'}</td>
                                            <td className={`p-2 border-r text-center font-black text-green-500 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{rec.qtyBl?.toLocaleString() || '-'}</td>
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{rec.strength || '-'}</td>
                                            <td className={`p-2 border-r text-center font-black text-green-500 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{(rec.qtyBl * (rec.strength / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td>

                                            {/* Cols 12-15 */}
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{iss.dest || '-'}</td>
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{iss.caskNo || '-'}</td>
                                            <td className={`p-2 border-r text-center font-black ${isDark ? 'border-gray-800 text-indigo-400' : 'border-gray-100 text-indigo-600'}`}>{iss.qtyBl?.toLocaleString() || '-'}</td>
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{iss.strength || '-'}</td>

                                            {/* Cols 16-19 */}
                                            <td className={`p-2 border-r text-center font-black text-orange-500 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{adj.type === 'INCREASE' ? adj.qtyBl?.toLocaleString() : '-'}</td>
                                            <td className={`p-2 border-r text-center text-[8px] leading-tight ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                                                {adj.type === 'INCREASE' ? (adj.reason || '-') : '-'}
                                            </td>
                                            <td className={`p-2 border-r text-center text-gray-500 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{adj.rltDip || '-'}</td>
                                            <td className={`p-2 border-r text-center font-black text-orange-500 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                                                {adj.type === 'INCREASE' ? (adj.qtyAl || (adj.qtyBl * adj.strength / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                            </td>

                                            {/* Cols 22-24 */}
                                            <td className={`p-2 border-r text-center font-black text-red-500 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{adj.type === 'WASTAGE' ? adj.qtyBl?.toLocaleString() : '-'}</td>
                                            <td className={`p-2 border-r text-center text-[8px] leading-tight ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                                                {adj.type === 'WASTAGE' ? (adj.reason || '-') : '-'}
                                            </td>
                                            <td className={`p-2 border-r text-center font-black text-red-500 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                                                {adj.type === 'WASTAGE' ? (adj.qtyAl || (adj.qtyBl * adj.strength / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                            </td>

                                            {/* Cols 25-33 */}
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{prd.rltBl?.toLocaleString() || '-'}</td>
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{prd.strength || '-'}</td>
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{(prd.rltBl * (prd.strength / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td>
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{prd.vatCount || '-'}</td>
                                            <td className={`p-2 border-r text-center font-black ${isDark ? 'border-gray-800 text-purple-400' : 'border-gray-100 text-purple-600'}`}>{prd.mfmBl?.toLocaleString() || '-'}</td>
                                            <td className={`p-2 border-r text-center text-gray-500 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{prd.density || '-'}</td>
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{prd.mfmStrength || prd.strength || '-'}</td>
                                            <td className={`p-2 border-r text-center font-black ${isDark ? 'border-gray-800 text-purple-400' : 'border-gray-100 text-purple-600'}`}>{(prd.mfmBl * ((prd.mfmStrength || prd.strength) / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td>
                                            <td className={`p-2 border-r text-center text-red-400 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{prd.deadStockAl || '-'}</td>

                                            {/* Cols 34-37 */}
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{cls.finalDipCm || '-'}</td>
                                            <td className={`p-2 border-r text-center font-black ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{cls.finalBl?.toLocaleString() || '-'}</td>
                                            <td className={`p-2 border-r text-center ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>{cls.finalStrength || '-'}</td>
                                            <td className={`p-2 text-center font-black border-r ${isDark ? 'border-gray-800 text-white' : 'border-gray-100 text-gray-900'}`}>{(cls.finalBl * (cls.finalStrength / 100))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td>

                                            {/* Actions */}
                                            <td className={`p-4 text-center ${isDark ? 'bg-gray-800/40' : 'bg-gray-50'}`}>
                                                <div className="flex items-center justify-center gap-3">
                                                    <button onClick={() => handleEdit(e)} className={`p-2 rounded-xl transition-all ${isDark ? 'text-indigo-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-100'}`} title="Edit Event">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(e.id)} className="p-2 text-red-500 hover:bg-red-100/10 rounded-xl transition-all" title="Delete Event">
                                                        <Trash2 size={16} />
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
