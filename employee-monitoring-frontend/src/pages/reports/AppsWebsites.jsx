import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Globe,
    Monitor,
    Calendar as CalendarIcon,
    Download,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    X,
    Search,
    Globe2,
    Users2,
    Tag,
    FolderOpen,
    CheckSquare
} from 'lucide-react';

import { useReportsStore } from '../../store/reportsStore';
import { useFilterStore } from '../../store/filterStore';
import { FilterDropdown } from '../../components/FilterDropdown';
import { ReportsCalendar } from '../../components/ReportsCalendar';

const presets = [
    "Today", "Yesterday", "This Week", "Last 7 Days",
    "Previous Week", "This Month", "Previous Month",
    "Last 3 Months", "Last 6 Months"
];

const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const filterOptions = [
    { label: "Employees", icon: Users2 },
    { label: "Teams", icon: Users2 },
    { label: "Categories", icon: Tag },
    { label: "Projects", icon: FolderOpen },
    { label: "Tasks", icon: CheckSquare }
];

// ─── Fixed-position Calendar Popover ────────────────────────────────────────
function CalendarPopover({ buttonRef, isOpen, onClose, children }) {
    const [style, setStyle] = useState({});
    const popoverRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const popoverWidth = Math.min(720, window.innerWidth * 0.95);
        let left = rect.left;
        if (left + popoverWidth > window.innerWidth - 12) left = window.innerWidth - popoverWidth - 12;
        left = Math.max(12, left);
        setStyle({ position: 'fixed', top: rect.bottom + 8, left, width: popoverWidth, maxHeight: '85vh', zIndex: 9999 });
    }, [isOpen, buttonRef]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target) && !buttonRef.current?.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose, buttonRef]);

    if (!isOpen) return null;
    return (
        <div ref={popoverRef} style={style} className="overflow-y-auto bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
            {children}
        </div>
    );
}

export function AppsWebsites() {
    const { reportData, fetchReportData, loading } = useReportsStore();
    const { selectedEmployee, selectedTeam } = useFilterStore();
    const rawData = reportData['apps-websites'] || [];

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedPreset, setSelectedPreset] = useState("Today");
    const [searchTerm, setSearchTerm] = useState("");

    const calendarBtnRef = useRef(null);
    const closeCalendar = useCallback(() => setIsCalendarOpen(false), []);

    const getDatesFromPreset = (preset) => {
        const end = new Date();
        const start = new Date();
        switch (preset) {
            case 'Today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'Yesterday': 
                start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() - 1); end.setHours(23, 59, 59, 999);
                break;
            case 'This Week': start.setDate(start.getDate() - start.getDay()); break;
            case 'Last 7 Days': start.setDate(start.getDate() - 7); break;
            case 'Last 30 Days': start.setDate(start.getDate() - 30); break;
            case 'This Month': start.setDate(1); break;
            case 'Custom': 
                start.setTime(selectedDate.getTime());
                start.setHours(0, 0, 0, 0);
                end.setTime(selectedDate.getTime());
                end.setHours(23, 59, 59, 999);
                break;
            default: start.setDate(start.getDate() - 7);
        }
        return { start, end };
    };

    useEffect(() => {
        const { start, end } = getDatesFromPreset(selectedPreset);
        fetchReportData('apps-websites', { 
            startDate: toYMD(start), 
            endDate: toYMD(end),
            userId: selectedEmployee,
            teamId: selectedTeam
        });
    }, [selectedPreset, fetchReportData, selectedEmployee, selectedTeam]);

    const activeData = React.useMemo(() => {
        const formatLabel = (label) => {
            if (!label) return "Neutral";
            return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
        };

        return rawData.map(item => ({
            name: item.appName,
            usage: Math.round((item._sum.duration / 3600) * 10) / 10,
            type: formatLabel(item.productivity)
        }));
    }, [rawData]);

    useEffect(() => {
        // No manual filter outside click needed
    }, []);

    const handleApply = () => {
        setIsCalendarOpen(false);
        setSearchTerm("");
    };

    const handleCancel = () => {
        setIsCalendarOpen(false);
    };

    const displayData = activeData.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const maxUsage = Math.max(...displayData.map(d => d.usage), 1);

    return (
        <div className="space-y-6 relative z-30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in relative z-10">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Apps &amp; Websites</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Track application and website usage across your team.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Calendar Button */}
                    <div className="relative">
                        <button
                            ref={calendarBtnRef}
                            onClick={() => setIsCalendarOpen(v => !v)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold shadow-sm ring-1 transition-all ${isCalendarOpen ? 'bg-primary-50 text-primary-600 ring-primary-100 dark:bg-primary-900/20 dark:text-primary-400' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800'}`}
                        >
                            <CalendarIcon size={16} className={isCalendarOpen ? 'text-primary-600' : 'text-slate-400'} />
                            <span>{selectedPreset}</span>
                        </button>

                        {isCalendarOpen && (
                            <div className="absolute right-0 mt-2 z-50">
                                <ReportsCalendar 
                                    selectedPreset={selectedPreset}
                                    setSelectedPreset={setSelectedPreset}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    onApply={handleApply}
                                    onCancel={handleCancel}
                                />
                            </div>
                        )}
                    </div>

                    {/* Add Filter */}
                    <FilterDropdown />

                    {/* Search */}
                    <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 shadow-sm">
                        <Search size={16} className="text-slate-400 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Search apps..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none dark:text-slate-200 w-32"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-800 transition-all">
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {displayData.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                    <div className="border-b border-slate-100 p-6 flex items-center justify-between dark:border-slate-800">
                        <h3 className="text-lg font-bold dark:text-white">
                            Top Applications &amp; Websites
                        </h3>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <Monitor size={12} /> Productive
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-slate-400">
                                <Globe size={12} /> Neutral
                            </span>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {displayData.map((item) => (
                                <div key={item.name} className="relative group p-4 rounded-xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50/10 transition-all dark:border-slate-800 dark:hover:border-primary-900/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 rounded-lg bg-slate-50 text-slate-400 dark:bg-slate-800 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                                            {item.type === 'Productive' ? <Monitor size={20} /> : <Globe size={20} />}
                                        </div>
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">{item.usage}h</span>
                                    </div>
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors">{item.name}</h4>
                                    <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">{item.type}</p>
                                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div className={`h-full rounded-full transition-all duration-700 ${item.type === 'Productive' ? 'bg-emerald-500' : 'bg-primary-500'}`} style={{ width: `${(item.usage / maxUsage) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Monitor size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No data for the selected period</h3>
                    <p className="text-slate-500 text-center max-w-sm">
                        {searchTerm ? `No apps matching "${searchTerm}"` : "Try choosing a different time period in the calendar."}
                    </p>
                </div>
            )}
        </div>
    );
}
