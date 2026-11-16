import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Calendar as CalendarIcon,
    Download,
    Users2,
    BarChart2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    X,
    Globe,
    Monitor,
    Settings as SettingsIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReportsStore } from '../../store/reportsStore';
import { useFilterStore } from '../../store/filterStore';
import { FilterDropdown } from '../../components/FilterDropdown';
import { ReportsCalendar } from '../../components/ReportsCalendar';
import { ExportDropdown } from '../../components/common/ExportDropdown';

const presets = [
    "Today", "Yesterday", "This Week", "Last 7 Days",
    "Previous Week", "This Month", "Previous Month",
    "Last 3 Months", "Last 6 Months"
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

export function WorkloadDistribution() {
    const navigate = useNavigate();
    const { reportsSettings, reportData, fetchReportData, loading } = useReportsStore();
    const { selectedEmployee, selectedTeam } = useFilterStore();
    const { optimalFrom, optimalTo } = reportsSettings.workloadDistribution;

    const rawData = reportData['workload'] || [];

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedPreset, setSelectedPreset] = useState("Today");

    const calendarBtnRef = useRef(null);
    const closeCalendar = useCallback(() => setIsCalendarOpen(false), []);

    const getDatesFromPreset = (preset) => {
        const end = new Date();
        const start = new Date();
        switch (preset) {
            case 'Today': start.setHours(0, 0, 0, 0); break;
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
        fetchReportData('workload', { 
            startDate: start, 
            endDate: end,
            userId: selectedEmployee,
            teamId: selectedTeam
        });
    }, [selectedPreset, fetchReportData, selectedEmployee, selectedTeam]);

    const activeData = React.useMemo(() => {
        return rawData;
    }, [rawData]);

    useEffect(() => {
        // No manual filter outside click needed
    }, []);

    const handleApply = () => {
        setIsCalendarOpen(false);
    };

    const handleCancel = () => {
        setIsCalendarOpen(false);
    };


    return (
        <div className="space-y-6 relative z-30">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workload Distribution</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">View and analyze your workload distribution data.</p>
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

                    <ExportDropdown
                        data={activeData}
                        columns={[
                            { header: 'Department / Team', key: 'team' },
                            { header: 'Utilized Hours', key: 'hours', formatter: (val) => `${val}h` },
                            { header: 'Total Capacity', key: 'capacity', formatter: (val) => `${val}h` },
                            { header: 'Utilization Rate', key: 'utilization', formatter: (_, row) => `${Math.round(((row.hours || 0) / (row.capacity || 1)) * 100)}%` },
                            { header: 'Status', key: 'status', formatter: (_, row) => {
                                const pct = Math.round(((row.hours || 0) / (row.capacity || 1)) * 100);
                                return pct >= optimalFrom && pct <= optimalTo ? 'Optimal' : pct > optimalTo ? 'Overloaded' : 'Underloaded';
                            }},
                            { header: 'Efficiency', key: 'efficiency', formatter: (_, row) => `${Math.min(Math.round(((row.hours || 0) / (row.capacity || 1)) * 100) + 4, 100)}%` }
                        ]}
                        fileName="workload-distribution"
                        metadata={{
                            title: 'Workload Distribution Report',
                            dateRange: selectedPreset,
                            filters: `Optimal Range: ${optimalFrom}% - ${optimalTo}%`
                        }}
                    />
                </div>
            </div>

            {/* Content */}
            {activeData.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {activeData.map((item) => {
                        const pct = Math.round((item.hours / item.capacity) * 100);
                        return (
                            <div key={item.team} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                                            <Users2 size={20} />
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{item.team}</h3>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${pct >= optimalFrom && pct <= optimalTo
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : pct > optimalTo
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                        {pct >= optimalFrom && pct <= optimalTo
                                            ? 'Optimal'
                                            : pct > optimalTo
                                                ? 'Overloaded'
                                                : 'Underloaded'}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Utilized Hours</p>
                                            <p className="text-3xl font-black text-slate-900 dark:text-white">{item.hours}<span className="text-lg font-bold text-slate-400">/ {item.capacity}</span></p>
                                        </div>
                                        <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{pct}% Used</p>
                                    </div>
                                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${pct >= optimalFrom && pct <= optimalTo
                                                    ? 'bg-emerald-500'
                                                    : pct > optimalTo
                                                        ? 'bg-red-500'
                                                        : 'bg-amber-500'
                                                }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 pt-2">
                                        <div className="flex items-center gap-1.5">
                                            <BarChart2 size={14} className="text-slate-400" />
                                            <span className="text-xs font-medium text-slate-500">Efficiency: {Math.min(pct + 4, 100)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Monitor size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No data for the selected period</h3>
                    <p className="text-slate-500 text-center max-w-sm">Try choosing a different time period in the calendar.</p>
                </div>
            )}
        </div>
    );
}
