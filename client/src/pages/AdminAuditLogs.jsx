import { useEffect, useState } from "react";
import axios from 'axios';
import { API_URL } from '../config';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Download, ChevronLeft, ChevronRight, Search, Shield, Filter } from 'lucide-react';

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const [filters, setFilters] = useState({
        action: '',
        entityType: '',
        userId: ''
    });

    const { isDark } = useTheme();
    const navigate = useNavigate();
    const limit = 20;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = { page, limit, ...filters };
            // Remove empty filters
            Object.keys(params).forEach(key => !params[key] && delete params[key]);

            const res = await axios.get(`${API_URL}/api/audit-logs`, {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });

            setLogs(res.data.logs);
            setTotalPages(res.data.pagination.pages);
            setTotalLogs(res.data.pagination.total);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
            if (error.response && error.response.status === 403) {
                alert("Access Denied: Admin only.");
                navigate('/dashboard');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filters]); // Re-fetch when page or filters change

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1); // Reset to page 1 on filter change
    };

    const exportCSV = () => {
        const csvContent = [
            ["Time", "User", "Action", "Entity Type", "Entity ID", "Metadata"],
            ...logs.map(log => [
                new Date(log.createdAt).toLocaleString(),
                log.user?.name || log.userId,
                log.action,
                log.entityType,
                log.entityId || '-',
                JSON.stringify(log.metadata || {}).replace(/"/g, '""') // Escape quotes
            ])
        ]
            .map(e => e.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    const getActionColor = (action) => {
        if (action.includes('DELETE')) return 'text-red-600 bg-red-100';
        if (action.includes('UPLOAD') || action.includes('CREATE')) return 'text-green-600 bg-green-100';
        if (action.includes('LOGIN')) return 'text-blue-600 bg-blue-100';
        return 'text-gray-600 bg-gray-100';
    };

    return (
        <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Shield className="text-blue-600" />
                                Audit Logs
                            </h1>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Tracking system activities for compliance
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={refresh => fetchLogs()}
                            className={`p-2 rounded-lg border flex items-center gap-2 ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            onClick={exportCSV}
                            className="p-2 rounded-lg bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700 shadow-lg"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className={`p-4 rounded-xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">Action</label>
                            <select
                                name="action"
                                value={filters.action}
                                onChange={handleFilterChange}
                                className={`w-full p-2.5 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'}`}
                            >
                                <option value="">All Actions</option>
                                <option value="LOGIN">Login</option>
                                <option value="DOCUMENT_UPLOAD">Document Upload</option>
                                <option value="DOCUMENT_DELETE">Document Delete</option>
                                <option value="DOCUMENT_DOWNLOAD">Document Download</option>
                                <option value="REGISTER_CREATE">Register Create</option>
                                <option value="REGISTER_DELETE">Register Delete</option>
                            </select>
                        </div>
                        <div className="flex-1 w-full">
                            <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">Entity Type</label>
                            <select
                                name="entityType"
                                value={filters.entityType}
                                onChange={handleFilterChange}
                                className={`w-full p-2.5 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'}`}
                            >
                                <option value="">All Entities</option>
                                <option value="AUTH">Auth</option>
                                <option value="DOCUMENT">Document</option>
                                <option value="REGISTER">Register</option>
                            </select>
                        </div>

                        {/*  Add User search if needed, currently userId input is manual ID */}
                    </div>
                </div>

                {/* Table */}
                <div className={`rounded-xl shadow-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className={`text-xs uppercase font-bold ${isDark ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                                <tr>
                                    <th className="p-4">Timestamp</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Entity</th>
                                    <th className="p-4">Metadata</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading logs...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No logs found matching criteria.</td></tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className={`group ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                                            <td className="p-4 text-sm font-mono text-gray-500">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-sm">{log.user?.name || `User #${log.userId}`}</div>
                                                <div className="text-xs text-gray-500">{log.user?.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm">
                                                <div className="font-medium">{log.entityType}</div>
                                                {log.entityId && <div className="text-xs text-mono text-gray-500">ID: {log.entityId}</div>}
                                            </td>
                                            <td className="p-4 text-sm max-w-xs truncate cursor-help" title={JSON.stringify(log.metadata, null, 2)}>
                                                {JSON.stringify(log.metadata)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className={`p-4 border-t flex items-center justify-between ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalLogs)}</span> of <span className="font-medium">{totalLogs}</span> entries
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            );
}
