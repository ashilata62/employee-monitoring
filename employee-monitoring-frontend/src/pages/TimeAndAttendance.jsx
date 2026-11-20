import React, { useState, useEffect, useMemo } from 'react';
import {
    Bell,
    Calendar,
    Search,
    Download,
    LayoutGrid,
    Plus,
    Clock,
    User,
    Play,
    Info,
    ChevronDown,
    Zap,
    History,
    AlertTriangle,
    ShieldAlert,
    X,
    Loader
} from 'lucide-react';
import { GlobalCalendar } from '../components/GlobalCalendar';
import { AddManualTimeModal } from '../components/AddManualTimeModal';
import { AddTimeOffModal } from '../components/AddTimeOffModal';
import { ImportTimeOffModal } from '../components/ImportTimeOffModal';
import { Upload } from 'lucide-react';
import { useRealTime } from '../hooks/RealTimeContext';
import { useShiftLogic } from '../hooks/useShiftLogic';
import { cn } from '../utils/cn';
import useAttendanceStore from '../store/attendanceStore';
import { useFilterStore } from '../store/filterStore';
import { format, addDays, startOfWeek, parseISO, isWithinInterval, isSameDay } from 'date-fns';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from '../utils/toastManager';
import { WeeklyTimesheetsView } from '../components/timesheets/WeeklyTimesheetsView';
import { ApprovalsQueueView } from '../components/timesheets/ApprovalsQueueView';

const isDayAttended = (t, dayStr) => {
    if (!t) return false;
    if (typeof t.date === 'string' && t.date.slice(0, 10) === dayStr) return true;
    if (typeof t.clockIn === 'string' && t.clockIn.slice(0, 10) === dayStr) return true;
    if (t.date) {
        const d = new Date(t.date);
        if (!isNaN(d.getTime()) && format(d, 'yyyy-MM-dd') === dayStr) return true;
    }
    if (t.clockIn) {
        const d = new Date(t.clockIn);
        if (!isNaN(d.getTime()) && format(d, 'yyyy-MM-dd') === dayStr) return true;
    }
    return false;
};

