import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Factory, Wine, FileText, Shield, TrendingUp, Users } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Navbar */}
            <nav className="flex items-center justify-between p-4 sm:p-6 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200">
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <Factory className="text-white" size={24} />
                    </div>
                    <span className="hidden sm:inline">SIP2LIFE</span>
                </div>
                <Link
                    to="/login"
                    className="px-4 sm:px-6 py-2 sm:py-2.5 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium text-sm sm:text-base flex items-center gap-2"
                >
                    <span>Employee Login</span>
                    <ArrowRight size={16} />
                </Link>
            </nav>

            {/* Hero Section */}
            <header className="relative text-white py-16 sm:py-24 px-4 sm:px-6 text-center overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1516594915697-87eb3b1c3a62?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto">
                    <div className="inline-block mb-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                        <span className="text-sm sm:text-base font-medium">🏭 World Class Bottling Plant</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                        Excellence in Every Bottle
                    </h1>
                    <p className="text-base sm:text-xl mb-6 sm:mb-8 text-blue-100 max-w-3xl mx-auto px-4">
                        Leading the way in IML (India Made Liquor) production with state-of-the-art facilities.
                        Preparing for IMFL (India Made Foreign Liquor) expansion.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105">
                            Learn More
                        </button>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg hover:bg-white/20 transition-all border border-white/30"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Our Capabilities</h2>
                    <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                        Cutting-edge technology meets traditional excellence
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {[
                        {
                            icon: Wine,
                            title: "IML Production",
                            desc: "State-of-the-art facilities for high-quality India Made Liquor",
                            color: "from-blue-500 to-indigo-600"
                        },
                        {
                            icon: Factory,
                            title: "IMFL Expansion",
                            desc: "Future-ready infrastructure for Premium Foreign Liquor",
                            color: "from-purple-500 to-pink-600"
                        },
                        {
                            icon: Shield,
                            title: "Quality Assurance",
                            desc: "Rigorous quality standards and efficient processing",
                            color: "from-green-500 to-emerald-600"
                        },
                        {
                            icon: TrendingUp,
                            title: "Global Standards",
                            desc: "Expanding capabilities to serve international markets",
                            color: "from-orange-500 to-red-600"
                        }
                    ].map((feature, idx) => (
                        <div
                            key={idx}
                            className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:-translate-y-2"
                        >
                            <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} text-white flex items-center justify-center rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                                <feature.icon size={28} />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{feature.title}</h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {[
                        { label: "Production Capacity", value: "10M+", suffix: "L/Year" },
                        { label: "Quality Standards", value: "ISO", suffix: "Certified" },
                        { label: "Team Members", value: "500+", suffix: "Employees" },
                        { label: "Years Experience", value: "25+", suffix: "Years" }
                    ].map((stat, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">{stat.value}</div>
                            <div className="text-xs sm:text-sm text-blue-200">{stat.suffix}</div>
                            <div className="text-xs sm:text-sm text-blue-100 mt-1 sm:mt-2">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 sm:py-20 px-4 sm:px-6 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                        Join Our Team
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
                        Access your employee portal to manage documents, registers, and stay connected with the team.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl text-sm sm:text-base"
                    >
                        <Users size={20} />
                        <span>Employee Portal</span>
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-6 sm:py-8 text-center px-4">
                <p className="text-sm sm:text-base">&copy; {new Date().getFullYear()} SIP2LIFE Distilleries Pvt. Ltd. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Landing;
