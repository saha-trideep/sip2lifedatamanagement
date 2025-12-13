import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import {
    FileText, Upload, Download, Trash2, FileSpreadsheet,
    Image as ImageIcon, Loader, ArrowLeft, Search, Filter,
    Folder, FolderPlus, Grid, List as ListIcon, MoreVertical, X
} from 'lucide-react';
import { API_URL } from '../config';

const DEPARTMENTS = ["General", "Maintenance", "Sales", "Excise", "HR", "Production"];

const Documents = () => {
    // Data State
    const [docs, setDocs] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter State
    const [search, setSearch] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedFolder, setSelectedFolder] = useState('All'); // 'All' | 'Unsorted' | folderId
    const [sort, setSort] = useState('newest');

    // UI State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);

    // Meta-Form State (for upload)
    const [uploadFile, setUploadFile] = useState(null);
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDesc, setMetaDesc] = useState('');
    const [metaDept, setMetaDept] = useState('General');
    const [metaFolder, setMetaFolder] = useState('');

    useEffect(() => {
        fetchData();
        fetchFolders();
    }, [selectedDept, selectedFolder, sort, search]); // Re-fetch on filter change

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                search,
                department: selectedDept,
                folderId: selectedFolder,
                sort
            };
            const res = await axios.get(`${API_URL}/api/documents`, { params });
            setDocs(res.data);
        } catch (error) {
            console.error("Fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFolders = async () => {
        try {
            // Fetch folders relevant to department? For now fetch all
            const res = await axios.get(`${API_URL}/api/folders`, {
                params: { department: selectedDept }
            });
            setFolders(res.data);
        } catch (e) { console.error(e); }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', metaTitle);
        formData.append('description', metaDesc);
        formData.append('department', metaDept);
        if (metaFolder) formData.append('folderId', metaFolder);

        // Mock User ID (In real app, get from auth context)
        const user = JSON.parse(localStorage.getItem('user'));
        formData.append('userId', user ? user.id : 1);

        try {
            const response = await axios.post(`${API_URL}/api/documents/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowUploadModal(false);
            setUploadFile(null);
            resetForm();
            await fetchData(); // Wait for refresh
            alert(`✅ Document "${response.data.title}" uploaded successfully!`);
        } catch (err) {
            console.error("Client Upload Error:", err);
            // Try to extract the real error message from the server response
            let msg = err.message;
            if (err.response && err.response.data) {
                if (err.response.data.error) msg = err.response.data.error;
                if (err.response.data.details) msg += " - " + JSON.stringify(err.response.data.details);
            }
            alert("Upload Failed: " + msg);
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await axios.post(`${API_URL}/api/folders`, {
                name: metaTitle, // reusing state var for folder name
                department: metaDept,
                userId: user ? user.id : 1
            });
            setShowFolderModal(false);
            setMetaTitle('');
            fetchFolders();
        } catch (e) { alert("Failed to create folder"); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this document?")) return;
        try {
            await axios.delete(`${API_URL}/api/documents/${id}`);
            setDocs(docs.filter(d => d.id !== id));
        } catch (e) { alert("Delete failed"); }
    };

    const handleDeleteFolder = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Delete this folder? Documents inside will be unsorted.")) return;
        try {
            await axios.delete(`${API_URL}/api/folders/${id}`);
            fetchFolders();
            if (selectedFolder == id) setSelectedFolder('All');
        } catch (e) { alert("Delete failed"); }
    }

    const resetForm = () => {
        setMetaTitle('');
        setMetaDesc('');
        setMetaDept('General');
        setMetaFolder('');
    };

    // Dropzone logic (only sets file, opens modal)
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles?.length > 0) {
            setUploadFile(acceptedFiles[0]);
            // Default Title from filename (remove extension and sanitize)
            const safeTitle = acceptedFiles[0].name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9 ]/g, " ");
            setMetaTitle(safeTitle);
            // Auto-select current department filter if not "All"
            if (selectedDept !== 'All') {
                setMetaDept(selectedDept);
            }
            setShowUploadModal(true);
        }
    }, [selectedDept]);
    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    const getIcon = (type) => {
        if (!type) return <FileText className="text-gray-400" />;
        const t = type.toLowerCase();
        if (t.includes('pdf')) return <FileText className="text-red-500" />;
        if (t.includes('xls') || t.includes('sheet') || t.includes('csv')) return <FileSpreadsheet className="text-green-500" />;
        if (t.includes('png') || t.includes('jpg')) return <ImageIcon className="text-blue-500" />;
        return <FileText className="text-gray-500" />;
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Hidden dropzone input */}
            <input {...getInputProps()} style={{ display: 'none' }} id="dropzone-input" />

            {/* Sidebar Filters */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-6">
                        <a href="/dashboard" className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"><ArrowLeft size={16} /></a>
                        <h2 className="font-bold text-gray-800">Documents</h2>
                    </div>

                    <button
                        onClick={() => {
                            setUploadFile(null);
                            resetForm();
                            // Auto-select current department filter if not "All"
                            if (selectedDept !== 'All') {
                                setMetaDept(selectedDept);
                            }
                            document.getElementById('dropzone-input').click();
                        }}
                        className="w-full bg-blue-600 text-white py-2 rounded shadow hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                        <Upload size={16} /> Upload New
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Departments */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Departments</h3>
                        <ul className="space-y-1">
                            <li
                                className={`px-3 py-2 rounded cursor-pointer text-sm ${selectedDept === 'All' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                onClick={() => setSelectedDept('All')}
                            >
                                All Departments
                            </li>
                            {DEPARTMENTS.map(dept => (
                                <li
                                    key={dept}
                                    className={`px-3 py-2 rounded cursor-pointer text-sm ${selectedDept === dept ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                    onClick={() => setSelectedDept(dept)}
                                >
                                    {dept}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Folders */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Folders</h3>
                            <button onClick={() => { setShowFolderModal(true); setMetaTitle(''); }}><FolderPlus size={14} className="text-gray-400 hover:text-blue-600" /></button>
                        </div>
                        <ul className="space-y-1">
                            <li
                                className={`px-3 py-2 rounded cursor-pointer text-sm flex items-center gap-2 ${selectedFolder === 'All' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                onClick={() => setSelectedFolder('All')}
                            >
                                <Folder size={14} className="text-yellow-500 fill-yellow-500" /> All Documents
                            </li>
                            {folders.map(folder => (
                                <li
                                    key={folder.id}
                                    className={`px-3 py-2 rounded cursor-pointer text-sm flex justify-between group ${selectedFolder == folder.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                    onClick={() => setSelectedFolder(folder.id)}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <Folder size={14} className="text-yellow-500" />
                                        {folder.name}
                                    </div>
                                    <button onClick={(e) => handleDeleteFolder(folder.id, e)} className="text-gray-300 hover:text-red-500 hidden group-hover:block"><X size={12} /></button>
                                </li>
                            ))}
                            <li
                                className={`px-3 py-2 rounded cursor-pointer text-sm flex items-center gap-2 ${selectedFolder === 'Unsorted' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                onClick={() => setSelectedFolder('Unsorted')}
                            >
                                <Folder size={14} className="text-gray-300" /> Unsorted
                            </li>
                        </ul>
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 p-3 sm:p-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* Left: Back Button & Search */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                            <a
                                href="/dashboard"
                                className="flex-shrink-0 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                            >
                                <ArrowLeft size={18} className="text-gray-600" />
                            </a>
                            <div className="relative flex-1 max-w-lg">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Right: Sort & View Toggle */}
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                                <Filter size={16} />
                                <select
                                    value={sort}
                                    onChange={e => setSort(e.target.value)}
                                    className="border-none bg-transparent focus:ring-0 cursor-pointer font-medium"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="alpha_asc">A-Z</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Mobile Upload FAB (Floating Action Button) */}
                <button
                    onClick={() => {
                        setUploadFile(null);
                        resetForm();
                        if (selectedDept !== 'All') {
                            setMetaDept(selectedDept);
                        }
                        document.getElementById('dropzone-input').click();
                    }}
                    className="md:hidden fixed bottom-6 right-6 z-20 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-3xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                >
                    <Upload size={24} />
                </button>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-full"><Loader className="animate-spin text-blue-600" /></div>
                    ) : (
                        <div className="space-y-1">
                            {/* Table Header - Hidden on Mobile */}
                            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs font-semibold text-gray-500 uppercase">
                                <div className="col-span-4">Name</div>
                                <div className="col-span-2">Department</div>
                                <div className="col-span-2">Uploader</div>
                                <div className="col-span-2">Description</div>
                                <div className="col-span-2 text-right">Date</div>
                            </div>

                            {/* List */}
                            {docs.length === 0 && (
                                <div className="text-center py-20 text-gray-400">
                                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No documents found matching filters.</p>
                                </div>
                            )}

                            {docs.map(doc => (
                                <div
                                    key={doc.id}
                                    className="bg-white border border-gray-100 rounded-lg hover:shadow-md transition group"
                                >
                                    {/* Desktop Grid Layout */}
                                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 items-center">
                                        <div className="col-span-4 flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-gray-50 rounded text-gray-500">
                                                {getIcon(doc.type)}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-medium text-gray-900 truncate" title={doc.title}>{doc.title}</h4>
                                                <p className="text-xs text-gray-500 truncate" title={doc.filename}>{doc.filename}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">{doc.department}</span>
                                        </div>
                                        <div className="col-span-2 text-sm text-gray-600 truncate">
                                            {doc.user?.name || doc.user?.role || "Admin"}
                                        </div>
                                        <div className="col-span-2 text-sm text-gray-500 truncate">
                                            {doc.description || '-'}
                                        </div>
                                        <div className="col-span-2 flex items-center justify-end gap-3">
                                            <span className="text-xs text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                            <div className="hidden group-hover:flex gap-2">
                                                <a
                                                    href={`${API_URL}/${doc.path.replace(/\\/g, '/')}`}
                                                    target="_blank" rel="noreferrer"
                                                    className="p-1 text-gray-400 hover:text-blue-600"
                                                >
                                                    <Download size={16} />
                                                </a>
                                                <button onClick={() => handleDelete(doc.id)} className="p-1 text-gray-400 hover:text-red-600">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Stack Layout */}
                                    <div className="md:hidden p-3 space-y-2">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-gray-50 rounded text-gray-500 flex-shrink-0">
                                                {getIcon(doc.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 text-sm">{doc.title}</h4>
                                                <p className="text-xs text-gray-500 truncate">{doc.filename}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{doc.department}</span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{doc.user?.name || "Admin"}</span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                        </div>
                                        {doc.description && (
                                            <p className="text-xs text-gray-500">{doc.description}</p>
                                        )}
                                        <div className="flex gap-2 pt-2">
                                            <a
                                                href={`${API_URL}/${doc.path.replace(/\\/g, '/')}`}
                                                target="_blank" rel="noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                            >
                                                <Download size={14} />
                                                <span>Download</span>
                                            </a>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="flex items-center justify-center gap-2 px-3 py-2 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                            >
                                                <Trash2 size={14} />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Upload Document</h2>
                            <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-4">
                            {/* File Preview */}
                            {!uploadFile ? (
                                <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                                    <input {...getInputProps()} />
                                    <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                                    <p className="text-sm text-gray-600">Click or Drag file here</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <FileText size={20} className="text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900 truncate flex-1">{uploadFile.name}</span>
                                    <button type="button" onClick={() => setUploadFile(null)} className="text-blue-400 hover:text-blue-700"><X size={16} /></button>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
                                <input required type="text" className="w-full p-2 border rounded-lg" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="e.g. Monthly Production Report" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <select className="w-full p-2 border rounded-lg" value={metaDept} onChange={e => setMetaDept(e.target.value)}>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
                                    <select className="w-full p-2 border rounded-lg" value={metaFolder} onChange={e => setMetaFolder(e.target.value)}>
                                        <option value="">Unsorted</option>
                                        {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <textarea className="w-full p-2 border rounded-lg" rows="2" value={metaDesc} onChange={e => setMetaDesc(e.target.value)} placeholder="Brief notes about this file..." />
                            </div>

                            <button disabled={!uploadFile} type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                Upload Document
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Folder Modal */}
            {showFolderModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Folder</h2>
                        <form onSubmit={handleCreateFolder} className="space-y-4">
                            <input required type="text" className="w-full p-2 border rounded-lg" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="Folder Name..." />
                            <select className="w-full p-2 border rounded-lg" value={metaDept} onChange={e => setMetaDept(e.target.value)}>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Documents;
