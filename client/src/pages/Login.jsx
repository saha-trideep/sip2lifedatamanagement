import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowLeft, Loader, Moon, Sun } from 'lucide-react';
import { API_URL } from '../config';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
    const { isDark, toggleTheme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex items-center justify-center min-h-screen relative overflow-hidden px-4 sm:px-6 transition-colors duration-500 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
            {/* Background Image with Overlay */}
            <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${isDark ? 'opacity-30' : 'opacity-100'}`}>
                <img
                    src="/factory-bg.jpg"
                    alt="Factory"
                    className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 ${isDark ? 'bg-gray-950' : 'bg-gradient-to-br from-blue-900/90 via-indigo-900/85 to-purple-900/90'}`}></div>
            </div>

            <div className={`relative z-10 w-full max-w-md p-8 sm:p-12 space-y-8 backdrop-blur-md rounded-[2.5rem] shadow-2xl border transition-all ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/95 border-gray-100'}`}>
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => navigate('/')}
                        className={`flex items-center gap-2 transition-colors ${isDark ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-600 hover:text-blue-600'}`}
                    >
                        <ArrowLeft size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
                    </button>
                    <button onClick={toggleTheme} className={`p-2 rounded-xl transition ${isDark ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                <div className="text-center">
                    <div className="inline-block p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl mb-6 shadow-xl">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className={`text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>Portal Access</h1>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Employee Verification System</p>
                </div>

                {error && (
                    <div className="p-4 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-4 top-4 text-gray-400" size={18} />
                        <input
                            type="email"
                            placeholder="Employee Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full p-4 pl-12 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-600' : 'bg-gray-50 text-gray-900'}`}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-4 text-gray-400" size={18} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full p-4 pl-12 rounded-2xl font-bold border-0 focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 text-white placeholder:text-gray-600' : 'bg-gray-50 text-gray-900'}`}
                            required
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-5 text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:opacity-50 font-black uppercase text-xs tracking-[0.2em]"
                    >
                        {loading ? (
                            <>
                                <Loader className="animate-spin" size={18} />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <span>Authenticate</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
