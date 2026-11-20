import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
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
        <div className="bg-[#30382B] text-[#F5F1E9] p-4 rounded-xl shadow-xl border border-[#3C4536] text-xs min-w-[190px]">
            <div className="font-serif font-bold text-[#D3B98D] pb-2 mb-2 border-b border-[#3C4536] flex items-center justify-between">
                <span>{label || data.name}</span>
                <span className="font-sans font-bold text-white">{total} h total</span>
            </div>
            <div className="space-y-1.5 font-medium">
                <div className="flex items-center justify-between gap-3 text-[#A4C2A8]">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#5E7D64]" /> Productive:
                    </span>
                    <span className="font-bold">{data.productive || 0} h</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[#E8A5A5]">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#A84B4B]" /> Unproductive:
                    </span>
                    <span className="font-bold">{data.unproductive || 0} h</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[#D5CDBC]">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#D3B98D]" /> Neutral:
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
        <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs mb-8 overflow-hidden">
            {/* Header with Subtabs & Export button */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-[#D6CDBC] dark:border-[#384232]">
                <button
                    onClick={() => setActiveTab('Timeline')}
                    className={`font-serif text-sm font-semibold transition-colors cursor-pointer ${
                        activeTab === 'Timeline'
                            ? 'text-[#29291F] dark:text-[#F5F1E9]'
                            : 'text-[#777367] dark:text-[#B8B3A7] hover:text-[#29291F]'
                    }`}
                >
                    Activity Timeline
                </button>

                {/* Centered Pill Subtabs: Activities | Productivity */}
                <div className="flex items-center p-1 bg-[#EEE8DD] dark:bg-[#1E2419] rounded-xl border border-[#D6CDBC] dark:border-[#384232]">
                    <button
                        onClick={() => setActiveTab('Activities')}
                        className={`px-3 sm:px-3.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeTab === 'Activities'
                                ? 'bg-[#30382B] text-white shadow-xs'
                                : 'text-[#777367] hover:text-[#29291F]'
                        }`}
                    >
                        Activities
                    </button>
                    <button
                        onClick={() => setActiveTab('Productivity')}
                        className={`px-3 sm:px-3.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeTab === 'Productivity'
                                ? 'bg-[#B9955B] text-white shadow-xs'
                                : 'text-[#777367] hover:text-[#29291F]'
                        }`}
                    >
                        Productivity
                    </button>
                </div>

                <button
                    onClick={handleExport}
                    className="text-xs font-semibold text-[#777367] dark:text-[#B8B3A7] hover:text-[#B9955B] flex items-center gap-1 cursor-pointer transition-colors"
                >
                    Export CSV
                </button>
            </div>

            {/* Chart Area */}
            <div className="p-2 sm:p-6 h-64 sm:h-80 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    {activeTab === 'Productivity' ? (
                        displayData.length > 0 ? (
                            <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DED2" className="dark:stroke-[#384232]" opacity={0.6} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#777367', fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#777367', fontWeight: 600 }}
                                    tickFormatter={(val) => `${val}h`}
                                />
                                <Tooltip content={<ProductivityTooltip />} />
                                <Bar dataKey="productive" name="Productive Time" stackId="a" fill="#00C48C" maxBarSize={28} />
                                <Bar dataKey="unproductive" name="Unproductive Time" stackId="a" fill="#F46A6A" maxBarSize={28} />
                                <Bar dataKey="neutral" name="Neutral Time" stackId="a" fill="#CBD5E1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            </BarChart>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[#777367]">
                                <p className="text-sm font-serif font-medium">No productivity records found for this period</p>
                                <p className="text-xs mt-1 text-[#9E988A]">Select a date range with recorded employee activity</p>
                            </div>
                        )
                    ) : (
                        <ComposedChart data={hasIntradayData ? intradayData : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DED2" className="dark:stroke-[#384232]" opacity={0.6} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#777367', fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#777367', fontWeight: 600 }}
                                tickFormatter={(val) => `${val}h`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#30382B',
                                    borderRadius: '12px',
                                    border: '1px solid #3C4536',
                                    color: '#F5F1E9',
                                    fontWeight: 600,
                                    fontSize: '12px'
                                }}
                            />
                            {activeTab === 'Timeline' ? (
                                <Area
                                    type="monotone"
                                    dataKey="active"
                                    name="Active Hours"
                                    stroke="#30382B"
                                    fill="#D0DAC9"
                                    strokeWidth={2.5}
                                />
                            ) : (
                                <>
                                    <Bar dataKey="active" name="Active Time" stackId="act" fill="#30382B" maxBarSize={18} />
                                    <Bar dataKey="idle" name="Idle Time" stackId="act" fill="#D3B98D" maxBarSize={18} />
                                    <Bar dataKey="break" name="Break Time" stackId="act" fill="#C98A3C" maxBarSize={18} />
                                    <Bar dataKey="manual" name="Manual Time" stackId="act" fill="#B9955B" radius={[2, 2, 0, 0]} maxBarSize={18} />
                                </>
                            )}
                        </ComposedChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Bottom Legend */}
            <div className="flex flex-wrap items-center justify-start gap-6 py-3.5 px-6 border-t border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#777367] dark:text-[#B8B3A7]">
                {activeTab === 'Productivity' ? (
                    <>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#00C48C]" />
                            <span>Productive Time</span>
                            <HelpCircle size={13} className="text-[#9E988A] cursor-help" />
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#F46A6A]" />
                            <span>Unproductive Time</span>
                            <HelpCircle size={13} className="text-[#9E988A] cursor-help" />
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
                            <span>Neutral Time</span>
                            <HelpCircle size={13} className="text-[#9E988A] cursor-help" />
                        </span>
                    </>
                ) : (
                    <>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#30382B]" />
                            <span>Active Time</span>
                            <HelpCircle size={13} className="text-[#9E988A] cursor-help" />
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#D3B98D]" />
                            <span>Idle Time</span>
                            <HelpCircle size={13} className="text-[#9E988A] cursor-help" />
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#C98A3C]" />
                            <span>Break Time</span>
                            <HelpCircle size={13} className="text-[#9E988A] cursor-help" />
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProductivityStackedChart;