export function TimeAndAttendance() {
    const { employees } = useRealTime();
    const { role } = useAuthStore();
    const [activeTab, setActiveTab] = useState('Weekly Timesheets');
    const [viewMode, setViewMode] = useState('Day View');
    const [isManualTimeModalOpen, setIsManualTimeModalOpen] = useState(false);
    const [isTimeOffMenuOpen, setIsTimeOffMenuOpen] = useState(false);
    const [isAddTimeOffModalOpen, setIsAddTimeOffModalOpen] = useState(false);
    const [isImportTimeOffModalOpen, setIsImportTimeOffModalOpen] = useState(false);
    const [isAddShiftsOpen, setIsAddShiftsOpen] = useState(false);
    const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
    const [generalSearch, setGeneralSearch] = useState('');
    const [scheduleSearch, setScheduleSearch] = useState('');
    const [showShifts, setShowShifts] = useState(true);
    const [showTimeOff, setShowTimeOff] = useState(true);
    const { checkShiftStatus } = useShiftLogic();

    const { dateRange, selectedTeam, selectedEmployee } = useFilterStore();

    const {
        timesheets,
        manualTimes,
        shifts,
        timeOffs,
        loading,
        fetchTimesheets,
        fetchManualTimes,
        fetchShifts,
        fetchTimeOffs,
        addShift,
        addManualTime,
        clockIn,
        clockOut
    } = useAttendanceStore();

    // Re-fetch all data when date range or filters change
    useEffect(() => {
        let start = dateRange?.start;
        let end = dateRange?.end;

        // When viewing Attendance Matrix, always query the full 7-day grid window so all matrix columns have data
        if (activeTab === 'Attendance Matrix') {
            const base = dateRange?.start ? parseISO(dateRange.start) : new Date();
            const weekStart = startOfWeek(base, { weekStartsOn: 1 });
            start = format(weekStart, 'yyyy-MM-dd');
            end = format(addDays(weekStart, 6), 'yyyy-MM-dd');
        }

        const params = {
            startDate: start,
            endDate: end,
            teamId: selectedTeam,
            employeeId: selectedEmployee
        };
        fetchTimesheets(params);
        if (role === 'ADMIN' || role === 'MANAGER') {
            fetchManualTimes(params);
        }
        fetchShifts(params);
        fetchTimeOffs(params);
    }, [activeTab, dateRange, selectedTeam, selectedEmployee, fetchTimesheets, fetchManualTimes, fetchShifts, fetchTimeOffs]);

    // Socket-based real-time refresh
    const { socket } = useRealTime();
    useEffect(() => {
        if (!socket) return;

        const handleAttendanceUpdate = (data) => {
            console.log('Real-time attendance update received:', data);
            let start = dateRange?.start;
            let end = dateRange?.end;
            if (activeTab === 'Attendance Matrix') {
                const base = dateRange?.start ? parseISO(dateRange.start) : new Date();
                const weekStart = startOfWeek(base, { weekStartsOn: 1 });
                start = format(weekStart, 'yyyy-MM-dd');
                end = format(addDays(weekStart, 6), 'yyyy-MM-dd');
            }
            const params = {
                startDate: start,
                endDate: end,
                teamId: selectedTeam,
                employeeId: selectedEmployee
            };
            fetchTimesheets(params);
        };

        socket.on('attendance:update', handleAttendanceUpdate);
        return () => socket.off('attendance:update', handleAttendanceUpdate);
    }, [socket, activeTab, dateRange, selectedTeam, selectedEmployee, fetchTimesheets]);

    // Build the 7-day grid starting from the start of the filter week (or today's week)
    const gridDays = useMemo(() => {
        const base = dateRange?.start ? parseISO(dateRange.start) : new Date();
        const weekStart = startOfWeek(base, { weekStartsOn: 1 }); // Monday
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }, [dateRange]);

    // Unique employees who have shifts in current view
    const scheduleEmployees = useMemo(() => {
        const empMap = new Map();
        shifts.forEach(s => {
            if (!empMap.has(s.employeeId)) empMap.set(s.employeeId, s.employee?.fullName || 'Unknown');
        });
        timeOffs.forEach(t => {
            if (!empMap.has(t.employeeId)) empMap.set(t.employeeId, t.employee?.fullName || 'Unknown');
        });
        // Also include all org employees (exclude ADMIN)
        employees.forEach(e => {
            if ((e.role || '').toUpperCase() === 'ADMIN') return;
            if (!empMap.has(e.id)) empMap.set(e.id, e.fullName || e.name || 'Unknown');
        });
        return Array.from(empMap, ([id, name]) => ({ id, name }));
    }, [shifts, timeOffs, employees]);

    // Filtered lists for various tabs (strictly exclude ADMIN)
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            if ((emp.role || '').toUpperCase() === 'ADMIN') return false;
            const matchesSearch = (emp.fullName || emp.name || '').toLowerCase().includes(generalSearch.toLowerCase());
            const matchesTeam = !selectedTeam || emp.teamId === selectedTeam;
            const matchesEmp = !selectedEmployee || emp.id === selectedEmployee;
            return matchesSearch && matchesTeam && matchesEmp;
        });
    }, [employees, generalSearch, selectedTeam, selectedEmployee]);

    const filteredScheduleEmps = useMemo(() => {
        return scheduleEmployees.filter(emp => {
            const orgEmp = employees.find(e => e.id === emp.id);
            if ((orgEmp?.role || '').toUpperCase() === 'ADMIN') return false;
            const matchesSearch = emp.name.toLowerCase().includes(scheduleSearch.toLowerCase());
            const matchesTeam = !selectedTeam || orgEmp?.teamId === selectedTeam;
            const matchesEmp = !selectedEmployee || emp.id === selectedEmployee;
            return matchesSearch && matchesTeam && matchesEmp;
        });
    }, [scheduleEmployees, scheduleSearch, selectedTeam, selectedEmployee, employees]);


    const formatDuration = (seconds, clockIn, clockOut) => {
        if (!seconds && clockIn && !clockOut) return 'In Progress';
        if (!seconds && clockIn && clockOut) {
            const s = Math.floor((new Date(clockOut) - new Date(clockIn)) / 1000);
            if (s <= 0) return '0h 0m';
            return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
        }
        if (!seconds) return '--';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const handleDownload = () => {
        if (!timesheets.length) return alert('No data to download');
        const rows = [['Name', 'Location', 'Team', 'Date', 'Clock-in', 'Clock-out', 'Duration'],
        ...timesheets.map(r => [
            r.employee?.fullName,
            r.employee?.location,
            r.employee?.team?.name,
            format(new Date(r.date), 'MMM dd, yyyy'),
            r.clockIn ? format(new Date(r.clockIn), 'hh:mm a') : '--',
            r.clockOut ? format(new Date(r.clockOut), 'hh:mm a') : '--',
            r.duration ? `${Math.floor(r.duration / 3600)}h ${Math.floor((r.duration % 3600) / 60)}m` : '--'
        ])];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'attendance_report.csv'; a.click();
        URL.revokeObjectURL(url);
    };


    return (
        <div className="w-full pb-12 transition-colors duration-200">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 mb-4">
                <div>
                    <h1 className="font-serif text-3xl font-normal text-[#29291F] dark:text-[#F5F1E9] tracking-tight">Time & Attendance</h1>
                    <p className="text-xs font-medium text-[#777367] dark:text-[#B8B3A7] mt-0.5">Daily timesheets, attendance logs and approval workflows</p>
                </div>
                <div className="flex items-center gap-3">
                    {(role === 'ADMIN' || role === 'MANAGER') && (
                        <button
                            onClick={() => setIsManualTimeModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B9955B] hover:bg-[#A17D45] text-white font-semibold text-xs tracking-wider shadow-warm-xs transition-all cursor-pointer active:scale-95"
                        >
                            <Clock size={15} />
                            <span>+ Add Manual Time</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="overflow-x-auto mb-8">
                <div className="flex items-center gap-8 border-b border-[#E5DED2] dark:border-[#384232] min-w-max">
                    {[
                        'Weekly Timesheets',
                        'Daily Attendance',
                        ...(role === 'ADMIN' || role === 'MANAGER' ? ['Approvals Queue'] : []),
                        'Attendance Matrix'
                    ].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3.5 text-xs uppercase tracking-wider font-bold transition-all relative cursor-pointer ${
                                activeTab === tab
                                    ? 'text-[#B9955B] font-bold'
                                    : 'text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9]'
                            }`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#B9955B] rounded-full" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Weekly Timesheets Tab (Punchcard Workflow) */}
            {activeTab === 'Weekly Timesheets' && (
                <WeeklyTimesheetsView employees={employees} />
            )}

            {/* Approvals Queue Tab (Manager & Admin Workflow) */}
            {activeTab === 'Approvals Queue' && (
                <ApprovalsQueueView />
            )}

            {/* Filter Hub (For Daily Attendance & Matrix) */}
            {(activeTab === 'Daily Attendance' || activeTab === 'Attendance Matrix') && (
                <div className="flex flex-wrap items-center gap-4 mb-8">
                    <GlobalCalendar />

                    <div className="ml-auto flex items-center gap-3">
                        {role !== 'EMPLOYEE' && (
                            <div className="relative group w-full md:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search employee or team"
                                    value={generalSearch}
                                    onChange={(e) => setGeneralSearch(e.target.value)}
                                    className="w-full bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition-all placeholder-[#777367]"
                                />
                            </div>
                        )}
                        {activeTab === 'Daily Attendance' && (
                            <button
                                onClick={handleDownload}
                                title="Download CSV"
                                className="p-2 border border-[#E5DED2] dark:border-[#384232] text-[#B9955B] bg-[#FBF9F5] dark:bg-[#252B20] rounded-xl hover:border-[#B9955B] transition-colors shadow-warm-xs cursor-pointer"
                            >
                                <Download size={18} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Tab Specific Content: Daily Attendance */}
            {activeTab === 'Daily Attendance' && (
                <div className="space-y-6">
                    {viewMode === 'Day View' ? (
                        <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs overflow-hidden overflow-x-auto">
                            <table className="w-full text-left min-w-[1000px]">
                                <thead className="bg-[#E5DDCF]/70 dark:bg-[#1E2419] text-[#777367] dark:text-[#B8B3A7] font-bold text-[10px] uppercase tracking-[0.14em] border-b border-[#D6CDBC] dark:border-[#384232]">
                                    <tr>
                                        <th className="px-6 py-4">Employee Name</th>
                                        <th className="px-6 py-4">Location</th>
                                        <th className="px-6 py-4">Team</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Clock-in</th>
                                        <th className="px-6 py-4">Clock-out</th>
                                        <th className="px-6 py-4">Total Hours</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D6CDBC]/60 dark:divide-[#384232]">
                                    {timesheets.filter(row => {
                                        if ((row.employee?.role || '').toUpperCase() === 'ADMIN') return false;
                                        const matchesSearch = (row.employee?.fullName?.toLowerCase() ?? '').includes(generalSearch.toLowerCase()) ||
                                            (row.employee?.team?.name?.toLowerCase() ?? '').includes(generalSearch.toLowerCase());
                                        const matchesTeam = !selectedTeam || row.employee?.teamId === selectedTeam;
                                        const matchesEmp = !selectedEmployee || row.employeeId === selectedEmployee;
                                        return matchesSearch && matchesTeam && matchesEmp;
                                    }).map((row) => (
                                        <tr key={row.id || `${row.employeeId}-${row.date}`} className="bg-[#F5F1E9] dark:bg-[#1E2419] hover:bg-[#EAE2D3] dark:hover:bg-[#252B20] transition-colors border-b border-[#D6CDBC]/50">
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-9 w-9 rounded-xl bg-[#EEE8DD] dark:bg-[#252B20] text-[#30382B] dark:text-[#F5F1E9] border border-[#E5DED2] dark:border-[#384232] flex items-center justify-center text-xs font-bold tracking-wider shrink-0">
                                                        {(row.employee?.fullName || row.employee?.name || '??').split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">{row.employee?.fullName || row.employee?.name || 'Unknown'}</span>
                                                        {row.sessionCount > 1 && (
                                                            <p className="text-[9px] text-[#777367] dark:text-[#B8B3A7] font-bold mt-0.5">{row.sessionCount} sessions merged</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-xs font-bold text-[#777367] dark:text-[#B8B3A7] border-l border-[#D6CDBC]/40 dark:border-[#384232]">{row.employee?.location || 'Remote'}</td>
                                            <td className="px-6 py-6 text-xs font-bold text-[#777367] dark:text-[#B8B3A7]">
                                                {typeof row.employee?.team === 'object' ? (row.employee?.team?.name || 'No Team') : (row.employee?.team || 'No Team')}
                                            </td>
                                            <td className="px-6 py-6 text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                                {format(new Date(row.date), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="px-6 py-6 text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                                <div className="flex items-center gap-1 group">
                                                    {row.clockIn ? format(new Date(row.clockIn), 'hh:mm a') : '--'}
                                                    {row.clockIn && !row.clockOut && <Play size={10} className="text-[#5E7D64] fill-[#5E7D64] rotate-90" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                                {row.clockOut ? format(new Date(row.clockOut), 'hh:mm a') : '--'}
                                            </td>
                                            <td className="px-6 py-6 text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                                {formatDuration(row.duration, row.clockIn, row.clockOut)}
                                            </td>
                                            <td className="px-6 py-6">
                                                {row.clockIn && !row.clockOut ? (
                                                    <span className="px-2.5 py-0.5 rounded-md bg-[#5E7D64]/10 dark:bg-[#5E7D64]/20 text-[#5E7D64] dark:text-[#8BB394] text-[9px] font-bold uppercase tracking-wider">Working</span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-md bg-[#EEE8DD] dark:bg-[#252B20] text-[#777367] dark:text-[#B8B3A7] border border-[#D6CDBC]/50 dark:border-[#384232] text-[9px] font-bold uppercase tracking-wider">Completed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && timesheets.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-20 text-center text-slate-400 font-bold">No attendance records found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* Shift View Implementation */
                        <div className="bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border border-[#E5DED2] dark:border-[#384232] shadow-warm-xs overflow-hidden overflow-x-auto">
                            <table className="w-full text-left min-w-[1000px]">
                                <thead className="bg-[#E5DDCF]/60 dark:bg-[#1E2419] text-[#777367] font-bold text-[10px] uppercase tracking-[0.14em] border-b border-[#D6CDBC] dark:border-[#384232]">
                                    <tr>
                                        <th className="px-8 py-4">Employee</th>
                                        <th className="px-8 py-4">Team</th>
                                        <th className="px-8 py-4">Scheduled Shift</th>
                                        <th className="px-8 py-4">Actual Attendance</th>
                                        <th className="px-8 py-4">Shift Compliance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D6CDBC]/60 dark:divide-[#384232]">
                                    {filteredEmployees.map((emp) => {
                                        // Find shift for this specific employee today
                                        const shift = shifts.find(s => 
                                            s.employeeId === emp.id && 
                                            format(new Date(s.date), 'yyyy-MM-dd') === (dateRange?.start ? format(parseISO(dateRange.start), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
                                        );

                                        // Find attendance for today
                                        const attendance = timesheets.find(t =>
                                            t.employeeId === emp.id &&
                                            format(new Date(t.date), 'yyyy-MM-dd') === (dateRange?.start ? format(parseISO(dateRange.start), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
                                        );

                                        const actualStart = attendance?.clockIn ? format(new Date(attendance.clockIn), 'HH:mm') : null;
                                        const actualEnd = attendance?.clockOut ? format(new Date(attendance.clockOut), 'HH:mm') : null;

                                        const status = shift ? checkShiftStatus(
                                            shift.startTime,
                                            shift.endTime,
                                            actualStart,
                                            actualEnd
                                        ) : { warning: false, overtime: false, incomplete: false, message: 'No Shift Scheduled' };

                                        return (
                                            <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-400">
                                                            {(emp.fullName || emp.name || '??').split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{emp.fullName || emp.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-xs font-bold text-slate-500">
                                                    {typeof emp.team === 'object' ? (emp.team?.name || 'No Team') : (emp.team || 'No Team')}
                                                </td>
                                                <td className="px-8 py-6 text-xs font-bold text-slate-500">
                                                    {shift ? (
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={12} className="text-slate-400" />
                                                            {shift.startTime} – {shift.endTime}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">No Shift</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-xs font-bold text-slate-900 dark:text-white">
                                                    {actualStart ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-2 w-2 rounded-full ${actualEnd ? 'bg-slate-400' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse'}`} />
                                                            {actualStart} – {actualEnd || 'Present'}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">Not Clocked-in</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-wrap gap-2">
                                                        {!shift ? (
                                                            actualStart ? (
                                                                <span className="px-3 py-1 rounded-full bg-[#FAF0E1] text-[#C98A3C] text-[10px] font-bold uppercase tracking-wider border border-[#E8D4B8] flex items-center gap-1">
                                                                    <Zap size={12} /> Unsched. Work
                                                                </span>
                                                            ) : (
                                                                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">Off Day</span>
                                                            )
                                                        ) : !actualStart ? (
                                                            <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-500/20 flex items-center gap-1">
                                                                <ShieldAlert size={12} /> Absent
                                                            </span>
                                                        ) : !status.warning && !status.overtime && !status.incomplete ? (
                                                            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">On Track</span>
                                                        ) : (
                                                            <>
                                                                {status.warning && (
                                                                    <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20 flex items-center gap-1">
                                                                        <AlertTriangle size={12} /> {status.message}
                                                                    </span>
                                                                )}
                                                                {status.overtime && (
                                                                    <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-500/20 flex items-center gap-1">
                                                                        <Zap size={12} /> Overtime
                                                                    </span>
                                                                )}
                                                                {status.incomplete && (
                                                                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                                                        <ShieldAlert size={12} /> {status.message}
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredEmployees.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-20 text-center text-slate-400 font-bold italic">No employees found matching the filters</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'Attendance Matrix' && (
                <div className="space-y-6">
                    {/* Legend and Threshold block removed */}

                    <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs overflow-hidden overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-[#E5DDCF]/70 dark:bg-[#1E2419] border-b border-[#D6CDBC] dark:border-[#384232]">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7] w-48">Employee Name</th>
                                    {gridDays.map((date, i) => (
                                        <th key={i} className="px-3 py-4 text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7] text-center">
                                            {format(date, 'MMM dd')}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7] text-center">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D6CDBC]/50 dark:divide-[#384232]">
                                {filteredEmployees
                                    .filter(emp => (emp.role || 'EMPLOYEE').toUpperCase() !== 'ADMIN')
                                    .map((emp, idx) => {
                                        const empTimesheets = timesheets.filter(t => t.employeeId === emp.id);
                                        const attendedDaysCount = gridDays.filter(date => {
                                             const dayStr = format(date, 'yyyy-MM-dd');
                                             return empTimesheets.some(t => isDayAttended(t, dayStr));
                                        }).length;

                                        return (
                                            <tr key={idx} className="bg-[#F5F1E9] dark:bg-[#1E2419] hover:bg-[#EAE2D3] dark:hover:bg-[#252B20] transition-colors border-b border-[#D6CDBC]/50">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold border border-[#E5DED2] dark:border-[#384232] bg-[#EEE8DD] dark:bg-[#252B20] text-[#30382B] dark:text-[#F5F1E9]`}>
                                                            {(emp.fullName || emp.name || '??').split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">{emp.fullName || emp.name || 'Unknown'}</span>
                                                                {emp.role && emp.role !== 'EMPLOYEE' && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#B9955B]/15 text-[#B9955B] dark:bg-[#B9955B]/25 dark:text-[#D3B98D] border border-[#B9955B]/30">
                                                                        {emp.role}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-[#777367] dark:text-[#B8B3A7] font-medium">
                                                                {typeof emp.team === 'object' ? (emp.team?.name || 'No Team') : (emp.team || 'No Team')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {gridDays.map((date, i) => {
                                                    const dayStr = format(date, 'yyyy-MM-dd');
                                                    const hasAttended = empTimesheets.some(t => isDayAttended(t, dayStr));
                                                    return (
                                                        <td key={i} className="px-3 py-5 text-center">
                                                            <div
                                                                className={`h-5 w-5 rounded-full mx-auto transition-all ${hasAttended ? 'bg-[#5E7D64] shadow-sm shadow-emerald-500/30 ring-2 ring-emerald-600/20' : 'border border-[#D6CDBC] dark:border-[#384232]'}`}
                                                                title={hasAttended ? `${emp.fullName || emp.name}: Present on ${format(date, 'MMM dd')}` : `Not Present`}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                                        {attendedDaysCount}/7
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                <tr className="bg-[#E5DDCF]/50 dark:bg-[#1E2419]/50 border-t border-[#D6CDBC] dark:border-[#384232]">
                                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-widest">Total Count</span></td>
                                    {gridDays.map((date, i) => {
                                        const dayStr = format(date, 'yyyy-MM-dd');
                                        const matrixEmps = filteredEmployees.filter(emp => (emp.role || 'EMPLOYEE').toUpperCase() !== 'ADMIN');
                                        const count = matrixEmps.filter(emp =>
                                            timesheets.some(t => t.employeeId === emp.id && isDayAttended(t, dayStr))
                                        ).length;
                                        return (
                                            <td key={i} className="px-3 py-4 text-center text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">{count}</td>
                                        );
                                    })}
                                    <td className="px-6 py-4 text-center text-xs font-bold text-[#B9955B] dark:text-[#D3B98D]">
                                        {(() => {
                                            const matrixEmps = filteredEmployees.filter(emp => (emp.role || 'EMPLOYEE').toUpperCase() !== 'ADMIN');
                                            const grandTotal = gridDays.reduce((acc, gd) => {
                                                const dayStr = format(gd, 'yyyy-MM-dd');
                                                return acc + matrixEmps.filter(emp =>
                                                    timesheets.some(t => t.employeeId === emp.id && isDayAttended(t, dayStr))
                                                ).length;
                                            }, 0);
                                            return `${grandTotal}/${matrixEmps.length * 7}`;
                                        })()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Shift Status Preview (Integrated from Alerts) */}
                    <div className="mt-8 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs overflow-hidden">
                        <div className="p-6 border-b border-[#D6CDBC] dark:border-[#384232] bg-[#E5DDCF]/50 dark:bg-[#1E2419] flex items-center justify-between">
                            <div>
                                <h3 className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.2em]">Shift Compliance Preview</h3>
                                <p className="text-xs font-bold text-[#777367] dark:text-[#B8B3A7]">Real-time status based on Alerts & Scheduling settings</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAEFEA] dark:bg-[#1E2B20] text-[#5E7D64] dark:text-[#8BB394] border border-[#C5D7C7] dark:border-[#325238] font-bold text-[10px] uppercase tracking-wider">
                                <Zap size={14} /> Live
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#E5DDCF]/60 dark:bg-[#1E2419] text-[#777367] dark:text-[#B8B3A7] font-bold text-[10px] uppercase tracking-wider border-b border-[#D6CDBC] dark:border-[#384232]">
                                    <tr>
                                        <th className="px-8 py-4">Employee</th>
                                        <th className="px-8 py-4">Scheduled</th>
                                        <th className="px-8 py-4">Actual</th>
                                        <th className="px-8 py-4">Status & Alerts</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D6CDBC]/50 dark:divide-[#384232]">
                                    {(() => {
                                        const complianceList = filteredEmployees.filter(emp => (emp.role || 'EMPLOYEE').toUpperCase() !== 'ADMIN');
                                        if (complianceList.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-12 text-center text-xs text-[#777367] dark:text-[#B8B3A7]">
                                                        No employees found for shift compliance review.
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        const todayStr = format(new Date(), 'yyyy-MM-dd');

                                        return complianceList.map((emp) => {
                                            // 1. Check if employee has a custom scheduled shift for today
                                            const shift = shifts.find(s => 
                                                s.employeeId === emp.id && 
                                                (s.date ? format(new Date(s.date), 'yyyy-MM-dd') === todayStr : true)
                                            );

                                            // 2. Check today's attendance record
                                            const attendance = timesheets.find(t => 
                                                t.employeeId === emp.id && 
                                                (t.date ? format(new Date(t.date), 'yyyy-MM-dd') === todayStr : true)
                                            ) || timesheets.find(t => t.employeeId === emp.id);

                                            const actualStart = attendance?.clockIn ? format(new Date(attendance.clockIn), 'hh:mm a') : null;
                                            const actualEnd = attendance?.clockOut ? format(new Date(attendance.clockOut), 'hh:mm a') : null;

                                            const scheduledText = shift ? `${shift.startTime} – ${shift.endTime}` : '09:00 AM – 06:00 PM';

                                            let statusBadge = null;
                                            if (actualStart && !actualEnd) {
                                                statusBadge = (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAEFEA] dark:bg-[#1E2B20] text-[#5E7D64] dark:text-[#8BB394] text-[10px] font-bold uppercase tracking-wider border border-[#C5D7C7] dark:border-[#325238]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#5E7D64] animate-pulse" />
                                                        Working / On Track
                                                    </span>
                                                );
                                            } else if (actualStart && actualEnd) {
                                                statusBadge = (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#EEE8DD] dark:bg-[#252B20] text-[#777367] dark:text-[#B8B3A7] text-[10px] font-bold uppercase tracking-wider border border-[#D6CDBC]/50 dark:border-[#384232]">
                                                        Completed
                                                    </span>
                                                );
                                            } else {
                                                statusBadge = (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FAF3F2] dark:bg-[#2E1E1E] text-[#A84B4B] dark:text-[#E07A7A] text-[10px] font-bold uppercase tracking-wider border border-[#F2D6D3] dark:border-[#572E2E]">
                                                        <ShieldAlert size={12} /> Not Clocked-in
                                                    </span>
                                                );
                                            }

                                            return (
                                                <tr key={emp.id} className="hover:bg-[#F5F1E9]/60 dark:hover:bg-[#1E2419]/60 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-[#EEE8DD] dark:bg-[#252B20] border border-[#E5DED2] dark:border-[#384232] flex items-center justify-center text-xs font-bold text-[#30382B] dark:text-[#F5F1E9]">
                                                                {(emp.fullName || emp.name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">{emp.fullName || emp.name}</span>
                                                                <p className="text-[10px] text-[#777367] dark:text-[#B8B3A7]">{typeof emp.team === 'object' ? (emp.team?.name || 'General') : (emp.team || 'General')}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-xs font-bold text-[#777367] dark:text-[#B8B3A7]">
                                                        {scheduledText}
                                                    </td>
                                                    <td className="px-8 py-5 text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                                        {actualStart ? `${actualStart} – ${actualEnd || 'Present'}` : '--'}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        {statusBadge}
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Manager / Admin to Add Manual Time */}
            {isManualTimeModalOpen && (
                <AddManualTimeModal
                    isOpen={isManualTimeModalOpen}
                    onClose={() => setIsManualTimeModalOpen(false)}
                    employees={employees.filter(e => (e.role || '').toUpperCase() !== 'ADMIN')}
                    onSave={async (formData) => {
                        try {
                            await addManualTime(formData);
                            toast.success('Manual time added successfully!');
                            // Refresh timesheets to reflect the newly added manual time instantly
                            const start = dateRange?.start;
                            const end = dateRange?.end;
                            fetchTimesheets({ startDate: start, endDate: end });
                            fetchManualTimes({ startDate: start, endDate: end });
                        } catch (err) {
                            toast.error(err.message || 'Failed to add manual time');
                        }
                    }}
                />
            )}
        </div>
    );
}

