import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Factory, Wine, FileText, Shield, TrendingUp, Users, FileSpreadsheet, Moon, Sun, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Landing = () => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-gray-950' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'}`}>
            {/* Navbar */}
            <nav className={`flex items-center justify-between p-4 sm:p-6 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b transition-colors ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
                <div className="text-base sm:text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                        <Factory className="text-white" size={20} />
                    </div>
                    <span className="hidden sm:inline tracking-tighter uppercase">SIP2LIFE DISTILLERIES PVT. LTD.</span>
                    <span className="sm:hidden">SIP2LIFE</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className={`p-2 rounded-xl transition ${isDark ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <Link
                        to="/login"
                        className="px-4 sm:px-6 py-2 sm:py-2.5 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-indigo-500/20 hover:shadow-xl transition-all font-black text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2"
                    >
                        <span>Login</span>
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative text-white py-16 sm:py-32 px-4 sm:px-6 text-center overflow-hidden">
                {/* Animated Background */}
                <div className={`absolute inset-0 transition-opacity duration-700 ${isDark ? 'opacity-20' : 'opacity-100'}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1516594915697-87eb3b1c3a62?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent" />
                    </div>
                </div>
                {isDark && <div className="absolute inset-0 bg-gray-950"></div>}

                <div className="relative z-10 max-w-5xl mx-auto">
                    <div className="inline-block mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-widest">🏭 World Class Bottling Plant</span>
                    </div>
                    <h1 className={`text-4xl sm:text-6xl md:text-8xl font-black mb-6 sm:mb-8 leading-none tracking-tighter ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500' : 'text-white'}`}>
                        Excellence in <br />Every Bottle.
                    </h1>
                    <p className={`text-base sm:text-xl mb-10 sm:mb-12 max-w-3xl mx-auto px-4 font-medium transition-colors ${isDark ? 'text-gray-400' : 'text-blue-100'}`}>
                        Leading the way in IML (India Made Liquor) production with state-of-the-art facilities.
                        Preparing for IMFL (India Made Foreign Liquor) expansion.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            <Users size={18} />
                            <span>Employee Portal</span>
                        </Link>
                        <a
                            href="https://excise.wb.gov.in/Portal_New_Default.aspx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-10 py-5 bg-white/10 backdrop-blur-sm text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-white/20 transition-all border border-white/30 flex items-center justify-center gap-2"
                        >
                            <FileText size={18} />
                            <span>WB Excise Portal</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="py-20 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16 sm:mb-24">
                    <h2 className={`text-3xl sm:text-5xl font-black mb-4 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Engineering Precision</h2>
                    <p className="text-sm sm:text-lg text-gray-400 font-bold uppercase tracking-[0.3em]">
                        Cutting-edge technology meets legacy
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { icon: Wine, title: "IML Production", desc: "State-of-the-art facilities for high-quality India Made Liquor", color: "from-blue-500 to-indigo-600" },
                        { icon: Factory, title: "IMFL Expansion", desc: "Future-ready infrastructure for Premium Foreign Liquor", color: "from-purple-500 to-pink-600" },
                        { icon: Shield, title: "Quality Assurance", desc: "Rigorous quality standards and efficient processing", color: "from-green-500 to-emerald-600" },
                        { icon: TrendingUp, title: "Global Standards", desc: "Expanding capabilities to serve international markets", color: "from-orange-500 to-red-600" }
                    ].map((feature, idx) => (
                        <div
                            key={idx}
                            className={`group p-8 rounded-3xl transition-all duration-300 border hover:-translate-y-4 ${isDark ? 'bg-gray-900 border-gray-800 hover:border-indigo-500' : 'bg-white border-gray-100 hover:border-blue-200'}`}
                        >
                            <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} text-white flex items-center justify-center rounded-2xl mb-8 group-hover:scale-110 transition-transform shadow-lg`}>
                                <feature.icon size={28} />
                            </div>
                            <h3 className={`text-xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                            <p className="text-sm font-medium text-gray-400 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Sales Section */}
            <section className={`py-20 sm:py-32 px-4 sm:px-6 transition-colors ${isDark ? 'bg-gray-950' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className={`text-3xl sm:text-5xl font-black mb-4 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Sales & Distribution</h2>
                        <p className="text-sm sm:text-lg text-gray-400 font-bold uppercase tracking-[0.3em]">
                            Premium quality products with efficient distribution
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { title: "Wholesale Distribution", desc: "Bulk orders for retailers and distributors", icon: "📦" },
                            { title: "Retail Network", desc: "Authorized retail outlets across regions", icon: "🏪" },
                            { title: "Quality Assurance", desc: "100% quality guaranteed products", icon: "✓" }
                        ].map((item, idx) => (
                            <div key={idx} className={`p-8 rounded-[2rem] shadow-lg transition-all hover:-translate-y-2 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-blue-50'}`}>
                                <div className="text-4xl mb-6">{item.icon}</div>
                                <h3 className={`text-xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                                <p className="text-gray-400 font-medium text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Leadership - Sayantan Das */}
            <section className={`py-20 sm:py-32 px-4 sm:px-6 transition-colors ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
                <div className="max-w-6xl mx-auto">
                    <div className={`rounded-[3rem] shadow-2xl overflow-hidden border ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-white'}`}>
                        <div className="grid md:grid-cols-2 gap-0">
                            <div className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-12 flex items-center justify-center">
                                <div className="text-center relative z-10">
                                    <div className="w-40 h-40 mx-auto mb-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl">
                                        <Users className="text-white" size={80} />
                                    </div>
                                    <div className="text-white/90 text-xs font-black uppercase tracking-[0.3em]">
                                        Visionary Leadership
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                            </div>

                            <div className="p-12 lg:p-20">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6 inline-block ${isDark ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>Leadership Excellence</span>
                                <h2 className={`text-4xl lg:text-5xl font-black mb-4 tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>Sayantan Das</h2>
                                <p className="text-lg font-black text-blue-600 mb-8 uppercase tracking-widest">Managing Director</p>
                                <div className="space-y-6 text-gray-400 font-medium">
                                    <p className="leading-relaxed">Under the visionary leadership of <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-bold`}>Sayantan Das</span>, SIP2LIFE Distilleries has emerged as a pioneer in the industry.</p>
                                    <p className="text-sm leading-relaxed">His commitment to quality, sustainability, and excellence has positioned SIP2LIFE as a trusted name in premium liquor production.</p>
                                </div>
                                <div className="mt-10 flex flex-wrap gap-4">
                                    {['Strategic Vision', 'Innovation Leader', 'Quality Champion'].map(t => (
                                        <div key={t} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                            <span>{t}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className={`py-20 sm:py-32 px-4 sm:px-6 transition-colors ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className={`text-3xl sm:text-5xl font-black mb-4 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Get in Touch</h2>
                        <p className="text-sm sm:text-lg text-gray-400 font-bold uppercase tracking-[0.3em]">
                            We're here to help. Reach out to us.
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { title: "General Inquiries", icon: Users, color: "from-blue-500 to-indigo-600", bg: isDark ? "bg-blue-900/10" : "bg-blue-50", text: "info@sip2life.com", phone: "+91 98765 43210" },
                            { title: "Sales Department", icon: FileSpreadsheet, color: "from-green-500 to-emerald-600", bg: isDark ? "bg-green-900/10" : "bg-green-50", text: "sales@sip2life.com", phone: "+91 98765 43211" },
                            { title: "Production Unit", icon: Factory, color: "from-purple-500 to-pink-600", bg: isDark ? "bg-purple-900/10" : "bg-purple-50", text: "production@sip2life.com", phone: "+91 98765 43212" }
                        ].map((contact, idx) => (
                            <div key={idx} className={`p-8 rounded-[2rem] border transition-all ${isDark ? 'bg-gray-900 border-gray-800 hover:border-indigo-500' : 'bg-white border-gray-100 hover:border-blue-200 shadow-lg'}`}>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${contact.color}`}>
                                    <contact.icon className="text-white" size={24} />
                                </div>
                                <h3 className={`text-xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{contact.title}</h3>
                                <div className="space-y-2">
                                    <a href={`tel:${contact.phone.replace(/ /g, '')}`} className="block text-blue-500 font-bold hover:underline">{contact.phone}</a>
                                    <a href={`mailto:${contact.text}`} className="block text-gray-400 font-medium hover:text-blue-400">{contact.text}</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Subtle Technology Partner */}
            <section className={`py-12 sm:py-16 px-4 border-t transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gradient-to-r from-blue-600 to-cyan-600 border-blue-700'}`}>
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <span className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-white/90'}`}>
                            Instrumentation & Automation by
                        </span>
                        <div className={`px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                            <img
                                src="/endress-hauser-logo.png"
                                alt="Endress+Hauser"
                                className={`h-8 sm:h-10 w-auto ${isDark ? 'brightness-200' : ''}`}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className={`py-12 sm:py-20 px-4 transition-colors ${isDark ? 'bg-black' : 'bg-gray-900'}`}>
                <div className="max-w-6xl mx-auto text-center">
                    <div className="flex justify-center gap-6 mb-12">
                        <div className="p-3 bg-white/5 rounded-2xl text-white"><FileText size={20} /></div>
                        <div className="p-3 bg-white/5 rounded-2xl text-white"><Users size={20} /></div>
                        <div className="p-3 bg-white/5 rounded-2xl text-white"><Factory size={20} /></div>
                    </div>
                    <p className="text-sm sm:text-base mb-2 font-bold text-gray-500 uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} <span className="text-white">SIP2LIFE DISTILLERIES PVT. LTD.</span>
                    </p>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
