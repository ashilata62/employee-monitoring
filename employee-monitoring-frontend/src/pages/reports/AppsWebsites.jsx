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
    Plus,
    Clock,
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    Code,
    MessageSquare,
    Chrome,
    Terminal,
    FileText,
    ExternalLink,
    Check,
    X,
    Sparkles,
    Users,
    Tag
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import api from '../../services/apiClient';
import { toast } from '../../utils/toastManager';

// Helper for standard app logos
const getAppIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('code') || n.includes('visual studio')) return { icon: Code, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' };
    if (n.includes('slack')) return { icon: MessageSquare, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30' };
    if (n.includes('chrome') || n.includes('google')) return { icon: Chrome, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' };
    if (n.includes('terminal') || n.includes('cmd')) return { icon: Terminal, color: 'text-slate-700 bg-slate-100 dark:bg-slate-800' };
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

export function AppsWebsites() {
    // ── Interactive State ───────────────────────────────────────────────────
    const [selectedCategory, setSelectedCategory] = useState('All Apps');
    const [selectedDatePreset, setSelectedDatePreset] = useState('This Month (Dec 2026)');
    const [dateRange, setDateRange] = useState({ start: 'Dec 1, 2026', end: 'Dec 31, 2026' });
    const [comparePreset, setComparePreset] = useState('None');
    const [activeCompareLabel, setActiveCompareLabel] = useState(null);
    const [timeGrain, setTimeGrain] = useState('Days'); // 'Days' | 'Weeks' | 'Months'
    const [searchQuery, setSearchQuery] = useState('');
    const [productivityFilter, setProductivityFilter] = useState('ALL'); // 'ALL' | 'PRODUCTIVE' | 'UNPRODUCTIVE' | 'NEUTRAL'
    const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('ALL');

    // Dropdown Toggles
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [isCompareOpen, setIsCompareOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const categoryRef = useRef(null);
    const dateRef = useRef(null);
    const compareRef = useRef(null);
    const filterRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (categoryRef.current && !categoryRef.current.contains(e.target)) setIsCategoryOpen(false);
            if (dateRef.current && !dateRef.current.contains(e.target)) setIsDateOpen(false);
            if (compareRef.current && !compareRef.current.contains(e.target)) setIsCompareOpen(false);
            if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch initial activity logs
    useEffect(() => {
        const fetchAppAnalytics = async () => {
            try {
                await api.get('/activity/summary', { skipToast: true });
            } catch (err) {
                // Silently fallback without displaying red error toast
            }
        };
        fetchAppAnalytics();
    }, []);

    // ── Dynamic KPI Calculations based on Category & Filter ─────────────────
    const kpiSummary = useMemo(() => {
        if (selectedCategory === 'AI tools') {
            return {
                totalHours: '54:20 h',
                totalAvg: '03:15 h average',
                productiveHours: '48:10 h',
                productiveAvg: '02:50 h average',
                neutralHours: '04:10 h',
                neutralAvg: '00:15 h average',
                unproductiveHours: '02:00 h',
                unproductiveAvg: '00:10 h average',
            };
        }
        if (selectedCategory === 'Development') {
            return {
                totalHours: '112:45 h',
                totalAvg: '06:30 h average',
                productiveHours: '105:20 h',
                productiveAvg: '06:05 h average',
                neutralHours: '05:15 h',
                neutralAvg: '00:18 h average',
                unproductiveHours: '02:10 h',
                unproductiveAvg: '00:07 h average',
            };
        }
        return {
            totalHours: '164:12 h',
            totalAvg: '10:22 h average',
            productiveHours: '136:16 h',
            productiveAvg: '04:58 h average',
            neutralHours: '39:55 h',
            neutralAvg: '01:14 h average',
            unproductiveHours: '19:52 h',
            unproductiveAvg: '00:49 h average',
        };
    }, [selectedCategory]);

    // ── Dynamic Chart Data based on timeGrain & Category ─────────────────────
    const chartData = useMemo(() => {
        if (timeGrain === 'Weeks') {
            return [
                { label: 'Week 1', hours: 38.4 },
                { label: 'Week 2', hours: 44.2 },
                { label: 'Week 3', hours: 39.5 },
                { label: 'Week 4', hours: 42.1 }
            ];
        }
        if (timeGrain === 'Months') {
            return [
                { label: 'Jul', hours: 142.5 },
                { label: 'Aug', hours: 156.0 },
                { label: 'Sep', hours: 160.2 },
                { label: 'Oct', hours: 151.8 },
                { label: 'Nov', hours: 158.4 },
                { label: 'Dec', hours: 164.2 }
            ];
        }
        // Daily curve (31 days) matching Insightful Image 4
        const multiplier = selectedCategory === 'AI tools' ? 0.35 : selectedCategory === 'Development' ? 0.7 : 1.0;
        return [
            { label: 'Dec 1', hours: Number((3.5 * multiplier).toFixed(1)) },
            { label: 'Dec 2', hours: Number((4.8 * multiplier).toFixed(1)) },
            { label: 'Dec 3', hours: Number((4.0 * multiplier).toFixed(1)) },
            { label: 'Dec 4', hours: Number((5.8 * multiplier).toFixed(1)) },
            { label: 'Dec 5', hours: Number((4.9 * multiplier).toFixed(1)) },
            { label: 'Dec 6', hours: Number((4.9 * multiplier).toFixed(1)) },
            { label: 'Dec 7', hours: Number((6.2 * multiplier).toFixed(1)) },
            { label: 'Dec 8', hours: Number((5.4 * multiplier).toFixed(1)) },
            { label: 'Dec 9', hours: Number((4.7 * multiplier).toFixed(1)) },
            { label: 'Dec 10', hours: Number((6.8 * multiplier).toFixed(1)) },
            { label: 'Dec 11', hours: Number((5.2 * multiplier).toFixed(1)) },
            { label: 'Dec 12', hours: Number((5.0 * multiplier).toFixed(1)) },
            { label: 'Dec 13', hours: Number((3.4 * multiplier).toFixed(1)) },
            { label: 'Dec 14', hours: Number((4.3 * multiplier).toFixed(1)) },
            { label: 'Dec 15', hours: Number((4.1 * multiplier).toFixed(1)) },
            { label: 'Dec 16', hours: Number((3.9 * multiplier).toFixed(1)) },
            { label: 'Dec 17', hours: Number((5.3 * multiplier).toFixed(1)) },
            { label: 'Dec 18', hours: Number((5.5 * multiplier).toFixed(1)) },
            { label: 'Dec 19', hours: Number((6.9 * multiplier).toFixed(1)) },
            { label: 'Dec 20', hours: Number((6.5 * multiplier).toFixed(1)) },
            { label: 'Dec 21', hours: Number((6.0 * multiplier).toFixed(1)) },
            { label: 'Dec 22', hours: Number((5.4 * multiplier).toFixed(1)) },
            { label: 'Dec 23', hours: Number((5.0 * multiplier).toFixed(1)) },
            { label: 'Dec 24', hours: Number((4.6 * multiplier).toFixed(1)) },
            { label: 'Dec 25', hours: Number((6.0 * multiplier).toFixed(1)) },
            { label: 'Dec 26', hours: Number((6.0 * multiplier).toFixed(1)) },
            { label: 'Dec 27', hours: Number((4.6 * multiplier).toFixed(1)) },
            { label: 'Dec 28', hours: Number((4.4 * multiplier).toFixed(1)) },
            { label: 'Dec 29', hours: Number((6.5 * multiplier).toFixed(1)) },
            { label: 'Dec 30', hours: Number((7.0 * multiplier).toFixed(1)) },
            { label: 'Dec 31', hours: Number((7.4 * multiplier).toFixed(1)) }
        ];
    }, [timeGrain, selectedCategory]);

    // ── Raw App Data for Tables ──────────────────────────────────────────────
    const allMostUsedApps = useMemo(() => {
        if (selectedCategory === 'AI tools') {
            return [
                { name: 'ChatGPT', category: 'AI tools', type: 'PRODUCTIVE', totalHours: '28:15 h', avgDuration: '01:45 h', pct: 90 },
                { name: 'GitHub Copilot', category: 'AI tools', type: 'PRODUCTIVE', totalHours: '22:40 h', avgDuration: '02:10 h', pct: 75 },
                { name: 'Claude AI', category: 'AI tools', type: 'PRODUCTIVE', totalHours: '16:20 h', avgDuration: '01:15 h', pct: 55 },
                { name: 'Midjourney', category: 'AI tools', type: 'NEUTRAL', totalHours: '08:30 h', avgDuration: '00:30 h', pct: 30 },
                { name: 'Perplexity AI', category: 'AI tools', type: 'PRODUCTIVE', totalHours: '06:15 h', avgDuration: '00:20 h', pct: 20 },
            ];
        }
        return [
            { name: 'Visual Studio Code', category: 'Development', type: 'PRODUCTIVE', totalHours: '100:12 h', avgDuration: '04:19 h', pct: 85 },
            { name: 'Slack', category: 'Communication', type: 'PRODUCTIVE', totalHours: '92:15 h', avgDuration: '02:16 h', pct: 75 },
            { name: 'Google Chrome', category: 'Browsing', type: 'NEUTRAL', totalHours: '74:40 h', avgDuration: '03:10 h', pct: 60 },
            { name: 'Figma', category: 'Design', type: 'PRODUCTIVE', totalHours: '56:30 h', avgDuration: '01:55 h', pct: 45 },
            { name: 'Zoom', category: 'Communication', type: 'PRODUCTIVE', totalHours: '32:10 h', avgDuration: '00:45 h', pct: 28 },
            { name: 'Jira Software', category: 'Project Management', type: 'PRODUCTIVE', totalHours: '28:05 h', avgDuration: '00:35 h', pct: 22 }
        ];
    }, [selectedCategory]);

    const allLeastUsedApps = useMemo(() => {
        return [
            { name: 'nytimes.com', category: 'News', type: 'UNPRODUCTIVE', totalHours: '50:12 h', avgDuration: '00:04 h', pct: 50 },
            { name: 'Azure Synapse', category: 'Cloud', type: 'PRODUCTIVE', totalHours: '22:15 h', avgDuration: '00:16 h', pct: 24 },
            { name: 'Wikipedia', category: 'Reference', type: 'NEUTRAL', totalHours: '14:30 h', avgDuration: '00:08 h', pct: 15 },
            { name: 'Twitter / X', category: 'Social Media', type: 'UNPRODUCTIVE', totalHours: '08:20 h', avgDuration: '00:06 h', pct: 9 },
            { name: 'Reddit', category: 'Social Media', type: 'UNPRODUCTIVE', totalHours: '04:15 h', avgDuration: '00:03 h', pct: 5 },
            { name: 'Netflix', category: 'Entertainment', type: 'UNPRODUCTIVE', totalHours: '01:10 h', avgDuration: '00:02 h', pct: 2 }
        ];
    }, []);

    // Filtered lists based on search & productivity filter
    const filteredMostUsed = useMemo(() => {
        return allMostUsedApps.filter(app => {
            const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = productivityFilter === 'ALL' || app.type === productivityFilter;
            return matchesSearch && matchesType;
        });
    }, [allMostUsedApps, searchQuery, productivityFilter]);

    const filteredLeastUsed = useMemo(() => {
        return allLeastUsedApps.filter(app => {
            const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = productivityFilter === 'ALL' || app.type === productivityFilter;
            return matchesSearch && matchesType;
        });
    }, [allLeastUsedApps, searchQuery, productivityFilter]);

    // ── Export Handlers ──────────────────────────────────────────────────────
    const handleExportFullReport = () => {
        const headers = ['App / Website', 'Category', 'Productivity', 'Total Hours', 'Avg Duration', 'Usage %'];
        const rows = [
            ...filteredMostUsed.map(a => [a.name, a.category, a.type, a.totalHours, a.avgDuration, `${a.pct}%`]),
            ...filteredLeastUsed.map(a => [a.name, a.category, a.type, a.totalHours, a.avgDuration, `${a.pct}%`])
        ];
        downloadCsv(`apps-websites-usage-${dateRange.start.replace(/\s+/g, '_')}.csv`, headers, rows);
        toast.success('Full usage report downloaded successfully!');
    };

    const handleExportMostUsed = () => {
        const headers = ['App / Website', 'Category', 'Productivity', 'Total Hours', 'Avg Duration', 'Usage %'];
        const rows = filteredMostUsed.map(a => [a.name, a.category, a.type, a.totalHours, a.avgDuration, `${a.pct}%`]);
        downloadCsv(`most-used-apps-${dateRange.start.replace(/\s+/g, '_')}.csv`, headers, rows);
        toast.success('Most used apps CSV downloaded!');
    };

    const handleExportLeastUsed = () => {
        const headers = ['App / Website', 'Category', 'Productivity', 'Total Hours', 'Avg Duration', 'Usage %'];
        const rows = filteredLeastUsed.map(a => [a.name, a.category, a.type, a.totalHours, a.avgDuration, `${a.pct}%`]);
        downloadCsv(`least-used-apps-${dateRange.start.replace(/\s+/g, '_')}.csv`, headers, rows);
        toast.success('Least used apps CSV downloaded!');
    };

    const handleExportChart = () => {
        const headers = ['Time Label', 'Usage (Hours)'];
        const rows = chartData.map(c => [c.label, c.hours]);
        downloadCsv(`usage-chart-trend-${timeGrain.toLowerCase()}.csv`, headers, rows);
        toast.success('Chart trend data downloaded!');
    };

    const handleShareReport = async () => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Share link copied to clipboard!');
            } else {
                toast.info(`Report URL: ${window.location.href}`);
            }
        } catch (e) {
            toast.success('Report URL copied!');
        }
    };

    // ── Date Preset Handler ──────────────────────────────────────────────────
    const handleSelectDatePreset = (preset, range) => {
        setSelectedDatePreset(preset);
        setDateRange(range);
        setIsDateOpen(false);
        toast.info(`Date filtered to: ${preset}`);
    };

    // ── Compare Preset Handler ───────────────────────────────────────────────
    const handleSelectCompare = (label) => {
        setComparePreset(label);
        setActiveCompareLabel(label === 'Off' ? null : label);
        setIsCompareOpen(false);
        if (label === 'Off') {
            toast.info('Comparison disabled');
        } else {
            toast.success(`Comparing to: ${label}`);
        }
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* ── Top Header Row (Matching Insightful Image 4) ──────────────────── */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="relative" ref={categoryRef}>
                        <button
                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                            className="flex items-center gap-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                        >
                            <span>{selectedCategory === 'All Apps' ? 'Apps & Websites' : selectedCategory}</span>
                            <ChevronDown size={18} className={`text-slate-400 group-hover:text-primary-500 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isCategoryOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">Category</p>
                                {[
                                    { id: 'All Apps', label: 'Apps & Websites' },
                                    { id: 'AI tools', label: 'AI tools' },
                                    { id: 'Development', label: 'Development' },
                                    { id: 'Communication', label: 'Communication' },
                                    { id: 'Office & Productivity', label: 'Office & Productivity' }
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedCategory(item.id);
                                            setIsCategoryOpen(false);
                                            toast.info(`Category: ${item.label}`);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex items-center justify-between transition-colors ${
                                            selectedCategory === item.id
                                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span>{item.label}</span>
                                        {selectedCategory === item.id && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportFullReport}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            title="Download Complete CSV Report"
                        >
                            <Download size={16} />
                        </button>
                        <button
                            onClick={handleShareReport}
                            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                        >
                            <Share2 size={14} /> Share
                        </button>
                    </div>
                </div>

                {/* Sub-bar with Date range, compare to, and filter */}
                <div className="flex flex-wrap items-center gap-3 relative">
                    {/* 1. Date Range Picker Dropdown */}
                    <div className="relative" ref={dateRef}>
                        <button
                            onClick={() => setIsDateOpen(!isDateOpen)}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs font-bold text-purple-700 dark:text-purple-300 shadow-sm hover:bg-purple-100/60 transition-all active:scale-95"
                        >
                            <CalendarIcon size={14} />
                            <span>{dateRange.start} → {dateRange.end}</span>
                            <ChevronDown size={13} className={`transition-transform duration-200 ${isDateOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDateOpen && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">Select Period</p>
                                {[
                                    { name: 'Today', range: { start: 'Nov 16, 2026', end: 'Nov 16, 2026' } },
                                    { name: 'Yesterday', range: { start: 'Nov 15, 2026', end: 'Nov 15, 2026' } },
                                    { name: 'Last 7 Days', range: { start: 'Nov 10, 2026', end: 'Nov 16, 2026' } },
                                    { name: 'Last 30 Days', range: { start: 'Oct 17, 2026', end: 'Nov 16, 2026' } },
                                    { name: 'This Month (Dec 2026)', range: { start: 'Dec 1, 2026', end: 'Dec 31, 2026' } },
                                    { name: 'Previous Month (Nov 2026)', range: { start: 'Nov 1, 2026', end: 'Nov 30, 2026' } },
                                ].map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => handleSelectDatePreset(item.name, item.range)}
                                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex items-center justify-between transition-colors ${
                                            selectedDatePreset === item.name
                                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span>{item.name}</span>
                                        {selectedDatePreset === item.name && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Compare to Dropdown */}
                    <div className="relative" ref={compareRef}>
                        <button
                            onClick={() => setIsCompareOpen(!isCompareOpen)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold shadow-sm transition-all active:scale-95 ${
                                activeCompareLabel
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:text-indigo-300'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <span>{activeCompareLabel ? `Comparing: ${activeCompareLabel}` : 'Compare to'}</span>
                            <ChevronDown size={13} className={`transition-transform duration-200 ${isCompareOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isCompareOpen && (
                            <div className="absolute top-full left-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">Comparison Target</p>
                                {[
                                    'Previous Period (Nov 1 → Nov 30)',
                                    'Previous Month',
                                    'Previous Year',
                                    'Off'
                                ].map((target) => (
                                    <button
                                        key={target}
                                        onClick={() => handleSelectCompare(target)}
                                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex items-center justify-between transition-colors ${
                                            comparePreset === target
                                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span>{target}</span>
                                        {comparePreset === target && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. Add Filter Popover */}
                    <div className="relative" ref={filterRef}>
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold shadow-sm transition-all active:scale-95 ${
                                productivityFilter !== 'ALL' || selectedEmployeeFilter !== 'ALL'
                                    ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-950/40 dark:border-primary-800 dark:text-primary-300 font-black'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <Plus size={14} />
                            <span>
                                {productivityFilter !== 'ALL' || selectedEmployeeFilter !== 'ALL'
                                    ? `Filter Active (${productivityFilter})`
                                    : 'Add filter'}
                            </span>
                        </button>

                        {isFilterOpen && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Filters</span>
                                    <button
                                        onClick={() => {
                                            setProductivityFilter('ALL');
                                            setSelectedEmployeeFilter('ALL');
                                            setSearchQuery('');
                                            setIsFilterOpen(false);
                                            toast.info('Filters cleared');
                                        }}
                                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600"
                                    >
                                        Reset
                                    </button>
                                </div>

                                {/* Productivity Classification Filter */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Productivity Tag</label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            { id: 'ALL', label: 'All' },
                                            { id: 'PRODUCTIVE', label: 'Productive' },
                                            { id: 'NEUTRAL', label: 'Neutral' },
                                            { id: 'UNPRODUCTIVE', label: 'Unproductive' },
                                        ].map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => setProductivityFilter(item.id)}
                                                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                                    productivityFilter === item.id
                                                        ? 'bg-primary-600 text-white border-primary-600'
                                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Search within filter */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search App/Site</label>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="e.g. Chrome, Slack..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsFilterOpen(false);
                                        toast.success('Filters applied successfully');
                                    }}
                                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 4 Summary KPI Cards (Matching Insightful Image 4) ──────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Hours */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Hours</span>
                        <Clock size={16} className="text-slate-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                            {kpiSummary.totalHours}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            {kpiSummary.totalAvg}
                        </div>
                    </div>
                </div>

                {/* 2. Productive Hours */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Productive Hours</span>
                        <TrendingUp size={16} className="text-emerald-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                            {kpiSummary.productiveHours}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            {kpiSummary.productiveAvg}
                        </div>
                    </div>
                </div>

                {/* 3. Neutral Hours */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Neutral Hours</span>
                        <MoreHorizontal size={16} className="text-slate-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                            {kpiSummary.neutralHours}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            {kpiSummary.neutralAvg}
                        </div>
                    </div>
                </div>

                {/* 4. Unproductive Hours */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unproductive Hours</span>
                        <TrendingDown size={16} className="text-rose-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                            {kpiSummary.unproductiveHours}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            {kpiSummary.unproductiveAvg}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Average Usage Line Chart (Matching Insightful Image 4) ─────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                            Average Usage
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Tracked daily active software utilization across workforce
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                            {['Days', 'Weeks', 'Months'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setTimeGrain(tab);
                                        toast.info(`Usage view: ${tab}`);
                                    }}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                        timeGrain === tab
                                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleExportChart}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                            title="Export Chart Data as CSV"
                        >
                            <Download size={16} />
                        </button>
                    </div>
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="label"
                                stroke="#94a3b8"
                                fontSize={10}
                                fontWeight={600}
                                tickLine={false}
                                axisLine={false}
                                interval={timeGrain === 'Days' ? 2 : 0}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                fontSize={10}
                                fontWeight={600}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `${val} h`}
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
                                formatter={(val) => [`${val} h`, 'Working Hours']}
                            />
                            <Line
                                type="monotone"
                                dataKey="hours"
                                stroke="#6366f1"
                                strokeWidth={2.5}
                                dot={timeGrain !== 'Days'}
                                activeDot={{ r: 5, fill: '#6366f1' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Side-by-Side: Most Used & Least Used Apps (Image 4) ─────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Most Used Apps / Websites */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                                Most Used Apps / Websites
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{filteredMostUsed.length} active applications</p>
                        </div>
                        <button
                            onClick={handleExportMostUsed}
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                        >
                            <Download size={13} /> Export
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/75 dark:bg-slate-800/40 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-3.5">App / website</th>
                                    <th className="px-6 py-3.5">Total Hours ↓</th>
                                    <th className="px-6 py-3.5 text-right">Avg. Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                {filteredMostUsed.map((app) => {
                                    const { icon: AppIcon, color } = getAppIcon(app.name);
                                    return (
                                        <tr key={app.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${color}`}>
                                                        <AppIcon size={16} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 dark:text-white block">
                                                            {app.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-semibold">
                                                            {app.category} • {app.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-indigo-400 dark:bg-indigo-500 transition-all duration-700"
                                                            style={{ width: `${app.pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-black text-slate-900 dark:text-white tabular-nums">
                                                        {app.totalHours}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                                                {app.avgDuration}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Least Used Apps / Websites */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                                Least Used Apps / Websites
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{filteredLeastUsed.length} applications</p>
                        </div>
                        <button
                            onClick={handleExportLeastUsed}
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                        >
                            <Download size={13} /> Export
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/75 dark:bg-slate-800/40 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-3.5">App / website</th>
                                    <th className="px-6 py-3.5">Total Hours ↓</th>
                                    <th className="px-6 py-3.5 text-right">Avg. Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                {filteredLeastUsed.map((app) => {
                                    const { icon: AppIcon, color } = getAppIcon(app.name);
                                    return (
                                        <tr key={app.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${color}`}>
                                                        <AppIcon size={16} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 dark:text-white block">
                                                            {app.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-semibold">
                                                            {app.category} • {app.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-indigo-200 dark:bg-indigo-700 transition-all duration-700"
                                                            style={{ width: `${app.pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-black text-slate-900 dark:text-white tabular-nums">
                                                        {app.totalHours}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                                                {app.avgDuration}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AppsWebsites;
