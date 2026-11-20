import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Calendar,
    Monitor,
    Download,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    FileSpreadsheet,
    FileText,
    Layers,
    Globe,
    Activity,
    Check,
    ChevronDown,
    Building2,
    Laptop
} from 'lucide-react';
import { useReportsStore } from '../../store/reportsStore';
import { useFilterStore } from '../../store/filterStore';
import { FilterDropdown } from '../../components/FilterDropdown';
import { ReportsCalendar } from '../../components/ReportsCalendar';
import { executeExport } from '../../utils/exportEngine';
import { toast } from '../../utils/toastManager';

const TAB_HELP = {
    category:
        'Time split by application and website category with location distribution and productivity level breakdown.',
    tags:
        'Time split by your custom labels (Focus, Collaborative, Distraction, etc.) assigned in Settings → Productivity.',
};

// CSS Striped patterns matching Image 1
const STRIPED_PURPLE = 'repeating-linear-gradient(45deg, #a5b4fc, #a5b4fc 4px, #c7d2fe 4px, #c7d2fe 8px)';
const STRIPED_BLUE = 'repeating-linear-gradient(45deg, #38bdf8, #38bdf8 3px, #bae6fd 3px, #bae6fd 6px)';
const STRIPED_YELLOW = 'repeating-linear-gradient(45deg, #facc15, #facc15 3px, #fef08a 3px, #fef08a 6px)';
const STRIPED_GREEN = 'repeating-linear-gradient(45deg, #34d399, #34d399 3px, #a7f3d0 3px, #a7f3d0 6px)';
const STRIPED_RED = 'repeating-linear-gradient(45deg, #fb7185, #fb7185 3px, #fecdd3 3px, #fecdd3 6px)';
const STRIPED_GREY = 'repeating-linear-gradient(45deg, #94a3b8, #94a3b8 3px, #cbd5e1 3px, #cbd5e1 6px)';

