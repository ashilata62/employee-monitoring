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
import { useShiftLogic, sampleShiftData } from '../hooks/useShiftLogic';
import { cn } from '../utils/cn';
import useAttendanceStore from '../store/attendanceStore';
import { useFilterStore } from '../store/filterStore';
import { format, addDays, startOfWeek, parseISO, isWithinInterval, isSameDay } from 'date-fns';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/authStore';

export function TimeAndAttendance() {
    const { employees } = useRealTime();
    const { role } = useAuthStore();
    const [activeTab, setActiveTab] = useState('Timesheets');
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
        clockIn,
        clockOut
    } = useAttendanceStore();

    // Re-fetch all data when date range or filters change
    useEffect(() => {
        const params = {
            startDate: dateRange?.start,
            endDate: dateRange?.end,
            teamId: selectedTeam,
            employeeId: selectedEmployee
        };
        fetchTimesheets(params);
        if (role === 'ADMIN' || role === 'MANAGER') {
            fetchManualTimes(params);
        }
        fetchShifts(params);
        fetchTimeOffs(params);
    }, [dateRange, selectedTeam, selectedEmployee, fetchTimesheets, fetchManualTimes, fetchShifts, fetchTimeOffs]);

    // Socket-based real-time refresh
    const { socket } = useRealTime();
    useEffect(() => {
        if (!socket) return;

        const handleAttendanceUpdate = (data) => {
            console.log('Real-time attendance update received:', data);
            // Refresh timesheets if on the relevant tab or if it's for today
            const params = {
                startDate: dateRange?.start,
                endDate: dateRange?.end,
                teamId: selectedTeam,
                employeeId: selectedEmployee
            };
            fetchTimesheets(params);
        };

        socket.on('attendance:update', handleAttendanceUpdate);
        return () => socket.off('attendance:update', handleAttendanceUpdate);
    }, [socket, dateRange, selectedTeam, selectedEmployee, fetchTimesheets]);

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
        // Also include all org employees
        employees.forEach(e => {
            if (!empMap.has(e.id)) empMap.set(e.id, e.fullName || e.name || 'Unknown');
        });
        return Array.from(empMap, ([id, name]) => ({ id, name }));
    }, [shifts, timeOffs, employees]);

    // Filtered lists for various tabs
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = (emp.fullName || emp.name || '').toLowerCase().includes(generalSearch.toLowerCase());
            const matchesTeam = !selectedTeam || emp.teamId === selectedTeam;
            const matchesEmp = !selectedEmployee || emp.id === selectedEmployee;
            return matchesSearch && matchesTeam && matchesEmp;
        });
    }, [employees, generalSearch, selectedTeam, selectedEmployee]);

    const filteredScheduleEmps = useMemo(() => {
        return scheduleEmployees.filter(emp => {
            const matchesSearch = emp.name.toLowerCase().includes(scheduleSearch.toLowerCase());
            const orgEmp = employees.find(e => e.id === emp.id);
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
        <div className="min-h-screen bg-[#fcfdfe] dark:bg-slate-950 pb-12 px-2 sm:px-4 lg:px-8 transition-colors duration-200">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-8 mb-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Time and Attendance</h1>
                </div>
                <div className="flex items-center gap-4">
                    {/* Actions and view toggles removed */}
                </div>
            </div>

            {/* Tabs */}
            <div className="overflow-x-auto mb-8">
                <div className="flex items-center gap-10 border-b border-slate-100 dark:border-slate-800 min-w-max">
                    {['Timesheets', 'Attendance']
                        .map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-sm font-black transition-all relative ${activeTab === tab ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary-600 rounded-full" />}
                            </button>
                        ))}
                </div>
            </div>

            {/* Filter Hub */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
                <GlobalCalendar />

                <div className="ml-auto flex items-center gap-3">
                    <div className="relative group w-full md:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search employee or team"
                            value={generalSearch}
                            onChange={(e) => setGeneralSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-medium dark:text-slate-200 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                    {activeTab === 'Timesheets' && (
                        <button
                            onClick={handleDownload}
                            title="Download CSV"
                            className="p-2 border border-slate-200 dark:border-slate-800 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm"
                        >
                            <Download size={18} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Specific Content */}
            {activeTab === 'Timesheets' && (
                <div className="space-y-6">
                    {viewMode === 'Day View' ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left min-w-[1000px]">
                                <thead className="bg-[#fcfdfe] dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
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
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {timesheets.filter(row => {
                                        const matchesSearch = (row.employee?.fullName?.toLowerCase() ?? '').includes(generalSearch.toLowerCase()) ||
                                            (row.employee?.team?.name?.toLowerCase() ?? '').includes(generalSearch.toLowerCase());
                                        const matchesTeam = !selectedTeam || row.employee?.teamId === selectedTeam;
                                        const matchesEmp = !selectedEmployee || row.employeeId === selectedEmployee;
                                        return matchesSearch && matchesTeam && matchesEmp;
                                    }).map((row) => (
                                        <tr key={row.id || `${row.employeeId}-${row.date}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-xs font-black text-rose-600 border border-rose-200">
                                                        {(row.employee?.fullName || row.employee?.name || '??').split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{row.employee?.fullName || row.employee?.name || 'Unknown'}</span>
                                                        {row.sessionCount > 1 && (
                                                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">{row.sessionCount} sessions merged</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-xs font-bold text-slate-600 dark:text-slate-400 border-l border-slate-50 dark:border-slate-800">{row.employee?.location || 'Remote'}</td>
                                            <td className="px-6 py-6 text-xs font-bold text-slate-600 dark:text-slate-400">{row.employee?.team?.name || 'General'}</td>
                                            <td className="px-6 py-6 text-xs font-bold text-slate-800 dark:text-slate-300">
                                                {format(new Date(row.date), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="px-6 py-6 text-xs font-bold text-slate-800 dark:text-slate-300">
                                                <div className="flex items-center gap-1 group">
                                                    {row.clockIn ? format(new Date(row.clockIn), 'hh:mm a') : '--'}
                                                    {row.clockIn && !row.clockOut && <Play size={10} className="text-primary-500 fill-primary-500 rotate-90" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-xs font-bold text-slate-800 dark:text-slate-300">
                                                {row.clockOut ? format(new Date(row.clockOut), 'hh:mm a') : '--'}
                                            </td>
                                            <td className="px-6 py-6 text-xs font-bold text-slate-800 dark:text-slate-300">
                                                {formatDuration(row.duration, row.clockIn, row.clockOut)}
                                            </td>
                                            <td className="px-6 py-6">
                                                {row.clockIn && !row.clockOut ? (
                                                    <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider">Working</span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-wider">Completed</span>
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
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left min-w-[1000px]">
                                <thead className="bg-[#fcfdfe] dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                                    <tr>
                                        <th className="px-8 py-4">Employee</th>
                                        <th className="px-8 py-4">Team</th>
                                        <th className="px-8 py-4">Scheduled Shift</th>
                                        <th className="px-8 py-4">Actual Attendance</th>
                                        <th className="px-8 py-4">Shift Compliance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
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
                                                    {emp.team?.name || 'General'}
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
                                                                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20 flex items-center gap-1">
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

            {activeTab === 'Attendance' && (
                <div className="space-y-6">
                    {/* Legend and Threshold block removed */}

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-48">Employee Name</th>
                                    {gridDays.map((date, i) => (
                                        <th key={i} className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                                            {format(date, 'MMM dd')}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredEmployees.map((emp, idx) => {
                                    const empTimesheets = timesheets.filter(t => t.employeeId === emp.id);
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-black border border-white bg-blue-100 text-blue-600`}>
                                                        {(emp.fullName || emp.name || '??').split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{emp.fullName || emp.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            {gridDays.map((date, i) => {
                                                const dayStr = format(date, 'yyyy-MM-dd');
                                                const hasAttended = empTimesheets.some(t => format(new Date(t.date), 'yyyy-MM-dd') === dayStr);
                                                return (
                                                    <td key={i} className="px-3 py-5 text-center">
                                                        <div className={`h-5 w-5 rounded-full mx-auto ${hasAttended ? 'bg-primary-400 dark:bg-primary-500/60' : 'border border-slate-300 dark:border-slate-700'}`} />
                                                    </td>
                                                );
                                            })}
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                                    {empTimesheets.filter(t => {
                                                        const d = format(new Date(t.date), 'yyyy-MM-dd');
                                                        return gridDays.some(gd => format(gd, 'yyyy-MM-dd') === d);
                                                    }).length}/7
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-slate-50/30 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                                    <td className="px-6 py-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Count</span></td>
                                    {gridDays.map((date, i) => {
                                        const dayStr = format(date, 'yyyy-MM-dd');
                                        const count = filteredEmployees.filter(emp =>
                                            timesheets.some(t => t.employeeId === emp.id && format(new Date(t.date), 'yyyy-MM-dd') === dayStr)
                                        ).length;
                                        return (
                                            <td key={i} className="px-3 py-4 text-center text-xs font-black text-slate-700 dark:text-slate-300">{count}</td>
                                        );
                                    })}
                                    <td className="px-6 py-4 text-center text-xs font-black text-primary-600">
                                        {filteredEmployees.reduce((acc, emp) => {
                                            const empTimesheets = timesheets.filter(t => t.employeeId === emp.id);
                                            return acc + empTimesheets.filter(t => {
                                                const d = format(new Date(t.date), 'yyyy-MM-dd');
                                                return gridDays.some(gd => format(gd, 'yyyy-MM-dd') === d);
                                            }).length;
                                        }, 0)}/{filteredEmployees.length * 7}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Shift Status Preview (Integrated from Alerts) */}
                    <div className="mt-12 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shift Compliance Preview</h3>
                                <p className="text-xs font-bold text-slate-400">Real-time status based on Alerts & Scheduling settings</p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-black text-[10px] uppercase tracking-widest">
                                <Zap size={14} /> Live
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#fcfdfe] dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                                    <tr>
                                        <th className="px-8 py-4">Employee</th>
                                        <th className="px-8 py-4">Scheduled</th>
                                        <th className="px-8 py-4">Actual</th>
                                        <th className="px-8 py-4">Status & Alerts</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {shifts.map((shift) => {
                                        const attendance = timesheets.find(t =>
                                            t.employeeId === shift.employeeId &&
                                            format(new Date(t.date), 'yyyy-MM-dd') === format(new Date(shift.date), 'yyyy-MM-dd')
                                        );

                                        const actualStart = attendance?.clockIn ? format(new Date(attendance.clockIn), 'HH:mm') : null;
                                        const actualEnd = attendance?.clockOut ? format(new Date(attendance.clockOut), 'HH:mm') : null;

                                        const status = checkShiftStatus(
                                            shift.startTime,
                                            shift.endTime,
                                            actualStart,
                                            actualEnd
                                        );

                                        return (
                                            <tr key={shift.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-400">
                                                            {shift.employee?.fullName?.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{shift.employee?.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-xs font-bold text-slate-500">
                                                    {shift.startTime} – {shift.endTime}
                                                </td>
                                                <td className="px-8 py-6 text-xs font-bold text-slate-900 dark:text-white">
                                                    {actualStart ? `${actualStart} – ${actualEnd || '--:--'}` : '--'}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-wrap gap-2">
                                                        {!actualStart ? (
                                                            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 flex items-center gap-1">
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
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

