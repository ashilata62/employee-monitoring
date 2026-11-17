import React, { useState } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    BarChart,
    Bar,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

const ProductivityTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload || {};
    const total = data.total !== undefined
        ? data.total
        : Number(((data.productive || 0) + (data.unproductive || 0) + (data.neutral || 0)).toFixed(2));

    return (
        <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700/60 text-xs min-w-[180px]">
            <div className="font-bold text-slate-300 pb-2 mb-2 border-b border-slate-700/60 flex items-center justify-between">
                <span>{label || data.name}</span>
                <span className="font-black text-white">{total} h total</span>
            </div>
            <div className="space-y-1.5 font-medium">
                <div className="flex items-center justify-between gap-3 text-emerald-400">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00c48c]" /> Productive:
                    </span>
                    <span className="font-bold">{data.productive || 0} h</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-rose-400">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ff6b72]" /> Unproductive:
                    </span>
                    <span className="font-bold">{data.unproductive || 0} h</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-slate-300">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#d6d9e0]" /> Neutral:
                    </span>
                    <span className="font-bold">{data.neutral || 0} h</span>
                </div>
            </div>
        </div>
    );
};

export function ProductivityStackedChart({
    intradayData = [],
    productivityBreakdown = [],
    onExport
}) {
    const [activeTab, setActiveTab] = useState('Productivity'); // 'Timeline', 'Activities', 'Productivity'

    const handleExport = () => {
        if (onExport) {
            onExport(activeTab);
            return;
        }

        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Date,Productive (h),Unproductive (h),Neutral (h),Total (h)\n';
        const exportData = productivityBreakdown && productivityBreakdown.length > 0 
            ? productivityBreakdown 
            : [];
        exportData.forEach(row => {
            csvContent += `${row.name || row.date},${row.productive},${row.unproductive},${row.neutral},${row.total}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `productivity-trends-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Real dynamic data from MySQL database
    const hasBreakdownData = Array.isArray(productivityBreakdown) && productivityBreakdown.length > 0;
    const hasIntradayData = Array.isArray(intradayData) && intradayData.length > 0;

    const displayData = hasBreakdownData ? productivityBreakdown : [];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 overflow-hidden">
            {/* Header with Subtabs & Export button */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('Timeline')}
                    className={`text-xs font-bold transition-colors ${
                        activeTab === 'Timeline'
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                    }`}
                >
                    Timeline
                </button>

                {/* Centered Pill Subtabs: Activities | Productivity */}
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('Activities')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                            activeTab === 'Activities'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        Activities
                    </button>
                    <button
                        onClick={() => setActiveTab('Productivity')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                            activeTab === 'Productivity'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        Productivity
                    </button>
                </div>

                <button
                    onClick={handleExport}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                >
                    Export
                </button>
            </div>

            {/* Chart Area */}
            <div className="p-6 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {activeTab === 'Productivity' ? (
                        displayData.length > 0 ? (
                            <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                    tickFormatter={(val) => `${val}h`}
                                />
                                <Tooltip content={<ProductivityTooltip />} />
                                <Bar dataKey="productive" name="Productive Time" stackId="a" fill="#00c48c" maxBarSize={28} />
                                <Bar dataKey="unproductive" name="Unproductive Time" stackId="a" fill="#ff6b72" maxBarSize={28} />
                                <Bar dataKey="neutral" name="Neutral Time" stackId="a" fill="#d6d9e0" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            </BarChart>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <p className="text-sm font-semibold">No productivity records found for this period</p>
                                <p className="text-xs mt-1 text-slate-400">Select a date range with recorded employee activity</p>
                            </div>
                        )
                    ) : (
                        <ComposedChart data={hasIntradayData ? intradayData : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                tickFormatter={(val) => `${val}h`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    borderRadius: '12px',
                                    border: 'none',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '12px'
                                }}
                            />
                            {activeTab === 'Timeline' ? (
                                <Area
                                    type="monotone"
                                    dataKey="active"
                                    name="Active Hours"
                                    stroke="#4f46e5"
                                    fill="#e0e7ff"
                                    strokeWidth={2.5}
                                />
                            ) : (
                                <>
                                    <Bar dataKey="active" name="Active Time" stackId="act" fill="#4f46e5" maxBarSize={18} />
                                    <Bar dataKey="idle" name="Idle Time" stackId="act" fill="#f59e0b" maxBarSize={18} />
                                    <Bar dataKey="break" name="Break Time" stackId="act" fill="#38bdf8" maxBarSize={18} />
                                    <Bar dataKey="manual" name="Manual Time" stackId="act" fill="#fb923c" radius={[2, 2, 0, 0]} maxBarSize={18} />
                                </>
                            )}
                        </ComposedChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-start gap-8 py-3.5 px-6 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {activeTab === 'Productivity' ? (
                    <>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#00c48c]" />
                            <span>Productive Time</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#ff6b72]" />
                            <span>Unproductive Time</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#d6d9e0]" />
                            <span>Neutral Time</span>
                        </span>
                    </>
                ) : (
                    <>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#4f46e5]" />
                            <span>Active Time</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                            <span>Idle Time</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#38bdf8]" />
                            <span>Break Time</span>
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProductivityStackedChart;