const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export function WorkType() {
    const { reportData, fetchReportData, loading } = useReportsStore();
    const { selectedEmployee, selectedTeam } = useFilterStore();

    const [activeTab, setActiveTab] = useState('category');
    const [activePeriod, setActivePeriod] = useState('Today');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedPreset, setSelectedPreset] = useState('Today');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [sortField, setSortField] = useState('totalHours');
    const [sortOrder, setSortOrder] = useState('desc');

    // Popover hover states
    const [hoveredLocationCat, setHoveredLocationCat] = useState(null);
    const [hoveredProductivityCat, setHoveredProductivityCat] = useState(null);

    const calendarRef = useRef(null);
    const exportRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                if (!event.target.closest('.calendar-toggle')) setIsCalendarOpen(false);
            }
            if (exportRef.current && !exportRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDatesFromPreset = (preset) => {
        const end = new Date();
        const start = new Date();
        switch (preset) {
            case 'Today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'Yesterday':
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case 'This Week':
                start.setDate(start.getDate() - start.getDay());
                start.setHours(0, 0, 0, 0);
                break;
            case 'Last 7 Days':
                start.setDate(start.getDate() - 7);
                start.setHours(0, 0, 0, 0);
                break;
            case 'Last 30 Days':
                start.setDate(start.getDate() - 30);
                start.setHours(0, 0, 0, 0);
                break;
            case 'This Month':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'Custom':
                start.setTime(selectedDate.getTime());
                start.setHours(0, 0, 0, 0);
                end.setTime(selectedDate.getTime());
                end.setHours(23, 59, 59, 999);
                break;
            default:
                start.setDate(start.getDate() - 7);
                start.setHours(0, 0, 0, 0);
        }
        return { start, end };
    };

    useEffect(() => {
        const loadData = () => {
            const { start, end } = getDatesFromPreset(activePeriod);
            const params = {
                startDate: toYMD(start),
                endDate: toYMD(end),
                userId: selectedEmployee,
                teamId: selectedTeam,
            };
            fetchReportData('work-type', params);
            fetchReportData('work-type-tags', params);
        };

        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [activePeriod, fetchReportData, selectedEmployee, selectedTeam]);

    const workTypeRaw = reportData['work-type'] || [];
    const tagsRaw = reportData['work-type-tags'] || [];

    // Extract categories array and summary
    const categoriesList = useMemo(() => {
        let list = [];
        if (Array.isArray(workTypeRaw)) {
            list = [...workTypeRaw];
        } else if (workTypeRaw.categories && Array.isArray(workTypeRaw.categories)) {
            list = [...workTypeRaw.categories];
        }

        // Apply Sorting
        list.sort((a, b) => {
            if (sortField === 'category') {
                return sortOrder === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }
            // default totalHours sort
            const aSec = a.current?.totalSeconds || 0;
            const bSec = b.current?.totalSeconds || 0;
            return sortOrder === 'asc' ? aSec - bSec : bSec - aSec;
        });

        return list;
    }, [workTypeRaw, sortField, sortOrder]);

    const summaryData = useMemo(() => {
        if (workTypeRaw.summary) return workTypeRaw.summary;
        const totalSec = categoriesList.reduce((acc, c) => acc + (c.current?.totalSeconds || 0), 0);
        return {
            totalHours: Math.round((totalSec / 3600) * 10) / 10,
            formattedTotal: `${Math.floor(totalSec / 3600)}:${String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')} h`,
            productivityScore: 75,
            trackedAppsCount: categoriesList.length
        };
    }, [workTypeRaw, categoriesList]);

    const dateRanges = useMemo(() => {
        if (workTypeRaw.dateRanges) return workTypeRaw.dateRanges;
        return {
            current: { formatted: activePeriod },
            comparison: { formatted: 'Prior Period' }
        };
    }, [workTypeRaw, activePeriod]);

    // Tags Data
    const tagsData = useMemo(
        () =>
            tagsRaw.map((item, idx) => ({
                name: item.tagName,
                hours: Math.round((item.duration / 3600) * 10) / 10,
                color: 'transition-all duration-700',
                barStyle: {
                    width: '0%',
                    backgroundColor: item.tagColor || '#94a3b8',
                },
                tagColor: item.tagColor,
                key: item.tagName || idx,
            })),
        [tagsRaw]
    );

    const totalHours = activeTab === 'category' ? summaryData.totalHours : tagsData.reduce((acc, curr) => acc + curr.hours, 0);

    const handleApplyCalendar = () => {
        setActivePeriod(selectedPreset);
        setIsCalendarOpen(false);
    };

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const handleExport = (format = 'csv') => {
        try {
            if (activeTab === 'category') {
                const exportRows = categoriesList.map(c => ({
                    Category: c.name,
                    'Current Total Hours': c.current?.formattedTotal || '00:00 h',
                    'Comparison Total Hours': c.comparison?.formattedTotal || '00:00 h',
                    'Office Hours (Current)': c.current?.locations?.formattedOffice || '00:00 h',
                    'Remote Hours (Current)': c.current?.locations?.formattedRemote || '00:00 h',
                    'Productive Hours (Current)': c.current?.productivity?.formattedProductive || '00:00 h',
                    'Unproductive Hours (Current)': c.current?.productivity?.formattedUnproductive || '00:00 h',
                    'Neutral Hours (Current)': c.current?.productivity?.formattedNeutral || '00:00 h',
                    'Office %': `${c.current?.locations?.officePct || 0}%`,
                    'Remote %': `${c.current?.locations?.remotePct || 0}%`,
                    'Productive %': `${c.current?.productivity?.productivePct || 0}%`
                }));

                const columns = [
                    { header: 'Category', key: 'Category' },
                    { header: 'Current Total Hours', key: 'Current Total Hours' },
                    { header: 'Comparison Total Hours', key: 'Comparison Total Hours' },
                    { header: 'Office Hours (Current)', key: 'Office Hours (Current)' },
                    { header: 'Remote Hours (Current)', key: 'Remote Hours (Current)' },
                    { header: 'Productive Hours (Current)', key: 'Productive Hours (Current)' },
                    { header: 'Unproductive Hours (Current)', key: 'Unproductive Hours (Current)' },
                    { header: 'Neutral Hours (Current)', key: 'Neutral Hours (Current)' },
                    { header: 'Office %', key: 'Office %' },
                    { header: 'Remote %', key: 'Remote %' },
                    { header: 'Productive %', key: 'Productive %' }
                ];

                executeExport({
                    data: exportRows,
                    columns,
                    fileName: `category-usage-overview-${toYMD(new Date())}`,
                    format,
                    metadata: {
                        title: 'Category Usage Overview Report',
                        dateRange: `${dateRanges.current?.formatted || activePeriod} vs ${dateRanges.comparison?.formatted || 'Prior Period'}`,
                        filters: selectedEmployee ? `Filtered Employee` : 'All Staff'
                    }
                });
                toast.success(`Category Usage exported successfully as ${format.toUpperCase()}`);
            } else {
                executeExport({
                    data: tagsData,
                    columns: [
                        { header: 'Tag Name', key: 'name' },
                        { header: 'Hours Tracked', key: 'hours', formatter: v => `${v}h` }
                    ],
                    fileName: `tags-work-type-${toYMD(new Date())}`,
                    format,
                    metadata: {
                        title: 'Work Type by Tags Report',
                        dateRange: activePeriod
                    }
                });
                toast.success(`Tags Report exported successfully as ${format.toUpperCase()}`);
            }
        } catch (err) {
            console.error('Export error', err);
            toast.error('Failed to export report');
        } finally {
            setShowExportMenu(false);
        }
    };

    return (
        <div className="space-y-6 w-full">
            {/* Top Header & Navigation Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-normal text-[#29291F] dark:text-[#F5F1E9] tracking-tight">Reports</h1>
                    <div className="mt-3 flex items-center border-b border-[#E5DED2] dark:border-[#384232]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('category')}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
                                activeTab === 'category'
                                    ? 'text-[#B9955B]'
                                    : 'text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9]'
                            }`}
                        >
                            Category
                            {activeTab === 'category' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#B9955B] rounded-full" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('tags')}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
                                activeTab === 'tags'
                                    ? 'text-[#B9955B]'
                                    : 'text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9]'
                            }`}
                        >
                            Tags
                            {activeTab === 'tags' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#B9955B] rounded-full" />
                            )}
                        </button>
                    </div>
                    <p className="mt-2 text-xs font-medium text-[#777367] dark:text-[#B8B3A7] max-w-xl">
                        {TAB_HELP[activeTab]}
                    </p>
                </div>

                {/* Top Controls: Preset Calendar + Filters + Universal Export */}
                <div className="relative z-30 flex flex-wrap items-center gap-2.5">
                    {/* Calendar Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className={`calendar-toggle rounded-xl px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2 shadow-warm-xs border cursor-pointer ${
                                isCalendarOpen
                                    ? 'bg-[#B9955B] text-white border-[#B9955B]'
                                    : 'bg-[#EEE8DD] dark:bg-[#252B20] text-[#29291F] dark:text-[#F5F1E9] border-[#D6CDBC] dark:border-[#384232] hover:bg-[#E5DDCF]'
                            }`}
                        >
                            <Calendar size={13} className={isCalendarOpen ? 'text-white' : 'text-[#B9955B]'} />
                            <span>{selectedPreset}</span>
                        </button>
                        {isCalendarOpen && (
                            <div ref={calendarRef} className="absolute right-0 mt-2 z-50">
                                <ReportsCalendar
                                    selectedPreset={selectedPreset}
                                    setSelectedPreset={setSelectedPreset}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    onApply={handleApplyCalendar}
                                    onCancel={() => setIsCalendarOpen(false)}
                                />
                            </div>
                        )}
                    </div>

                    <FilterDropdown />

                    {/* Export Menu */}
                    <div className="relative" ref={exportRef}>
                        <button
                            type="button"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#30382B] text-white hover:bg-[#3C4536] transition-all shadow-warm-xs active:scale-95 cursor-pointer uppercase tracking-wider"
                        >
                            <Download size={13} className="text-[#D3B98D]" />
                            <span>Export</span>
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-52 bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl shadow-2xl border border-[#D6CDBC] dark:border-[#384232] p-2 z-50 animate-in fade-in duration-150">
                                <p className="px-3 py-1.5 text-[9px] font-bold text-[#777367] uppercase tracking-wider border-b border-[#D6CDBC]/60 dark:border-[#384232] mb-1">
                                    Export Format
                                </p>
                                <button
                                    onClick={() => handleExport('csv')}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#29291F] dark:text-[#E2E8DE] hover:bg-[#EEE8DD] dark:hover:bg-[#2E362A] rounded-xl transition-colors cursor-pointer"
                                >
                                    <FileSpreadsheet size={15} className="text-[#5E7D64]" />
                                    <span>Export as CSV (.csv)</span>
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#29291F] dark:text-[#E2E8DE] hover:bg-[#EEE8DD] dark:hover:bg-[#2E362A] rounded-xl transition-colors cursor-pointer"
                                >
                                    <FileText size={15} className="text-[#A84B4B]" />
                                    <span>Export as PDF (.pdf)</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TAB 1: CATEGORY USAGE OVERVIEW (Image 1 Exact Layout & Design) */}
            {activeTab === 'category' && (
                <div className="space-y-6">
                    {/* Top Summary Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                        <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] p-4 sm:p-5 shadow-warm-xs flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-[#30382B] text-[#D3B98D] flex items-center justify-center shrink-0">
                                <Layers size={18} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">Total Tracked Hours</span>
                                <div className="font-mono text-xl sm:text-2xl font-bold text-[#29291F] dark:text-[#F5F1E9] mt-0.5">
                                    {summaryData.formattedTotal || `${totalHours}h`}
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] p-4 sm:p-5 shadow-warm-xs flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-[#5E7D64]/15 text-[#5E7D64] dark:text-[#8BB394] flex items-center justify-center shrink-0">
                                <Activity size={18} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">Productivity Index</span>
                                <div className="font-sans text-xl sm:text-2xl font-bold text-[#5E7D64] dark:text-[#8BB394] mt-0.5">
                                    {summaryData.productivityScore} / 100
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] p-4 sm:p-5 shadow-warm-xs flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-[#B9955B]/15 text-[#B9955B] flex items-center justify-center shrink-0">
                                <Globe size={18} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">Tracked Applications</span>
                                <div className="font-sans text-xl sm:text-2xl font-bold text-[#29291F] dark:text-[#F5F1E9] mt-0.5">
                                    {summaryData.trackedAppsCount} Apps & Tools
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Category Usage Overview Card */}
                    <div className="bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs overflow-hidden">
                        {/* Card Header matching Image 1 */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DED2] dark:border-[#384232] bg-[#F5F1E9]/40 dark:bg-[#1E2419]/60">
                            <h2 className="font-serif text-lg font-semibold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">
                                Category Usage Overview
                            </h2>
                            <button
                                onClick={() => handleExport('csv')}
                                className="text-xs font-semibold text-[#B9955B] hover:text-[#A17D45] transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <Download size={13} />
                                <span>Export</span>
                            </button>
                        </div>

                        {/* Interactive Table matching Image 1 */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[780px]">
                                <thead>
                                    <tr className="border-b border-[#E5DED2] dark:border-[#384232] text-[11px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">
                                        <th
                                            onClick={() => toggleSort('category')}
                                            className="px-6 py-3.5 cursor-pointer hover:text-[#29291F] dark:hover:text-[#F5F1E9] transition-colors w-1/4"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                Category
                                                {sortField === 'category' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                            </span>
                                        </th>
                                        <th
                                            onClick={() => toggleSort('totalHours')}
                                            className="px-6 py-3.5 cursor-pointer hover:text-[#29291F] dark:hover:text-[#F5F1E9] transition-colors w-1/4"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                Total Hours
                                                {sortField === 'totalHours' ? (sortOrder === 'asc' ? <ArrowUp size={12} className="text-[#B9955B]" /> : <ArrowDown size={12} className="text-[#B9955B]" />) : <ArrowUpDown size={12} />}
                                            </span>
                                        </th>
                                        <th className="px-6 py-3.5 w-1/4">Locations</th>
                                        <th className="px-6 py-3.5 w-1/4">Productivity Level</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5DED2]/70 dark:divide-[#384232]/70 text-xs font-medium">
                                    {categoriesList.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-16 text-center text-[#777367] dark:text-[#B8B3A7]">
                                                No category usage records found for the selected period.
                                            </td>
                                        </tr>
                                    ) : (
                                        categoriesList.map((cat, catIdx) => {
                                            const isHoveredLocation = hoveredLocationCat === cat.name;
                                            const isHoveredProd = hoveredProductivityCat === cat.name;
                                            const isBottomRows = catIdx >= Math.max(2, categoriesList.length - 4);

                                            const cur = cat.current || {};
                                            const comp = cat.comparison || {};

                                            const curLoc = cur.locations || {};
                                            const compLoc = comp.locations || {};

                                            const curProd = cur.productivity || {};
                                            const compProd = comp.productivity || {};

                                            return (
                                                <tr
                                                    key={cat.name}
                                                    className="hover:bg-[#EEE8DD]/40 dark:hover:bg-[#1E2419]/50 transition-colors"
                                                >
                                                    {/* Column 1: Category Name */}
                                                    <td className="px-6 py-4 align-top">
                                                        <span className="font-semibold text-xs sm:text-sm text-[#29291F] dark:text-[#F5F1E9] block leading-tight pt-0.5">
                                                            {cat.name}
                                                        </span>
                                                    </td>

                                                    {/* Column 2: Total Hours (Solid Purple + Striped Purple Bars) */}
                                                    <td className="px-6 py-3.5 align-top">
                                                        <div className="space-y-2">
                                                            {/* Current Period Row */}
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-mono text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] tabular-nums w-16 shrink-0">
                                                                    {cur.formattedTotal || '00:00 h'}
                                                                </span>
                                                                <div className="flex-1 max-w-[140px] h-2.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-[#A5B4FC] dark:bg-[#818CF8] rounded-sm transition-all duration-300"
                                                                        style={{ width: `${cur.barWidthPct || (cur.totalSeconds > 0 ? 10 : 0)}%` }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Comparison Period Row (Striped Purple) */}
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-mono text-xs font-medium text-[#777367] dark:text-[#B8B3A7] tabular-nums w-16 shrink-0">
                                                                    {comp.formattedTotal || '00:00 h'}
                                                                </span>
                                                                <div className="flex-1 max-w-[140px] h-2.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-sm transition-all duration-300"
                                                                        style={{
                                                                            width: `${comp.barWidthPct || (comp.totalSeconds > 0 ? 10 : 0)}%`,
                                                                            backgroundImage: STRIPED_PURPLE
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Column 3: Locations (Solid Blue/Yellow + Striped Blue/Yellow) */}
                                                    <td
                                                        className="px-6 py-3.5 align-top relative"
                                                        onMouseEnter={() => setHoveredLocationCat(cat.name)}
                                                        onMouseLeave={() => setHoveredLocationCat(null)}
                                                    >
                                                        <div className="space-y-2 cursor-pointer">
                                                            {/* Current Period Row */}
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-semibold text-[#777367] dark:text-[#B8B3A7] w-24 shrink-0 truncate">
                                                                    {curLoc.dominantLabel || '100% Remote'}
                                                                </span>
                                                                <div className="flex-1 max-w-[120px] h-2.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden flex">
                                                                    <div
                                                                        className="h-full bg-[#38BDF8] transition-all duration-300"
                                                                        style={{ width: `${curLoc.officePct || 0}%` }}
                                                                        title={`Office: ${curLoc.officePct}%`}
                                                                    />
                                                                    <div
                                                                        className="h-full bg-[#FACC15] transition-all duration-300"
                                                                        style={{ width: `${curLoc.remotePct || 0}%` }}
                                                                        title={`Remote: ${curLoc.remotePct}%`}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Comparison Period Row (Striped Blue / Yellow) */}
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-medium text-[#9E988A] dark:text-[#888173] w-24 shrink-0 truncate">
                                                                    {compLoc.dominantLabel || '100% Remote'}
                                                                </span>
                                                                <div className="flex-1 max-w-[120px] h-2.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden flex">
                                                                    <div
                                                                        className="h-full transition-all duration-300"
                                                                        style={{
                                                                            width: `${compLoc.officePct || 0}%`,
                                                                            backgroundImage: STRIPED_BLUE
                                                                        }}
                                                                        title={`Office: ${compLoc.officePct}%`}
                                                                    />
                                                                    <div
                                                                        className="h-full transition-all duration-300"
                                                                        style={{
                                                                            width: `${compLoc.remotePct || 0}%`,
                                                                            backgroundImage: STRIPED_YELLOW
                                                                        }}
                                                                        title={`Remote: ${compLoc.remotePct}%`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Locations Interactive Popover (Matching Image 1) */}
                                                        {isHoveredLocation && (
                                                            <div className={`absolute right-4 ${isBottomRows ? 'bottom-8' : 'top-12'} w-72 bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl shadow-2xl border border-[#D6CDBC] dark:border-[#384232] p-4 z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-none`}>
                                                                <h4 className="font-serif text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] mb-2">
                                                                    {cat.name}
                                                                </h4>

                                                                {/* Solid bar */}
                                                                <div className="h-2 w-full rounded-sm overflow-hidden flex mb-2.5">
                                                                    <div className="h-full bg-[#38BDF8]" style={{ width: `${curLoc.officePct}%` }} />
                                                                    <div className="h-full bg-[#FACC15]" style={{ width: `${curLoc.remotePct}%` }} />
                                                                </div>

                                                                <div className="text-[10px] font-bold text-[#777367] uppercase tracking-wider mb-2">
                                                                    {dateRanges.current?.formatted || 'Current Period'}
                                                                </div>

                                                                <div className="space-y-1.5 text-xs font-medium pb-3 border-b border-[#E5DED2] dark:border-[#384232]">
                                                                    <div className="flex items-center justify-between text-[#29291F] dark:text-[#F5F1E9]">
                                                                        <span className="flex items-center gap-2">
                                                                            <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
                                                                            <span>Office</span>
                                                                        </span>
                                                                        <span className="font-mono font-bold">
                                                                            {curLoc.formattedOffice || '00:00 h'} <span className="font-normal text-[#777367]">{curLoc.officePct}%</span>
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between text-[#29291F] dark:text-[#F5F1E9]">
                                                                        <span className="flex items-center gap-2">
                                                                            <span className="h-2 w-2 rounded-full bg-[#FACC15]" />
                                                                            <span>Remote</span>
                                                                        </span>
                                                                        <span className="font-mono font-bold">
                                                                            {curLoc.formattedRemote || '00:00 h'} <span className="font-normal text-[#777367]">{curLoc.remotePct}%</span>
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Striped Comparison Section */}
                                                                <div className="pt-3">
                                                                    <div className="h-2 w-full rounded-sm overflow-hidden flex mb-2">
                                                                        <div className="h-full" style={{ width: `${compLoc.officePct}%`, backgroundImage: STRIPED_BLUE }} />
                                                                        <div className="h-full" style={{ width: `${compLoc.remotePct}%`, backgroundImage: STRIPED_YELLOW }} />
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-[#777367] uppercase tracking-wider mb-2">
                                                                        {dateRanges.comparison?.formatted || 'Prior Period'}
                                                                    </div>
                                                                    <div className="space-y-1.5 text-xs font-medium">
                                                                        <div className="flex items-center justify-between text-[#29291F] dark:text-[#F5F1E9]">
                                                                            <span className="flex items-center gap-2">
                                                                                <span className="h-2 w-2 rounded-full" style={{ backgroundImage: STRIPED_BLUE }} />
                                                                                <span>Office</span>
                                                                            </span>
                                                                            <span className="font-mono font-bold">
                                                                                {compLoc.formattedOffice || '00:00 h'} <span className="font-normal text-[#777367]">{compLoc.officePct}%</span>
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between text-[#29291F] dark:text-[#F5F1E9]">
                                                                            <span className="flex items-center gap-2">
                                                                                <span className="h-2 w-2 rounded-full" style={{ backgroundImage: STRIPED_YELLOW }} />
                                                                                <span>Remote</span>
                                                                            </span>
                                                                            <span className="font-mono font-bold">
                                                                                {compLoc.formattedRemote || '00:00 h'} <span className="font-normal text-[#777367]">{compLoc.remotePct}%</span>
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Column 4: Productivity Level (Solid Green/Pink/Grey + Striped) */}
                                                    <td
                                                        className="px-6 py-3.5 align-top relative"
                                                        onMouseEnter={() => setHoveredProductivityCat(cat.name)}
                                                        onMouseLeave={() => setHoveredProductivityCat(null)}
                                                    >
                                                        <div className="space-y-2 cursor-pointer">
                                                            {/* Current Period Row */}
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] w-32 shrink-0 truncate">
                                                                    {curProd.dominantLabel || '00:00 h Productive'}
                                                                </span>
                                                                <div className="flex-1 max-w-[120px] h-2.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden flex">
                                                                    <div
                                                                        className="h-full bg-[#34D399] transition-all duration-300"
                                                                        style={{ width: `${curProd.productivePct || 0}%` }}
                                                                        title={`Productive: ${curProd.productivePct}%`}
                                                                    />
                                                                    <div
                                                                        className="h-full bg-[#FB7185] transition-all duration-300"
                                                                        style={{ width: `${curProd.unproductivePct || 0}%` }}
                                                                        title={`Unproductive: ${curProd.unproductivePct}%`}
                                                                    />
                                                                    <div
                                                                        className="h-full bg-[#94A3B8] transition-all duration-300"
                                                                        style={{ width: `${curProd.neutralPct || 0}%` }}
                                                                        title={`Neutral: ${curProd.neutralPct}%`}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Comparison Period Row (Striped) */}
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-medium text-[#777367] dark:text-[#B8B3A7] w-32 shrink-0 truncate">
                                                                    {compProd.dominantLabel || '00:00 h Productive'}
                                                                </span>
                                                                <div className="flex-1 max-w-[120px] h-2.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden flex">
                                                                    <div
                                                                        className="h-full transition-all duration-300"
                                                                        style={{
                                                                            width: `${compProd.productivePct || 0}%`,
                                                                            backgroundImage: STRIPED_GREEN
                                                                        }}
                                                                        title={`Productive: ${compProd.productivePct}%`}
                                                                    />
                                                                    <div
                                                                        className="h-full transition-all duration-300"
                                                                        style={{
                                                                            width: `${compProd.unproductivePct || 0}%`,
                                                                            backgroundImage: STRIPED_RED
                                                                        }}
                                                                        title={`Unproductive: ${compProd.unproductivePct}%`}
                                                                    />
                                                                    <div
                                                                        className="h-full transition-all duration-300"
                                                                        style={{
                                                                            width: `${compProd.neutralPct || 0}%`,
                                                                            backgroundImage: STRIPED_GREY
                                                                        }}
                                                                        title={`Neutral: ${compProd.neutralPct}%`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Productivity Interactive Popover (Matching Image 1) */}
                                                        {isHoveredProd && (
                                                            <div className={`absolute right-6 ${isBottomRows ? 'bottom-8' : 'top-12'} w-72 bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl shadow-2xl border border-[#D6CDBC] dark:border-[#384232] p-4 z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-none`}>
                                                                <h4 className="font-serif text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] mb-2">
                                                                    {cat.name}
                                                                </h4>

                                                                {/* Solid Segmented Bar */}
                                                                <div className="h-2 w-full rounded-sm overflow-hidden flex mb-2.5">
                                                                    <div className="h-full bg-[#34D399]" style={{ width: `${curProd.productivePct}%` }} />
                                                                    <div className="h-full bg-[#FB7185]" style={{ width: `${curProd.unproductivePct}%` }} />
                                                                    <div className="h-full bg-[#94A3B8]" style={{ width: `${curProd.neutralPct}%` }} />
                                                                </div>

                                                                <div className="text-[10px] font-bold text-[#777367] uppercase tracking-wider mb-2">
                                                                    {dateRanges.current?.formatted || 'Current Period'}
                                                                </div>

                                                                <div className="space-y-1.5 text-xs font-medium pb-3 border-b border-[#E5DED2] dark:border-[#384232]">
                                                                    <div className="flex items-center justify-between text-[#29291F] dark:text-[#F5F1E9]">
                                                                        <span className="flex items-center gap-2">
                                                                            <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                                                                            <span>Productive Hours</span>
                                                                        </span>
                                                                        <span className="font-mono font-bold">
                                                                            {curProd.formattedProductive || '00:00 h'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between text-[#29291F] dark:text-[#F5F1E9]">
                                                                        <span className="flex items-center gap-2">
                                                                            <span className="h-2 w-2 rounded-full bg-[#FB7185]" />
                                                                            <span>Unproductive Hours</span>
                                                                        </span>
                                                                        <span className="font-mono font-bold">
                                                                            {curProd.formattedUnproductive || '00:00 h'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between text-[#29291F] dark:text-[#F5F1E9]">
                                                                        <span className="flex items-center gap-2">
                                                                            <span className="h-2 w-2 rounded-full bg-[#94A3B8]" />
                                                                            <span>Neutral Hours</span>
                                                                        </span>
                                                                        <span className="font-mono font-bold">
                                                                            {curProd.formattedNeutral || '00:00 h'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Striped Comparison Section */}
                                                                <div className="pt-3">
                                                                    <div className="h-2 w-full rounded-sm overflow-hidden flex mb-2">
                                                                        <div className="h-full" style={{ width: `${compProd.productivePct}%`, backgroundImage: STRIPED_GREEN }} />
                                                                        <div className="h-full" style={{ width: `${compProd.unproductivePct}%`, backgroundImage: STRIPED_RED }} />
                                                                        <div className="h-full" style={{ width: `${compProd.neutralPct}%`, backgroundImage: STRIPED_GREY }} />
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-[#777367] uppercase tracking-wider mb-2">
                                                                        {dateRanges.comparison?.formatted || 'Prior Period'}
                                                                    </div>
                                                                    <div className="space-y-1.5 text-xs font-medium">
                                                                        <div className="flex items-center justify-between text-[#29291F] dark:text-[#F5F1E9]">
                                                                            <span className="flex items-center gap-2">
                                                                                <span className="h-2 w-2 rounded-full" style={{ backgroundImage: STRIPED_GREEN }} />
                                                                                <span>Productive Hours</span>
                                                                            </span>
                                                                            <span className="font-mono font-bold">
                                                                                {compProd.formattedProductive || '00:00 h'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between text-[#29291F] dark:text-[#F5F1E9]">
                                                                            <span className="flex items-center gap-2">
                                                                                <span className="h-2 w-2 rounded-full" style={{ backgroundImage: STRIPED_RED }} />
                                                                                <span>Unproductive Hours</span>
                                                                            </span>
                                                                            <span className="font-mono font-bold">
                                                                                {compProd.formattedUnproductive || '00:00 h'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between text-[#29291F] dark:text-[#F5F1E9]">
                                                                            <span className="flex items-center gap-2">
                                                                                <span className="h-2 w-2 rounded-full" style={{ backgroundImage: STRIPED_GREY }} />
                                                                                <span>Neutral Hours</span>
                                                                            </span>
                                                                            <span className="font-mono font-bold">
                                                                                {compProd.formattedNeutral || '00:00 h'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
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
            )}

            {/* TAB 2: TAGS VIEW (Retained and Cleanly Styled) */}
            {activeTab === 'tags' && (
                <div className="grid gap-6">
                    {tagsData.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="rounded-2xl border border-[#D6CDBC] dark:border-[#384232] bg-[#FBF9F5] dark:bg-[#252B20] p-6 shadow-warm-xs">
                                <h3 className="mb-6 font-serif text-lg font-semibold text-[#29291F] dark:text-[#F5F1E9]">
                                    Distribution by Tags
                                </h3>
                                <div className="space-y-6">
                                    {tagsData.map((item) => {
                                        const pct = totalHours > 0 ? Math.round((item.hours / totalHours) * 100) : 0;
                                        const barWidth = totalHours > 0 ? `${pct}%` : '0%';
                                        return (
                                            <div key={item.key || item.name} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-semibold text-[#29291F] dark:text-[#F5F1E9] flex items-center gap-2">
                                                        {item.tagColor && (
                                                            <span
                                                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                                                style={{ backgroundColor: item.tagColor }}
                                                            />
                                                        )}
                                                        {item.name}
                                                    </span>
                                                    <span className="font-bold font-mono text-[#29291F] dark:text-[#F5F1E9]">
                                                        {item.hours}h ({pct}%)
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{ width: barWidth, backgroundColor: item.tagColor || '#B9955B' }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[#D6CDBC] dark:border-[#384232] bg-[#30382B] p-6 shadow-warm-md text-white">
                                <h3 className="mb-2 font-serif text-lg font-semibold text-[#D3B98D]">Total Tagged Time ({activePeriod})</h3>
                                <p className="text-4xl font-black font-mono mt-2">{totalHours} Hours</p>
                                <p className="mt-4 text-xs text-[#D2DACB]">
                                    Based on customized labels from Productivity Settings.
                                </p>
                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#D3B98D]">Focus Score</p>
                                        <p className="text-xl font-bold mt-0.5">{summaryData.productivityScore || 75} / 100</p>
                                    </div>
                                    <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#D3B98D]">Tracked Tags</p>
                                        <p className="text-xl font-bold mt-0.5">{tagsData.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-20 rounded-3xl border border-dashed border-[#D6CDBC] dark:border-[#384232] bg-[#FBF9F5] dark:bg-[#252B20]">
                            <div className="h-16 w-16 bg-[#EEE8DD] dark:bg-[#30382B] rounded-2xl flex items-center justify-center mb-4 text-[#B9955B]">
                                <Monitor size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-[#29291F] dark:text-[#F5F1E9] mb-1">No tag records found</h3>
                            <p className="text-xs text-[#777367] dark:text-[#B8B3A7] text-center max-w-sm">
                                Assign custom labels in Settings → Productivity to view time distribution by tags.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default WorkType;
