import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Calendar as CalendarIcon,
    Download,
    ChevronDown,
    User,
    CheckCircle2,
    MinusCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    X,
    Users2,
    Globe
} from 'lucide-react';
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

const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// ─── Fixed-position Calendar Popover ────────────────────────────────────────
// Removed in favor of ReportsCalendar

export function ScheduleAdherence() {
    const { reportData, fetchReportData, loading } = useReportsStore();
    const { selectedEmployee, selectedTeam } = useFilterStore();
    const data = reportData['adherence'] || [];

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedPreset, setSelectedPreset] = useState('Today');

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
        const loadData = () => {
            const { start, end } = getDatesFromPreset(selectedPreset);
            fetchReportData('adherence', { 
                startDate: toYMD(start), 
                endDate: toYMD(end),
                userId: selectedEmployee,
                teamId: selectedTeam
            });
        };

        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [selectedPreset, fetchReportData, selectedEmployee, selectedTeam]);

    const handleApplyCalendar = () => {
        setIsCalendarOpen(false);
    };

    const handleCancelCalendar = () => {
        setIsCalendarOpen(false);
    };




    return (
        <div className="space-y-8 relative z-30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Schedule Adherence</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">View and analyze your schedule adherence data.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Date Button */}
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
                                    onApply={handleApplyCalendar}
                                    onCancel={handleCancelCalendar}
                                />
                            </div>
                        )}
                    </div>


                    {/* Add Filter */}
                    <FilterDropdown />

                    <ExportDropdown
                        data={data}
                        columns={[
                            { header: 'Employee Name', key: 'employee' },
                            { header: 'Online Status', key: 'isOnline', formatter: (val) => val ? 'Online' : 'Offline' },
                            { header: 'Current Application', key: 'currentApp', formatter: (val) => val || 'None' },
                            { header: 'Adherence Rating', key: 'status' },
                            { header: 'Adherence Score (%)', key: 'adherence', formatter: (val) => `${val}%` },
                        ]}
                        fileName="schedule-adherence-report"
                        metadata={{
                            title: 'Employee Schedule Adherence Report',
                            dateRange: selectedPreset
                        }}
                    />
                </div>
            </div>

            {/* List */}
            <div className="grid gap-6">
                <div className="rounded-[2.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                    <div className="border-b border-slate-100 p-8 dark:border-slate-800">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Employee Adherence</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.length === 0 ? (
                            <div className="p-16 flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                    <User size={32} />
                                </div>
                                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Attendance Records</h4>
                                <p className="text-xs text-slate-400 max-w-sm mt-1">Shift adherence scores will automatically populate from real-time employee attendance punch-ins.</p>
                            </div>
                        ) : (
                            data.map((item) => (
                            <div key={item.id || item.employee} className="flex items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-6">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.isOnline ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-lg font-black text-slate-900 dark:text-white">{item.employee}</p>
                                            {item.isOnline && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Online
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${item.status === 'No Attendance' ? 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' : item.adherence >= 90 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : item.adherence >= 80 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                {item.status}
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">Shift Adherence</span>
                                            {item.isOnline && item.currentApp && (
                                                <span className="text-xs font-bold text-primary-600">· Working on {item.currentApp}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="hidden sm:block text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Score</p>
                                        <div className="flex items-center gap-1">
                                            {item.adherence >= 90 ? <CheckCircle2 size={16} className="text-emerald-500" /> : item.adherence >= 80 ? <MinusCircle size={16} className="text-amber-500" /> : <AlertCircle size={16} className="text-rose-500" />}
                                            <span className={`text-xl font-black ${item.adherence >= 90 ? 'text-emerald-600' : item.adherence >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>{item.adherence}%</span>
                                        </div>
                                    </div>
                                    <div className="h-14 w-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${item.adherence >= 90 ? 'bg-emerald-500' : item.adherence >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ height: `${item.adherence}%`, marginTop: `${100 - item.adherence}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
