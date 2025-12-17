import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { useTheme } from '../context/ThemeContext';
import { UserPlus, Lock, User, Mail, AlertCircle, CheckCircle } from 'lucide-react';

export default function Register() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const [token, setToken] = useState('');
    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ name: '', password: '', confirmPassword: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const inviteToken = searchParams.get('token');

        if (!inviteToken) {
            setError('No invite token provided. Please use the invite link sent to your email.');
            setLoading(false);
            return;
        }

        setToken(inviteToken);
        validateToken(inviteToken);
    }, [searchParams]);

    const validateToken = async (token) => {
        try {
            const res = await axios.get(`${API_URL}/api/auth/validate-invite?token=${token}`);
            setInviteData(res.data);
            setFormData({ ...formData, name: res.data.name || '' });
        } catch (error) {
            setError(error.response?.data?.error || 'Invalid or expired invite link');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await axios.post(`${API_URL}/api/auth/complete-registration`, {
                token,
                name: formData.name,
                password: formData.password
            });

            alert('Registration successful! You can now login with your credentials.');
            navigate('/login');

        } catch (error) {
            setError(error.response?.data?.error || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Validating invite...</p>
                </div>
            </div>
        );
    }

    if (error && !inviteData) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
                <div className={`max-w-md w-full p-8 rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="text-center">
                        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                        <h2 className="text-2xl font-bold mb-4">Invalid Invite</h2>
                        <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
            <div className={`max-w-md w-full p-8 rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="text-center mb-8">
                    <UserPlus className="mx-auto text-blue-600 mb-4" size={48} />
                    <h1 className="text-3xl font-bold mb-2">Complete Registration</h1>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        You've been invited to join SIP2LIFE DMS
                    </p>
                </div>

                {/* Invite Info */}
                <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Mail size={16} className="text-blue-600" />
                        <span className="font-medium">{inviteData?.email}</span>
                    </div>
                    <p className="text-sm text-gray-500">Role: {inviteData?.role}</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            <User size={16} className="inline mr-1" />
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            <Lock size={16} className="inline mr-1" />
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            placeholder="••••••••"
                            minLength={6}
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            <Lock size={16} className="inline mr-1" />
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Complete Registration
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Already have an account?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Login here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
