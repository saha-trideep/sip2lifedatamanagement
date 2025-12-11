import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Factory, Wine } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <nav className="flex items-center justify-between p-6 bg-white shadow-sm sticky top-0 z-50">
                <div className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                    <Factory /> SIP2LIFE
                </div>
                <Link to="/login" className="px-4 py-2 text-white bg-blue-900 rounded hover:bg-blue-800">
                    Employee Login
                </Link>
            </nav>

            {/* Hero Section */}
            <header className="relative bg-blue-900 text-white py-20 px-6 text-center overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1516594915697-87eb3b1c3a62?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 className="text-5xl font-bold mb-6">World Class Bottling Plant</h1>
                    <p className="text-xl mb-8 text-gray-200">
                        Leading the way in IML (India Made Liquor) and preparing for IMFL (India Made Foreign Liquor) production.
                        Excellence in every bottle.
                    </p>
                    <button className="px-8 py-3 bg-yellow-500 text-blue-900 font-bold rounded hover:bg-yellow-400 transition">
                        Learn More
                    </button>
                </div>
            </header>

            {/* Features / Details */}
            <section className="py-16 px-6 max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-900 flex items-center justify-center rounded-full">
                            <Wine size={24} />
                        </div>
                        <h3 className="text-2xl font-bold">IML Production</h3>
                        <p className="text-gray-600">
                            State-of-the-art facilities dedicated to high-quality India Made Liquor production.
                            We maintain rigorous quality standards and efficient processing.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-green-100 text-green-900 flex items-center justify-center rounded-full">
                            <Factory size={24} />
                        </div>
                        <h3 className="text-2xl font-bold">IMFL Expansion</h3>
                        <p className="text-gray-600">
                            Future-ready infrastructure being prepared for Premium India Made Foreign Liquor.
                            Expanding our capabilities to serve a global market.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-8 text-center">
                <p>&copy; {new Date().getFullYear()} SIP2LIFE Distilleries Pvt. Ltd. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Landing;
