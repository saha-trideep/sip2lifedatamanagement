import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useTheme } from '../context/ThemeContext';
import { Mail, UserPlus, Copy, Check, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function AdminInvites() {
    const [invites, setInvites] = useState({ pending: [], accepted: [], expired: [] });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ email: '', name: '', role: 'EMPLOYEE' });
    const [copiedUrl, setCopiedUrl] = useState(null);
    const { isDark } = useTheme();

    const fetchInvites = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/admin/invites`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvites(res.data);
        } catch (error) {
            console.error('Failed to fetch invites:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/admin/invites`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Copy invite URL to clipboard
            navigator.clipboard.writeText(res.data.inviteUrl);
            alert(`Invite created! URL copied to clipboard:\n\n${res.data.inviteUrl}`);

            setFormData({ email: '', name: '', role: 'EMPLOYEE' });
            setShowForm(false);
            fetchInvites();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create invite');
        }
    };

    const handleRevoke = async (id) => {
        if (!confirm('Are you sure you want to revoke this invite?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/admin/invites/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchInvites();
        } catch (error) {
            alert('Failed to revoke invite');
        }
    };

    const copyInviteUrl = (inviteId) => {
        // Note: We don't have the token anymore, so we can't regenerate the URL
        // In a real app, you'd store the token or regenerate it
        alert('Invite URL was already sent. Please create a new invite if needed.');
    };

    return (
        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <UserPlus className="text-blue-600" />
                    Employee Invites
                </h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Mail size={16} />
                    New Invite
                </button>
            </div>

            {/* Create Invite Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className={`mb-6 p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email *</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`w-full p-2 rounded border ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
                                placeholder="employee@company.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full p-2 rounded border ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Role *</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className={`w-full p-2 rounded border ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
                            >
                                <option value="EMPLOYEE">Employee</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                            Create Invite
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Invites List */}
            {loading ? (
                <p>Loading invites...</p>
            ) : (
                <div className="space-y-6">
                    {/* Pending Invites */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Clock className="text-yellow-500" size={20} />
                            Pending ({invites.pending.length})
                        </h3>
                        <div className="space-y-2">
                            {invites.pending.map((invite) => (
                                <div key={invite.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{invite.email}</p>
                                            <p className="text-sm text-gray-500">
                                                {invite.name} • {invite.role} • Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRevoke(invite.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {invites.pending.length === 0 && (
                                <p className="text-gray-500 text-sm">No pending invites</p>
                            )}
                        </div>
                    </div>

                    {/* Accepted Invites */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle className="text-green-500" size={20} />
                            Accepted ({invites.accepted.length})
                        </h3>
                        <div className="space-y-2">
                            {invites.accepted.slice(0, 5).map((invite) => (
                                <div key={invite.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <p className="font-medium">{invite.email}</p>
                                    <p className="text-sm text-gray-500">
                                        Accepted: {new Date(invite.usedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                            {invites.accepted.length === 0 && (
                                <p className="text-gray-500 text-sm">No accepted invites</p>
                            )}
                        </div>
                    </div>

                    {/* Expired Invites */}
                    {invites.expired.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <XCircle className="text-red-500" size={20} />
                                Expired ({invites.expired.length})
                            </h3>
                            <div className="space-y-2">
                                {invites.expired.slice(0, 3).map((invite) => (
                                    <div key={invite.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} opacity-60`}>
                                        <p className="font-medium">{invite.email}</p>
                                        <p className="text-sm text-gray-500">
                                            Expired: {new Date(invite.expiresAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
