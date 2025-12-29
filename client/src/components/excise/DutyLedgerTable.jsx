import React from 'react';
import {
    Calendar, TrendingUp, CreditCard, AlertCircle,
    ArrowRight, ChevronDown, ChevronUp, Edit, Trash2,
    CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';

const DutyLedgerTable = ({ entries, loading, onEdit, onDelete, isDark }) => {
    const [expandedRow, setExpandedRow] = React.useState(null);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            'FULLY_PAID': {
                bg: isDark ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-green-50 text-green-700 border-green-100',
                icon: <CheckCircle2 size={12} className="mr-1" />,
                label: 'Paid'
            },
            'PARTIAL_PAID': {
                bg: isDark ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800' : 'bg-yellow-50 text-yellow-700 border-yellow-100',
                icon: <Clock size={12} className="mr-1" />,
                label: 'Partial'
            },
            'PENDING': {
                bg: isDark ? 'bg-red-900/20 text-red-400 border-red-800' : 'bg-red-50 text-red-700 border-red-100',
                icon: <AlertTriangle size={12} className="mr-1" />,
                label: 'Pending'
            }
        };

        const badge = badges[status] || badges['PENDING'];

        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center w-fit ${badge.bg}`}>
                {badge.icon} {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="p-20 text-center">
                <div className={`animate-spin inline-block w-8 h-8 border-4 border-t-indigo-600 border-gray-200 rounded-full mb-4`}></div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Updating Register...</p>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="p-20 text-center">
                <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No ledger entries found for this period</p>
                <p className="text-gray-400 text-xs mt-2 italic shadow-sm">Please create a new duty entry to start tracking.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className={`${isDark ? 'bg-gray-800/30 text-gray-400' : 'bg-gray-50 text-gray-500'} text-[10px] font-black uppercase tracking-widest border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                        <th className="px-8 py-4">Period / Strength</th>
                        <th className="px-8 py-4">BL Issued</th>
                        <th className="px-8 py-4">Duty Accrued</th>
                        <th className="px-8 py-4">Total Paid</th>
                        <th className="px-8 py-4">Balance</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                    {entries.map((entry) => (
                        <React.Fragment key={entry.id}>
                            <tr
                                className={`group hover:bg-indigo-600/5 transition-colors cursor-pointer ${expandedRow === entry.id ? (isDark ? 'bg-indigo-600/10' : 'bg-blue-50/50') : ''}`}
                                onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                            >
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-blue-600 group-hover:text-white'} transition-all`}>
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatDate(entry.monthYear)}</p>
                                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{entry.subcategory}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="font-mono font-bold text-sm tracking-tighter">{entry.totalBlIssued} L</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-black">Bulk Liters</p>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="font-black text-sm tracking-tighter">{formatCurrency(entry.dutyAccrued)}</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">₹{entry.applicableRate}/BL</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={12} className="text-green-500" />
                                        <p className="font-black text-sm tracking-tighter text-green-500">{formatCurrency(entry.totalPayments)}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <p className={`font-black text-sm tracking-tighter ${entry.closingBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {formatCurrency(entry.closingBalance)}
                                    </p>
                                </td>
                                <td className="px-8 py-6">
                                    {getStatusBadge(entry.status)}
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => onEdit(entry)}
                                            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-indigo-400' : 'hover:bg-indigo-50 text-gray-400 hover:text-indigo-600'}`}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(entry.id)}
                                            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button className={`p-2 rounded-lg`}>
                                            {expandedRow === entry.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            {/* Expanded Row: Challan Details */}
                            {expandedRow === entry.id && (
                                <tr>
                                    <td colSpan="7" className={`px-8 py-0 border-b ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50/50 border-gray-100'}`}>
                                        <div className="py-8 animate-in slide-in-from-top-4 duration-300">
                                            <div className="flex justify-between items-center mb-6">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                                                    <CreditCard size={14} /> Treasury Challan History
                                                </h4>
                                            </div>

                                            {entry.challans && entry.challans.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {entry.challans.map((challan) => (
                                                        <div key={challan.id} className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} shadow-sm flex justify-between items-center`}>
                                                            <div>
                                                                <p className="text-xs font-black tracking-tight">{challan.challanNumber}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                                                    {new Date(challan.challanDate).toLocaleDateString('en-IN')}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-black text-green-500">{formatCurrency(challan.amountPaid)}</p>
                                                                <div className="flex items-center justify-end gap-1">
                                                                    {challan.verificationStatus === 'VERIFIED' ? (
                                                                        <>
                                                                            <CheckCircle2 size={10} className="text-green-500" />
                                                                            <span className="text-[8px] font-black uppercase text-green-500 tracking-tighter">Verified</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Clock size={10} className="text-orange-500" />
                                                                            <span className="text-[8px] font-black uppercase text-orange-500 tracking-tighter">Pending</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className={`p-8 rounded-2xl border-2 border-dashed ${isDark ? 'border-gray-800' : 'border-gray-100'} text-center`}>
                                                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">No payments recorded for this entry yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DutyLedgerTable;
