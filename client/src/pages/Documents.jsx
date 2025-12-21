import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import {
    FileText, Upload, Download, Trash2, FileSpreadsheet,
    Image as ImageIcon, Loader, ArrowLeft, Search, Filter,
    Folder, FolderPlus, Grid, List as ListIcon, MoreVertical, X, Moon, Sun
} from 'lucide-react';
import { API_URL } from '../config';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_DEPARTMENTS = ["General", "Maintenance", "Sales", "Excise", "HR", "Production"];

const Documents = () => {
    const { isDark, toggleTheme } = useTheme();
    // Data State
    const [docs, setDocs] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [allDepartments, setAllDepartments] = useState(DEFAULT_DEPARTMENTS);

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
    const [customDept, setCustomDept] = useState(''); // For custom department input
    const [showCustomDept, setShowCustomDept] = useState(false); // Toggle custom input
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

            // Extract unique departments from documents
            const uniqueDepts = [...new Set(res.data.map(doc => doc.department))];
            const mergedDepts = [...new Set([...DEFAULT_DEPARTMENTS, ...uniqueDepts])];
            setAllDepartments(mergedDepts.sort());
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
        // Use custom department if provided, otherwise use selected department
        const finalDept = showCustomDept && customDept.trim() ? customDept.trim() : metaDept;
        formData.append('department', finalDept);
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
        if (!window.confirm("Delete this document?")) return;
        try {
            await axios.delete(`${API_URL}/api/documents/${id}`);
            setDocs(docs.filter(d => d.id !== id));
        } catch (e) { alert("Delete failed"); }
    };

    const handleDeleteFolder = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this folder? Documents inside will be unsorted.")) return;
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
        setCustomDept('');
        setShowCustomDept(false);
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
        if (!type) return <FileText className={isDark ? "text-gray-500" : "text-gray-400"} />;
        const t = type.toLowerCase();
        if (t.includes('pdf')) return <FileText className="text-red-500" />;
        if (t.includes('xls') || t.includes('sheet') || t.includes('csv')) return <FileSpreadsheet className="text-green-500" />;
        if (t.includes('png') || t.includes('jpg')) return <ImageIcon className="text-blue-500" />;
        return <FileText className={isDark ? "text-gray-400" : "text-gray-500"} />;
    };

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
            {/* Hidden dropzone input */}
            <input {...getInputProps()} style={{ display: 'none' }} id="dropzone-input" />

            {/* Sidebar Filters */}
            <aside className={`w-72 border-r flex flex-col hidden md:flex transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800 shadow-2xl' : 'bg-white border-gray-200'}`}>
                <div className={`p-6 border-b transition-colors ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className={`p-2 rounded-xl transition ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <h2 className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>Cloud Files</h2>
                        </div>
                        <button onClick={toggleTheme} className={`p-2 rounded-xl transition ${isDark ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setUploadFile(null);
                            resetForm();
                            if (selectedDept !== 'All') setMetaDept(selectedDept);
                            document.getElementById('dropzone-input').click();
                        }}
                        className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-900/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'}`}
                    >
                        <Upload size={18} /> Upload New
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Departments */}
                    <div>
                        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Departments</h3>
                        <ul className="space-y-1">
                            <li
                                className={`px-4 py-3 rounded-xl cursor-pointer text-sm font-bold transition-all ${selectedDept === 'All' ? (isDark ? 'bg-indigo-600/10 text-indigo-400' : 'bg-blue-50 text-blue-700') : (isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-50')}`}
                                onClick={() => setSelectedDept('All')}
                            >
                                All Departments
                            </li>
                            {allDepartments.map(dept => (
                                <li
                                    key={dept}
                                    className={`px-4 py-3 rounded-xl cursor-pointer text-sm font-bold transition-all ${selectedDept === dept ? (isDark ? 'bg-indigo-600/10 text-indigo-400' : 'bg-blue-50 text-blue-700') : (isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-50')}`}
                                    onClick={() => setSelectedDept(dept)}
                                >
                                    {dept}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Folders */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Folders</h3>
                            <button
                                onClick={() => { setShowFolderModal(true); setMetaTitle(''); }}
                                className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                            >
                                <FolderPlus size={16} />
                            </button>
                        </div>
                        <ul className="space-y-1">
                            <li
                                className={`px-4 py-3 rounded-xl cursor-pointer text-sm font-bold flex items-center gap-3 transition-all ${selectedFolder === 'All' ? (isDark ? 'bg-indigo-600/10 text-indigo-400' : 'bg-blue-50 text-blue-700') : (isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-50')}`}
                                onClick={() => setSelectedFolder('All')}
                            >
                                <Folder size={16} className={`fill-current ${selectedFolder === 'All' ? 'text-yellow-500' : 'text-gray-400'}`} /> All Documents
                            </li>
                            {folders.map(folder => (
                                <li
                                    key={folder.id}
                                    className={`px-4 py-3 rounded-xl cursor-pointer text-sm font-bold flex justify-between items-center group transition-all ${selectedFolder == folder.id ? (isDark ? 'bg-indigo-600/10 text-indigo-400' : 'bg-blue-50 text-blue-700') : (isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-50')}`}
                                    onClick={() => setSelectedFolder(folder.id)}
                                >
                                    <div className="flex items-center gap-3 truncate">
                                        <Folder size={16} className={`fill-current ${selectedFolder == folder.id ? 'text-yellow-500' : 'text-gray-400'}`} />
                                        {folder.name}
                                    </div>
                                    <button onClick={(e) => handleDeleteFolder(folder.id, e)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                </li>
                            ))}
                            <li
                                className={`px-4 py-3 rounded-xl cursor-pointer text-sm font-bold flex items-center gap-3 transition-all ${selectedFolder === 'Unsorted' ? (isDark ? 'bg-indigo-600/10 text-indigo-400' : 'bg-blue-50 text-blue-700') : (isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-50')}`}
                                onClick={() => setSelectedFolder('Unsorted')}
                            >
                                <Folder size={16} className="text-gray-300" /> Unsorted
                            </li>
                        </ul>
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className={`border-b p-4 sm:p-6 sticky top-0 z-10 transition-colors ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-2xl">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} size={18} />
                                <input
                                    type="text"
                                    placeholder="Search your library..."
                                    className={`w-full pl-12 pr-4 py-3 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-900 text-white placeholder:text-gray-600' : 'bg-gray-50 text-gray-900'}`}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className={`hidden sm:flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50'}`}>
                                <Filter size={16} className={isDark ? "text-indigo-400" : "text-blue-600"} />
                                <select
                                    value={sort}
                                    onChange={e => setSort(e.target.value)}
                                    className={`bg-transparent border-0 p-0 pr-8 focus:ring-0 font-bold text-xs uppercase tracking-widest cursor-pointer ${isDark ? 'text-white' : 'text-gray-700'}`}
                                >
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="alpha_asc">A-Z</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-full gap-4 text-gray-500">
                            <Loader className={`animate-spin ${isDark ? 'text-indigo-500' : 'text-blue-600'}`} size={48} />
                            <p className="font-black text-[10px] uppercase tracking-widest">Accessing Secure Vault...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-7xl mx-auto">
                            {/* Table Heading */}
                            <div className={`hidden md:grid grid-cols-12 gap-6 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-500'}`}>
                                <div className="col-span-4">Resource Name</div>
                                <div className="col-span-2">Domain</div>
                                <div className="col-span-2">Uploader</div>
                                <div className="col-span-2">Context</div>
                                <div className="col-span-2 text-right">Commit Date</div>
                            </div>

                            {docs.length === 0 && (
                                <div className="text-center py-32 space-y-4">
                                    <FileText size={64} className={`mx-auto opacity-10 ${isDark ? 'text-white' : 'text-black'}`} />
                                    <p className="font-black text-gray-500 uppercase text-xs tracking-widest">The vault is currently empty</p>
                                </div>
                            )}

                            {docs.map(doc => (
                                <div
                                    key={doc.id}
                                    className={`rounded-3xl border transition-all group ${isDark ? 'bg-gray-900 border-gray-800 hover:border-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.05)]' : 'bg-white border-gray-100 hover:shadow-xl'}`}
                                >
                                    {/* Desktop Grid */}
                                    <div className="hidden md:grid grid-cols-12 gap-6 px-6 py-5 items-center">
                                        <div className="col-span-4 flex items-center gap-4 overflow-hidden">
                                            <div className={`p-3 rounded-2xl flex-shrink-0 transition-colors ${isDark ? 'bg-gray-800 text-gray-400 group-hover:text-indigo-400' : 'bg-gray-50 text-gray-500 group-hover:text-blue-600'}`}>
                                                {getIcon(doc.type)}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className={`font-black tracking-tight truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{doc.title}</h4>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">{doc.filename}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-blue-50 text-blue-700'}`}>{doc.department}</span>
                                        </div>
                                        <div className={`col-span-2 text-xs font-bold truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {doc.user?.name || doc.user?.role || "System Admin"}
                                        </div>
                                        <div className={`col-span-2 text-xs italic truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {doc.description || 'No description'}
                                        </div>
                                        <div className="col-span-2 flex items-center justify-end gap-4">
                                            <span className="text-[10px] font-black text-gray-500 uppercase">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-all">
                                                <a
                                                    href={doc.path}
                                                    target="_blank" rel="noreferrer"
                                                    className={`p-2 rounded-xl transition ${isDark ? 'bg-gray-800 text-indigo-400 hover:bg-gray-700' : 'bg-gray-100 text-blue-600 hover:bg-white border border-gray-100'}`}
                                                >
                                                    <Download size={14} />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className={`p-2 rounded-xl transition ${isDark ? 'bg-gray-800 text-red-400 hover:bg-red-900/40' : 'bg-gray-100 text-red-600 hover:bg-red-50'}`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Stack */}
                                    <div className="md:hidden p-5 space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800 text-indigo-400' : 'bg-gray-50'}`}>
                                                {getIcon(doc.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-black text-lg tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{doc.title}</h4>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">{doc.filename}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-blue-50 text-blue-700'}`}>{doc.department}</span>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{doc.user?.name || "Admin"}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={doc.path}
                                                target="_blank" rel="noreferrer"
                                                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isDark ? 'bg-indigo-600 text-white shadow-indigo-900/20 shadow-xl' : 'bg-blue-600 text-white shadow-lg'}`}
                                            >
                                                <Download size={16} /> Download
                                            </a>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className={`flex items-center justify-center p-4 rounded-2xl transition-all ${isDark ? 'bg-gray-800 text-red-400' : 'bg-red-50 text-red-600'}`}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals with Dark Support */}
            {(showUploadModal || showFolderModal) && (
                <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className={`rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border transition-all ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-white'}`}>
                        <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50/50 border-gray-100'}`}>
                            <div>
                                <h2 className={`text-2xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-gray-800'}`}>{showUploadModal ? 'Secure Upload' : 'New Folder'}</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">DMS Regulatory Commit</p>
                            </div>
                            <button onClick={() => { setShowUploadModal(false); setShowFolderModal(false); }} className={`p-2 rounded-full transition-all ${isDark ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-white hover:shadow-sm text-gray-400'}`}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-10 space-y-6">
                            {showUploadModal ? (
                                <form onSubmit={handleUpload} className="space-y-6">
                                    {!uploadFile ? (
                                        <div {...getRootProps()} className={`border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all ${isDark ? 'border-gray-800 hover:border-indigo-500 bg-gray-950/50' : 'border-gray-200 hover:border-blue-500 bg-gray-50 hover:bg-blue-50/50'}`}>
                                            <input {...getInputProps()} />
                                            <Upload className={`mx-auto mb-4 ${isDark ? 'text-indigo-400' : 'text-blue-500'}`} size={32} />
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Drop statutory documents here or click to browse</p>
                                        </div>
                                    ) : (
                                        <div className={`flex items-center gap-4 p-4 rounded-2xl border ${isDark ? 'bg-indigo-900/10 border-indigo-900/30' : 'bg-blue-50 border-blue-100'}`}>
                                            <FileText size={24} className={isDark ? "text-indigo-400" : "text-blue-600"} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{uploadFile.name}</p>
                                                <p className="text-[10px] font-bold text-gray-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <button type="button" onClick={() => setUploadFile(null)} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Document Identifier</label>
                                            <input required type="text" className={`w-full p-4 rounded-2xl font-bold transition-all border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-700' : 'bg-gray-50 text-gray-900'}`} value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="e.g. WB-IML-REC-2024" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Domain</label>
                                                <select className={`w-full p-4 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} value={showCustomDept ? 'Other' : metaDept} onChange={e => { if (e.target.value === 'Other') setShowCustomDept(true); else { setShowCustomDept(false); setMetaDept(e.target.value); } }}>
                                                    {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                                                    <option value="Other">Other Category...</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Logic Folder</label>
                                                <select className={`w-full p-4 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} value={metaFolder} onChange={e => setMetaFolder(e.target.value)}>
                                                    <option value="">Root / Unsorted</option>
                                                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {showCustomDept && (
                                            <input type="text" className={`w-full p-4 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} placeholder="Define new department..." value={customDept} onChange={e => setCustomDept(e.target.value)} required />
                                        )}

                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Brief Description</label>
                                            <textarea required rows="2" className={`w-full p-4 rounded-2xl font-bold transition-all border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-700' : 'bg-gray-50 text-gray-900'}`} value={metaDesc} onChange={e => setMetaDesc(e.target.value)} placeholder="Regulatory notes or context..." />
                                        </div>
                                    </div>

                                    <button disabled={!uploadFile} type="submit" className={`w-full py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all shadow-xl ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-800' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'}`}>Upload To DMS</button>
                                </form>
                            ) : (
                                <form onSubmit={handleCreateFolder} className="space-y-6">
                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Directory Name</label>
                                        <input required type="text" className={`w-full p-4 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="e.g. Audit Reports 2024" />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Associate Department</label>
                                        <select className={`w-full p-4 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`} value={metaDept} onChange={e => setMetaDept(e.target.value)}>
                                            {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setShowFolderModal(false)} className={`flex-1 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest border transition-all ${isDark ? 'border-gray-800 text-gray-500 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Cancel</button>
                                        <button type="submit" className={`flex-1 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-xl ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>Initialize</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents;
