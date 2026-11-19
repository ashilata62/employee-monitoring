import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Globe,
    Monitor,
    Calendar as CalendarIcon,
    Download,
    Share2,
    ChevronDown,
    Search,
    Filter,
    Clock,
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    Code,
    MessageSquare,
    Chrome,
    Terminal,
    Sparkles,
    Users,
    Tag,
    Check
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import api from '../../services/apiClient';
import { InsightfulModuleSwitcher } from '../../components/common/InsightfulModuleSwitcher';

// Helper for standard app logos
const getAppIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('code') || n.includes('visual studio') || n.includes('cursor')) return { icon: Code, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' };
    if (n.includes('slack') || n.includes('teams') || n.includes('zoom')) return { icon: MessageSquare, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30' };
    if (n.includes('chrome') || n.includes('google')) return { icon: Chrome, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' };
    if (n.includes('terminal') || n.includes('cmd') || n.includes('bash')) return { icon: Terminal, color: 'text-slate-700 bg-slate-100 dark:bg-slate-800' };
    if (n.includes('chatgpt') || n.includes('claude') || n.includes('copilot') || n.includes('ai')) return { icon: Sparkles, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' };
    return { icon: Globe, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' };
};

// CSV Download Helper
function downloadCsv(filename, headers, rows) {
    const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

const formatSeconds = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00 h';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} h`;
};

const formatDateKey = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getInitialDateRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startKey = formatDateKey(startOfMonth);
    const endKey = formatDateKey(today);
    const monthName = today.toLocaleString('en-US', { month: 'short' });
    return {
        start: startKey,
        end: endKey,
        display: `${monthName} 1, ${today.getFullYear()} → ${monthName} ${today.getDate()}, ${today.getFullYear()}`
    };
};

export function AppsWebsites() {
    // ── Interactive State ───────────────────────────────────────────────────
    const [selectedCategory, setSelectedCategory] = useState('All Apps');
    const [selectedDatePreset, setSelectedDatePreset] = useState('This Month');
    const [dateRange, setDateRange] = useState(getInitialDateRange);
    const [timeGrain, setTimeGrain] = useState('Days'); // 'Days' | 'Weeks' | 'Months'
    const [searchQuery, setSearchQuery] = useState('');
    const [productivityFilter, setProductivityFilter] = useState('ALL');

    // Report data from backend
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Dropdown Toggles
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const categoryRef = useRef(null);
    const dateRef = useRef(null);
    const filterRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (categoryRef.current && !categoryRef.current.contains(e.target)) setIsCategoryOpen(false);
            if (dateRef.current && !dateRef.current.contains(e.target)) setIsDateOpen(false);
            if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch report data whenever dateRange changes
    useEffect(() => {
        const fetchAppsReport = async (isBackground = false) => {
            if (!isBackground) setLoading(true);
            try {
                const res = await api.get('/reports', {
                    params: {
                        type: 'apps-websites',
                        startDate: dateRange.start,
                        endDate: dateRange.end
                    }
                });
                const data = res.data?.data || res.data || {};
                setReportData(data);
            } catch (err) {
                console.error('Failed to load apps report:', err);
            } finally {
                if (!isBackground) setLoading(false);
            }
        };

        fetchAppsReport();
        const interval = setInterval(() => fetchAppsReport(true), 30000);
        return () => clearInterval(interval);
    }, [dateRange.start, dateRange.end]);

    // Available categories from DB or standard options
    const categories = useMemo(() => {
        if (reportData?.categories?.length) return reportData.categories;
        return ['All Apps', 'Development', 'Communication', 'Productivity', 'Design', 'AI tools', 'Entertainment', 'Uncategorized'];
    }, [reportData]);

    // Filtered apps based on selected category, productivity, and search query
    const filteredApps = useMemo(() => {
        const list = reportData?.apps || [];
        return list.filter(app => {
            const matchesCat = selectedCategory === 'All Apps' || app.category === selectedCategory;
            const matchesProd = productivityFilter === 'ALL' || app.productivity === productivityFilter;
            const matchesQuery = app.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesProd && matchesQuery;
        });
    }, [reportData, selectedCategory, productivityFilter, searchQuery]);

    // ── Dynamic KPI Calculations based on real filtered apps ────────────────
    const kpiSummary = useMemo(() => {
        if (!reportData) {
            return {
                totalHours: '00:00 h',
                totalAvg: '00:00 h average',
                productiveHours: '00:00 h',
                productiveAvg: '00:00 h average',
                neutralHours: '00:00 h',
                neutralAvg: '00:00 h average',
                unproductiveHours: '00:00 h',
                unproductiveAvg: '00:00 h average',
            };
        }

        // If All Apps is selected, use organization-wide summary from backend
        if (selectedCategory === 'All Apps' && productivityFilter === 'ALL' && !searchQuery) {
            return reportData.summary || {
                totalHours: '00:00 h',
                totalAvg: '00:00 h average',
                productiveHours: '00:00 h',
                productiveAvg: '00:00 h average',
                neutralHours: '00:00 h',
                neutralAvg: '00:00 h average',
                unproductiveHours: '00:00 h',
                unproductiveAvg: '00:00 h average',
            };
        }

        // If filtered, compute sum dynamically
        let total = 0, prod = 0, neutral = 0, unprod = 0;
        filteredApps.forEach(a => {
            const dur = a.duration || 0;
            total += dur;
            if (a.productivity === 'PRODUCTIVE') prod += dur;
            else if (a.productivity === 'UNPRODUCTIVE') unprod += dur;
            else neutral += dur;
        });

        return {
            totalHours: formatSeconds(total),
            totalAvg: `${formatSeconds(Math.round(total / Math.max(filteredApps.length, 1)))} average`,
            productiveHours: formatSeconds(prod),
            productiveAvg: `${formatSeconds(Math.round(prod / Math.max(filteredApps.length, 1)))} average`,
            neutralHours: formatSeconds(neutral),
            neutralAvg: `${formatSeconds(Math.round(neutral / Math.max(filteredApps.length, 1)))} average`,
            unproductiveHours: formatSeconds(unprod),
            unproductiveAvg: `${formatSeconds(Math.round(unprod / Math.max(filteredApps.length, 1)))} average`,
        };
    }, [reportData, selectedCategory, productivityFilter, searchQuery, filteredApps]);

    // ── Dynamic Chart Data based on timeGrain ────────────────────────────────
    const chartData = useMemo(() => {
        const trend = reportData?.trend || [];
        if (timeGrain === 'Weeks') {
            // Group trend into 7-day chunks
            const weeks = [];
            for (let i = 0; i < trend.length; i += 7) {
                const chunk = trend.slice(i, i + 7);
                const hrs = chunk.reduce((acc, c) => acc + (c.hours || 0), 0);
                weeks.push({
                    label: `Week ${Math.floor(i / 7) + 1}`,
                    hours: Number(hrs.toFixed(1))
                });
            }
            return weeks.length ? weeks : [{ label: 'Week 1', hours: 0 }];
        }
        if (timeGrain === 'Months') {
            const monthMap = {};
            trend.forEach(t => {
                const month = t.label ? t.label.split(' ')[0] : 'Nov';
                monthMap[month] = (monthMap[month] || 0) + (t.hours || 0);
            });
            return Object.keys(monthMap).map(m => ({ label: m, hours: Number(monthMap[m].toFixed(1)) }));
        }
        return trend.length ? trend : [{ label: 'Today', hours: 0 }];
    }, [reportData, timeGrain]);

    // Most Used vs Least Used
    const mostUsedApps = useMemo(() => {
        return filteredApps.slice(0, 5);
    }, [filteredApps]);

    const leastUsedApps = useMemo(() => {
        return [...filteredApps].reverse().slice(0, 5);
    }, [filteredApps]);

    // Handle Preset Selection
    const handleDatePresetSelect = (preset) => {
        setSelectedDatePreset(preset);
        setIsDateOpen(false);
        const now = new Date();
        const todayKey = formatDateKey(now);
        const monthName = now.toLocaleString('en-US', { month: 'short' });

        if (preset === 'Today') {
            setDateRange({
                start: todayKey,
                end: todayKey,
                display: `${monthName} ${now.getDate()}, ${now.getFullYear()}`
            });
        } else if (preset === 'Yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const yKey = formatDateKey(yesterday);
            const yMonth = yesterday.toLocaleString('en-US', { month: 'short' });
            setDateRange({
                start: yKey,
                end: yKey,
                display: `${yMonth} ${yesterday.getDate()}, ${yesterday.getFullYear()}`
            });
        } else if (preset === 'Last 7 Days') {
            const past7 = new Date(now);
            past7.setDate(now.getDate() - 6);
            const past7Key = formatDateKey(past7);
            const pMonth = past7.toLocaleString('en-US', { month: 'short' });
            setDateRange({
                start: past7Key,
                end: todayKey,
                display: `${pMonth} ${past7.getDate()}, ${past7.getFullYear()} → ${monthName} ${now.getDate()}, ${now.getFullYear()}`
            });
        } else if (preset.startsWith('This Month')) {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            setDateRange({
                start: formatDateKey(startOfMonth),
                end: todayKey,
                display: `${monthName} 1, ${now.getFullYear()} → ${monthName} ${now.getDate()}, ${now.getFullYear()}`
            });
        }
    };

    const handleExport = () => {
        const headers = ['Application', 'Category', 'Productivity', 'Duration', 'Users', 'Usage %'];
        const rows = filteredApps.map(a => [a.name, a.category, a.productivity, a.timeFormatted, a.userCount, `${a.usagePercent}%`]);
        downloadCsv(`apps-websites-usage-${dateRange.start}-to-${dateRange.end}.csv`, headers, rows);
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Top Module Quick Switcher */}
            <InsightfulModuleSwitcher activeTab="apps" />

            {/* Top Header & Interactive Category Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="relative" ref={categoryRef}>
                    <button
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className="flex items-center gap-3 group text-left cursor-pointer"
                    >
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 group-hover:text-primary-600 transition-colors">
                            {selectedCategory}
                            <ChevronDown size={20} className={`text-slate-400 group-hover:text-primary-600 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                        </h1>
                    </button>

                    {/* Category Dropdown Menu */}
                    {isCategoryOpen && (
                        <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setIsCategoryOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-colors ${
                                        selectedCategory === cat
                                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <span>{cat}</span>
                                    {selectedCategory === cat && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] rounded-xl hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] transition-all shadow-warm-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        <Download size={14} className="text-[#29291F] dark:text-[#F5F1E9]" /> Export
                    </button>
                </div>
            </div>

            {/* Filter Bar (Date Preset, Productivity Filter, Search) */}
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                {/* Date Dropdown */}
                <div className="relative" ref={dateRef}>
                    <button
                        onClick={() => setIsDateOpen(!isDateOpen)}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#EEE8DD] dark:bg-[#252B20] text-[#29291F] dark:text-[#F5F1E9] border border-[#D6CDBC] dark:border-[#384232] hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] transition-colors cursor-pointer"
                    >
                        <CalendarIcon size={14} className="text-[#B9955B]" />
                        <span>{dateRange.display}</span>
                        <ChevronDown size={14} className="text-[#777367] dark:text-[#B8B3A7]" />
                    </button>

                    {isDateOpen && (
                        <div className="absolute left-0 top-full mt-2 w-56 bg-[#EEE8DD] dark:bg-[#252B20] rounded-xl shadow-xl border border-[#D6CDBC] dark:border-[#384232] py-1.5 z-50">
                            {['Today', 'Yesterday', 'Last 7 Days', 'This Month'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => handleDatePresetSelect(p)}
                                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] flex items-center justify-between cursor-pointer"
                                >
                                    <span>{p}</span>
                                    {selectedDatePreset === p && <Check size={13} className="text-[#B9955B]" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Productivity Filter */}
                <div className="relative" ref={filterRef}>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#EEE8DD] dark:bg-[#252B20] text-[#29291F] dark:text-[#F5F1E9] border border-[#D6CDBC] dark:border-[#384232] hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] transition-colors cursor-pointer"
                    >
                        <Filter size={14} className="text-[#777367] dark:text-[#B8B3A7]" />
                        <span>Filter: {productivityFilter}</span>
                        <ChevronDown size={14} className="text-[#777367] dark:text-[#B8B3A7]" />
                    </button>

                    {isFilterOpen && (
                        <div className="absolute left-0 top-full mt-2 w-48 bg-[#EEE8DD] dark:bg-[#252B20] rounded-xl shadow-xl border border-[#D6CDBC] dark:border-[#384232] py-1.5 z-50">
                            {['ALL', 'PRODUCTIVE', 'NEUTRAL', 'UNPRODUCTIVE'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => {
                                        setProductivityFilter(f);
                                        setIsFilterOpen(false);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] flex items-center justify-between cursor-pointer"
                                >
                                    <span>{f}</span>
                                    {productivityFilter === f && <Check size={13} className="text-[#B9955B]" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777367]" />
                    <input
                        type="text"
                        placeholder="Search applications & websites..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-[#F5F1E9] dark:bg-[#1E2419] text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] rounded-xl border border-[#D6CDBC] dark:border-[#384232] outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
            </div>

            {/* 4 Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL HOURS</span>
                        <Clock size={16} className="text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                        {kpiSummary.totalHours}
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        {kpiSummary.totalAvg}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PRODUCTIVE HOURS</span>
                        <TrendingUp size={16} className="text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums text-emerald-600 dark:text-emerald-400">
                        {kpiSummary.productiveHours}
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        {kpiSummary.productiveAvg}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NEUTRAL HOURS</span>
                        <MoreHorizontal size={16} className="text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                        {kpiSummary.neutralHours}
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        {kpiSummary.neutralAvg}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">UNPRODUCTIVE HOURS</span>
                        <TrendingDown size={16} className="text-rose-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums text-rose-600 dark:text-rose-400">
                        {kpiSummary.unproductiveHours}
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        {kpiSummary.unproductiveAvg}
                    </p>
                </div>
            </div>

            {/* Usage Curve Area Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                            Average Usage
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                            Tracked active software utilization across workforce
                        </p>
                    </div>

                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start">
                        {['Days', 'Weeks', 'Months'].map((grain) => (
                            <button
                                key={grain}
                                onClick={() => setTimeGrain(grain)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                    timeGrain === grain
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {grain}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-64 w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="label"
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    fontWeight={600}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    fontWeight={600}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${val}h`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderRadius: '12px',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontWeight: 600
                                    }}
                                    formatter={(val) => [`${val} h`, 'Tracked Usage']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="hours"
                                    stroke="#6366f1"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#usageGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">
                            No usage data recorded for this range.
                        </div>
                    )}
                </div>
            </div>

            {/* Applications & Websites Usage Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                            All Applications & Websites
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                            Ranked by total workforce active time
                        </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                        {filteredApps.length} tracked software
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-3.5">Application / Website</th>
                                <th className="px-6 py-3.5">Category</th>
                                <th className="px-6 py-3.5">Productivity</th>
                                <th className="px-6 py-3.5">Total Hours</th>
                                <th className="px-6 py-3.5">Users</th>
                                <th className="px-6 py-3.5 text-right">Usage Share</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                            {filteredApps.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-semibold">
                                        No applications recorded for this selection.
                                    </td>
                                </tr>
                            ) : (
                                filteredApps.map((app) => {
                                    const { icon: AppIcon, color } = getAppIcon(app.name);
                                    return (
                                        <tr key={app.id || app.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${color}`}>
                                                        <AppIcon size={16} />
                                                    </div>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {app.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-semibold">
                                                {app.category}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                    app.productivity === 'PRODUCTIVE'
                                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : app.productivity === 'UNPRODUCTIVE'
                                                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    {app.productivity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-black text-slate-900 dark:text-white tabular-nums">
                                                {app.timeFormatted}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-bold tabular-nums">
                                                {app.userCount}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="w-20 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-primary-500 transition-all duration-700"
                                                            style={{ width: `${Math.min(app.usagePercent, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                                        {app.usagePercent}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AppsWebsites;
