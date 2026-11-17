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
        <div className="bg-[#1e293b] text-[#f8fafc] p-4 rounded-xl shadow-xl border border-[#334155] text-xs min-w-[190px]">
            <div className="font-sans font-bold text-[#818cf8] pb-2 mb-2 border-b border-[#334155] flex items-center justify-between">
                <span>{label || data.name}</span>
                <span className="font-sans font-bold text-white">{total} h total</span>
            </div>
            <div className="space-y-1.5 font-medium">
                <div className="flex items-center justify-between gap-3 text-[#6ee7b7]">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10b981]" /> Productive:
                    </span>
                    <span className="font-bold">{data.productive || 0} h</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[#fda4af]">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#f43f5e]" /> Unproductive:
                    </span>
                    <span className="font-bold">{data.unproductive || 0} h</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[#D5CDBC]">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#818cf8]" /> Neutral:
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
    const [activeTab, setActiveTab] = useState('Productivity');

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

    const hasBreakdownData = Array.isArray(productivityBreakdown) && productivityBreakdown.length > 0;
    const hasIntradayData = Array.isArray(intradayData) && intradayData.length > 0;
    const displayData = hasBreakdownData ? productivityBreakdown : [];

    return (
        <div className="bg-[#ffffff] dark:bg-[#0f172a] rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-warm-xs mb-8 overflow-hidden">
            {/* Header with Subtabs & Export button */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] dark:border-[#1e293b]">
                <button
                    onClick={() => setActiveTab('Timeline')}
                    className={`font-sans text-sm font-semibold transition-colors cursor-pointer ${
                        activeTab === 'Timeline'
                            ? 'text-[#0f172a] dark:text-[#f8fafc]'
                            : 'text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a]'
                    }`}
                >
                    Activity Timeline
                </button>

                {/* Centered Pill Subtabs: Activities | Productivity */}
                <div className="flex items-center p-1 bg-[#f1f5f9] dark:bg-[#1E2419] rounded-xl border border-[#e2e8f0] dark:border-[#1e293b]">
                    <button
                        onClick={() => setActiveTab('Activities')}
                        className={`px-3.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeTab === 'Activities'
                                ? 'bg-[#1e293b] text-white shadow-xs'
                                : 'text-[#64748b] hover:text-[#0f172a]'
                        }`}
                    >
                        Activities
                    </button>
                    <button
                        onClick={() => setActiveTab('Productivity')}
                        className={`px-3.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeTab === 'Productivity'
                                ? 'bg-[#6366f1] text-white shadow-xs'
                                : 'text-[#64748b] hover:text-[#0f172a]'
                        }`}
                    >
                        Productivity
                    </button>
                </div>

                <button
                    onClick={handleExport}
                    className="text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] hover:text-[#6366f1] flex items-center gap-1 cursor-pointer transition-colors"
                >
                    Export CSV
                </button>
            </div>

            {/* Chart Area */}
            <div className="p-6 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {activeTab === 'Productivity' ? (
                        displayData.length > 0 ? (
                            <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-[#1e293b]" opacity={0.6} />
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
                                <Bar dataKey="productive" name="Productive Time" stackId="a" fill="#10b981" maxBarSize={28} />
                                <Bar dataKey="unproductive" name="Unproductive Time" stackId="a" fill="#f43f5e" maxBarSize={28} />
                                <Bar dataKey="neutral" name="Neutral Time" stackId="a" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            </BarChart>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[#64748b]">
                                <p className="text-sm font-sans font-medium">No productivity records found for this period</p>
                                <p className="text-xs mt-1 text-[#94a3b8]">Select a date range with recorded employee activity</p>
                            </div>
                        )
                    ) : (
                        <ComposedChart data={hasIntradayData ? intradayData : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-[#1e293b]" opacity={0.6} />
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
                                    backgroundColor: '#1e293b',
                                    borderRadius: '12px',
                                    border: '1px solid #334155',
                                    color: '#f8fafc',
                                    fontWeight: 600,
                                    fontSize: '12px'
                                }}
                            />
                            {activeTab === 'Timeline' ? (
                                <Area
                                    type="monotone"
                                    dataKey="active"
                                    name="Active Hours"
                                    stroke="#1e293b"
                                    fill="#D0DAC9"
                                    strokeWidth={2.5}
                                />
                            ) : (
                                <>
                                    <Bar dataKey="active" name="Active Time" stackId="act" fill="#1e293b" maxBarSize={18} />
                                    <Bar dataKey="idle" name="Idle Time" stackId="act" fill="#818cf8" maxBarSize={18} />
                                    <Bar dataKey="break" name="Break Time" stackId="act" fill="#C98A3C" maxBarSize={18} />
                                    <Bar dataKey="manual" name="Manual Time" stackId="act" fill="#6366f1" radius={[2, 2, 0, 0]} maxBarSize={18} />
                                </>
                            )}
                        </ComposedChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-start gap-8 py-3.5 px-6 border-t border-[#e2e8f0] dark:border-[#1e293b] text-xs font-semibold text-[#64748b] dark:text-[#94a3b8]">
                {activeTab === 'Productivity' ? (
                    <>
                        <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                            <span>Productive Time</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
                            <span>Unproductive Time</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#818cf8]" />
                            <span>Neutral Time</span>
                        </span>
                    </>
                ) : (
                    <>
                        <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" />
                            <span>Active Time</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#818cf8]" />
                            <span>Idle Time</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#C98A3C]" />
                            <span>Break Time</span>
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProductivityStackedChart;
