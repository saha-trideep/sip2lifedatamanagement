import React, { useMemo } from 'react';
import { Package, Hash, Droplet } from 'lucide-react';

const BOTTLE_SIZES = ['750', '600', '500', '375', '300', '180'];
const STRENGTH_CATEGORIES = ['50', '60', '70', '80'];

const BottleCountGrid = ({ section, data, onChange, readOnly = false }) => {

    // Calculate section-specific totals for the UI
    const sectionTotals = useMemo(() => {
        let totalBottles = 0;
        let totalBl = 0;

        BOTTLE_SIZES.forEach(size => {
            STRENGTH_CATEGORIES.forEach(strength => {
                const fieldName = `${section}${size}_${strength}`;
                const count = parseInt(data[fieldName]) || 0;
                totalBottles += count;

                // BL conversion factors
                const sizeInLiters = parseFloat(size) / 1000;
                totalBl += sizeInLiters * count;
            });
        });

        return {
            bottles: totalBottles,
            bl: Math.round(totalBl * 100) / 100
        };
    }, [data, section]);

    const handleInputChange = (size, strength, value) => {
        const fieldName = `${section}${size}_${strength}`;
        const val = value === '' ? 0 : parseInt(value) || 0;
        onChange(fieldName, val);
    };

    return (
        <div className="space-y-6">
            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                <table className="w-full border-collapse bg-white dark:bg-gray-900">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                Size / Strength
                            </th>
                            {STRENGTH_CATEGORIES.map(strength => (
                                <th key={strength} className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-100 dark:border-gray-800">
                                    {strength}° U.P.
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {BOTTLE_SIZES.map(size => (
                            <tr key={size} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                                            <Package size={14} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{size} ml</span>
                                    </div>
                                </td>
                                {STRENGTH_CATEGORIES.map(strength => (
                                    <td key={strength} className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
                                        <input
                                            type="number"
                                            min="0"
                                            disabled={readOnly}
                                            value={data[`${section}${size}_${strength}`] || ''}
                                            onChange={(e) => handleInputChange(size, strength, e.target.value)}
                                            className="w-full text-center py-2 bg-gray-50/50 dark:bg-gray-800/50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 font-bold text-gray-900 dark:text-white transition-all disabled:opacity-50"
                                            placeholder="0"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Quick Stats Footer */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-gray-700 rounded-2xl text-blue-600 shadow-sm">
                            <Hash size={18} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Bottles</div>
                            <div className="text-xl font-black text-gray-900 dark:text-white">{sectionTotals.bottles.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-gray-700 rounded-2xl text-emerald-600 shadow-sm">
                            <Droplet size={18} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bulk Liters (BL)</div>
                            <div className="text-xl font-black text-gray-900 dark:text-white">{sectionTotals.bl.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BottleCountGrid;
