import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Send,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    Calendar,
    Download,
    History,
    Loader2
} from 'lucide-react';
import { timesheetService, mondayOf, addDaysStr, fmtMoney, fmtH } from '../../services/timesheetService';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../utils/toastManager';

const STATUS_BADGE = {
    DRAFT: 'bg-[#E5DDCF] text-[#777367] border-[#D6CDBC]',
    SUBMITTED: 'bg-[#FAF0E1] text-[#C98A3C] border-[#E8D4B8]',
    APPROVED: 'bg-[#EAEFEA] text-[#5E7D64] border-[#C5D7C7]',
    REJECTED: 'bg-[#FAF3F2] text-[#A84B4B] border-[#F2D6D3]'
};

export function WeeklyTimesheetsView({ employees = [] }) {
    const { role } = useAuthStore();
    const [weekStart, setWeekStart] = useState(() => mondayOf());
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeDayModal, setActiveDayModal] = useState(null);

    const fmtTimeShort = (dateStr) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const fmtDurShort = (sess) => {
        if (sess.isLive) return 'Live';
        if (sess.minutes >= 60) {
            const h = Math.floor(sess.minutes / 60);
            const m = sess.minutes % 60;
            return m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
        if (sess.minutes > 0) return `${sess.minutes}m`;
        if (sess.durationSeconds > 0) return `${sess.durationSeconds}s`;
        return '<1m';
    };

    // Initial load and filter change
    const loadTimesheet = async () => {
        setLoading(true);
        try {
            const empId = role === 'EMPLOYEE' ? null : (selectedEmployeeId || null);
            const res = await timesheetService.getWeek(weekStart, empId);
            if (res.success) {
                const payload = Array.isArray(res.data) ? res.data[0] : res.data;
                setData(payload || null);
            }
        } catch (err) {
            console.error('Failed to load weekly timesheet:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTimesheet();
    }, [weekStart, selectedEmployeeId]);

    const handleSubmit = async () => {
        if (!data) return;
        setSubmitting(true);
        try {
            const res = await timesheetService.submit(weekStart, data.employeeId);
            if (res.success) {
                toast.success('Timesheet submitted for manager approval!');
                loadTimesheet();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = async () => {
        try {
            await timesheetService.exportPayrollCsv(weekStart);
            toast.success('Payroll CSV downloaded successfully');
        } catch (err) {
            toast.error('Failed to export payroll CSV');
        }
    };

    return (
        <div className="space-y-6">
            {/* Control Bar: Week Navigator & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#EEE8DD] dark:bg-[#252B20] p-4 rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setWeekStart(prev => addDaysStr(prev, -7))}
                        className="p-2 rounded-xl bg-[#F5F1E9] dark:bg-[#1E2419] text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] border border-[#D6CDBC] dark:border-[#384232] transition cursor-pointer"
                        title="Previous Week"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#F5F1E9] dark:bg-[#1E2419] rounded-xl border border-[#D6CDBC] dark:border-[#384232]">
                        <Calendar size={14} className="text-[#B9955B]" />
                        <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] uppercase tracking-wider">
                            Week of {weekStart}
                        </span>
                        {data && (
                            <span className="text-[10px] text-[#777367]">
                                ({data.weekStart} to {data.weekEnd})
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setWeekStart(prev => addDaysStr(prev, 7))}
                        className="p-2 rounded-xl bg-[#F5F1E9] dark:bg-[#1E2419] text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] border border-[#D6CDBC] dark:border-[#384232] transition cursor-pointer"
                        title="Next Week"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <button
                        onClick={() => setWeekStart(mondayOf())}
                        className="px-3 py-1.5 text-xs font-bold text-[#B9955B] hover:text-[#A17D45] transition cursor-pointer"
                    >
                        Current Week
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Admin/Manager Employee Picker: filter out ADMIN, show proper role and team */}
                    {(role === 'ADMIN' || role === 'MANAGER') && (
                        <select
                            value={selectedEmployeeId || (data?.employeeId || '')}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className="text-xs font-semibold bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl px-3.5 py-2 text-[#29291F] dark:text-[#F5F1E9] outline-none focus:border-[#B9955B] cursor-pointer"
                        >
                            <option value="">Select Employee...</option>
                            {employees
                                .filter(emp => (emp.role || 'EMPLOYEE').toUpperCase() !== 'ADMIN')
                                .map(emp => {
                                    const team = typeof emp.team === 'object' ? emp.team?.name : emp.team;
                                    const teamLabel = team && team !== 'Unassigned' && team !== 'General' ? team : null;
                                    const roleUpper = (emp.role || 'EMPLOYEE').toUpperCase();
                                    const roleLabel = roleUpper === 'MANAGER' ? 'Manager' : 'Employee';
                                    const displayInfo = teamLabel ? `${roleLabel} • ${teamLabel}` : roleLabel;
                                    return (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.fullName || emp.name} ({displayInfo})
                                        </option>
                                    );
                                })}
                        </select>
                    )}

                    {(role === 'ADMIN' || role === 'MANAGER') && (
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#F5F1E9] dark:bg-[#1E2419] text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] rounded-xl transition border border-[#D6CDBC] dark:border-[#384232] cursor-pointer shadow-warm-xs"
                        >
                            <Download size={13} className="text-[#B9955B]" />
                            Payroll CSV
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center text-[#777367] gap-2 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232]">
                    <Loader2 size={28} className="animate-spin text-[#B9955B]" />
                    <span className="text-xs font-bold">Calculating timesheet hours...</span>
                </div>
            ) : !data ? (
                <div className="p-12 text-center text-[#777367] bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232]">
                    No timesheet records found for this period.
                </div>
            ) : (
                <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs p-6 space-y-6">
                    {/* Header: Employee Info + Status + Metrics + Action */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#D6CDBC]/70 dark:border-[#384232]">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="font-serif text-2xl font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                    {data.employeeName}
                                </h2>
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${STATUS_BADGE[data.status] || STATUS_BADGE.DRAFT}`}>
                                    {data.status}
                                </span>
                                {data.overThreshold && (
                                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#FAF0E1] text-[#C98A3C] border border-[#E8D4B8]">
                                        <AlertTriangle size={11} /> {fmtH(data.overtimeMinutes)} OT
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[#777367] mt-1">
                                Team: <span className="font-semibold text-[#29291F] dark:text-[#F5F1E9]">{data.teamName}</span> · Rate: <span className="font-semibold text-[#29291F] dark:text-[#F5F1E9]">{fmtMoney(data.hourlyRate)}/h</span>
                            </p>
                        </div>

                        {/* Top Metrics Rollup */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
                                <Clock size={16} className="text-[#B9955B]" />
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-[#777367] tracking-wider">Total Hours</div>
                                    <div className="text-sm font-bold text-[#29291F] dark:text-[#F5F1E9] tabular-nums">{fmtH(data.totalMinutes)}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
                                <DollarSign size={16} className="text-[#5E7D64]" />
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-[#777367] tracking-wider">Total Pay</div>
                                    <div className="text-sm font-bold text-[#5E7D64] tabular-nums">{fmtMoney(data.totalPay)}</div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            {(data.status === 'DRAFT' || data.status === 'REJECTED') && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || data.totalMinutes === 0}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] font-semibold text-xs uppercase tracking-wider shadow-warm-xs transition disabled:opacity-50 cursor-pointer active:scale-95"
                                >
                                    {submitting ? <Loader2 size={14} className="animate-spin text-[#D3B98D]" /> : <Send size={14} className="text-[#D3B98D]" />}
                                    <span>{data.status === 'REJECTED' ? 'Resubmit for Approval' : 'Submit for Approval'}</span>
                                </button>
                            )}

                            {data.status === 'SUBMITTED' && (
                                <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF0E1] text-[#C98A3C] text-xs font-bold border border-[#E8D4B8]">
                                    <Clock size={13} />
                                    Submitted · Awaiting Review
                                </span>
                            )}

                            {data.status === 'APPROVED' && (
                                <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EAEFEA] text-[#5E7D64] text-xs font-bold border border-[#C5D7C7]">
                                    <CheckCircle2 size={13} />
                                    Approved & Locked
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Rejection Alert Banner */}
                    {data.status === 'REJECTED' && data.approvals && data.approvals.length > 0 && (
                        <div className="p-4 rounded-xl bg-[#FAF3F2] border border-[#F2D6D3] flex items-start gap-3">
                            <XCircle size={18} className="text-[#A84B4B] shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A84B4B]">
                                    Timesheet Rejected by {data.approvals[0].approverName}
                                </h4>
                                <p className="text-xs text-[#A84B4B] mt-1 font-medium italic">
                                    “{data.approvals[0].comment || 'Please review your daily attendance and resubmit.'}”
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 7-Day Weekly Grid (Punchcard Layout) */}
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#777367] mb-3 flex items-center justify-between">
                            <span>Daily Breakdown (Monday to Sunday)</span>
                            <span className="text-[10px] text-[#777367] font-semibold">Regular: {fmtH(data.regularMinutes)} · OT: {fmtH(data.overtimeMinutes)}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                            {data.days.map((day) => {
                                const dayDate = new Date(day.date + 'T00:00:00Z');
                                const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
                                const dateFormatted = day.date.slice(5); // MM-DD
                                const isHeavy = day.minutes > 480; // > 8h

                                return (
                                    <div
                                        key={day.date}
                                        onClick={() => day.sessions.length > 0 && setActiveDayModal(day)}
                                        className={`rounded-xl border p-3 flex flex-col justify-between min-h-[140px] transition-all ${
                                            day.sessions.length > 0 ? 'cursor-pointer hover:border-[#B9955B] hover:shadow-warm-xs' : ''
                                        } ${
                                            isHeavy
                                                ? 'bg-[#FAF0E1] border-[#E8D4B8]'
                                                : day.minutes > 0
                                                ? 'bg-[#F5F1E9] dark:bg-[#1E2419] border-[#D6CDBC] dark:border-[#384232]'
                                                : 'bg-[#F5F1E9]/70 dark:bg-[#1E2419]/70 border-[#D6CDBC]/60 dark:border-[#384232]/60 opacity-80'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between pb-2 border-b border-[#D6CDBC]/60 dark:border-[#384232]">
                                            <span className="font-serif text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">{dayName}</span>
                                            <span className="text-[10px] font-bold text-[#777367]">{dateFormatted}</span>
                                        </div>

                                        <div className="my-2">
                                            <div className="text-base font-bold text-[#29291F] dark:text-[#F5F1E9] tabular-nums">
                                                {day.minutes > 0 ? fmtH(day.minutes) : <span className="text-[#C5BEAF] text-sm">—</span>}
                                            </div>
                                            {isHeavy && (
                                                <span className="text-[9px] font-bold text-[#C98A3C] flex items-center gap-0.5 mt-0.5">
                                                    <AlertTriangle size={10} /> {fmtH(day.minutes - 480)} OT
                                                </span>
                                            )}
                                        </div>

                                        {/* Session items list */}
                                        <div className="space-y-1 mt-auto">
                                            {day.sessions.slice(0, 3).map((sess, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={(e) => { e.stopPropagation(); setActiveDayModal(day); }}
                                                    className="text-[9px] font-medium text-[#777367] truncate flex items-center justify-between gap-1 bg-[#EEE8DD] dark:bg-[#252B20] px-1.5 py-0.5 rounded border border-[#D6CDBC]/70 dark:border-[#384232] hover:border-[#B9955B] transition cursor-pointer"
                                                    title={sess.type === 'attendance' ? `Clocked: ${fmtTimeShort(sess.clockIn)} - ${sess.clockOut ? fmtTimeShort(sess.clockOut) : 'Now'} (${fmtDurShort(sess)})` : `Manual: ${sess.note}`}
                                                >
                                                    <div className="flex items-center gap-1 truncate">
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sess.type === 'attendance' ? 'bg-[#5E7D64]' : 'bg-[#B9955B]'}`} />
                                                        <span className="truncate">
                                                            {fmtTimeShort(sess.clockIn || sess.startTime)}
                                                            {sess.clockOut ? ` - ${fmtTimeShort(sess.clockOut)}` : (sess.isLive ? ' - Now' : '')}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-[#B9955B] shrink-0 text-[8px] tabular-nums">
                                                        {fmtDurShort(sess)}
                                                    </span>
                                                </div>
                                            ))}
                                            {day.sessions.length > 3 && (
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); setActiveDayModal(day); }}
                                                    className="text-[8px] text-[#B9955B] hover:text-[#A17D45] font-bold text-center cursor-pointer pt-0.5"
                                                >
                                                    +{day.sessions.length - 3} more (View all)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Day Attendance Breakdown Modal */}
                    {activeDayModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-[#F5F1E9] dark:bg-[#1E2419] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#D6CDBC] dark:border-[#384232] space-y-4 max-h-[85vh] flex flex-col">
                                <div className="flex items-center justify-between pb-3 border-b border-[#D6CDBC]/70 dark:border-[#384232]">
                                    <div>
                                        <h3 className="font-serif text-lg font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                            Real Database Sessions Breakdown
                                        </h3>
                                        <p className="text-xs text-[#777367] mt-0.5">
                                            {new Date(activeDayModal.date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                                            {' · '}
                                            <span className="font-bold text-[#29291F] dark:text-[#F5F1E9]">Total: {fmtH(activeDayModal.minutes)}</span>
                                            {' · '}
                                            <span className="font-semibold text-[#5E7D64]">{activeDayModal.sessions.length} Recorded Sessions</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveDayModal(null)}
                                        className="w-8 h-8 rounded-full hover:bg-[#E5DDCF] dark:hover:bg-[#252B20] flex items-center justify-center text-[#777367] font-bold cursor-pointer transition"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="overflow-y-auto flex-1 pr-1">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-[#EEE8DD] dark:bg-[#252B20] text-[#777367] text-[10px] uppercase tracking-wider font-bold border-b border-[#D6CDBC]/70 dark:border-[#384232]">
                                            <tr>
                                                <th className="p-2.5 rounded-l-lg">#</th>
                                                <th className="p-2.5">Type</th>
                                                <th className="p-2.5">Clock In</th>
                                                <th className="p-2.5">Clock Out</th>
                                                <th className="p-2.5">Duration</th>
                                                <th className="p-2.5 rounded-r-lg">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#D6CDBC]/50 dark:divide-[#384232]">
                                            {activeDayModal.sessions.map((sess, idx) => {
                                                const inTime = sess.clockIn ? new Date(sess.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (sess.startTime ? new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--');
                                                const outTime = sess.clockOut ? new Date(sess.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (sess.endTime ? new Date(sess.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (sess.isLive ? 'Active' : '--'));
                                                const durationStr = sess.isLive ? 'In Progress' : (sess.minutes >= 60 ? `${Math.floor(sess.minutes / 60)}h ${sess.minutes % 60}m` : (sess.minutes > 0 ? `${sess.minutes}m` : (sess.durationSeconds ? `${sess.durationSeconds}s` : '<1m')));
                                                return (
                                                    <tr key={sess.id || idx} className="hover:bg-[#EEE8DD]/50 dark:hover:bg-[#252B20]/50 transition">
                                                        <td className="p-2.5 font-bold text-[#777367]">{idx + 1}</td>
                                                        <td className="p-2.5">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${sess.type === 'attendance' ? 'bg-[#EAEFEA] text-[#5E7D64]' : 'bg-[#FAF0E1] text-[#C98A3C]'}`}>
                                                                {sess.type === 'attendance' ? 'Attendance' : (sess.note || 'Manual')}
                                                            </span>
                                                        </td>
                                                        <td className="p-2.5 font-semibold text-[#29291F] dark:text-[#F5F1E9] tabular-nums">{inTime}</td>
                                                        <td className="p-2.5 font-semibold text-[#29291F] dark:text-[#F5F1E9] tabular-nums">{outTime}</td>
                                                        <td className="p-2.5 font-bold text-[#B9955B] tabular-nums">{durationStr}</td>
                                                        <td className="p-2.5">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${sess.isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-[#EEE8DD] text-[#777367]'}`}>
                                                                {sess.isLive ? 'Working' : 'Completed'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="pt-3 border-t border-[#D6CDBC]/70 dark:border-[#384232] flex justify-end">
                                    <button
                                        onClick={() => setActiveDayModal(null)}
                                        className="px-4 py-2 rounded-xl bg-[#30382B] text-white text-xs font-semibold hover:bg-[#3C4536] transition cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Audit History Timeline */}
                    {data.approvals && data.approvals.length > 0 && (
                        <div className="pt-4 border-t border-[#D6CDBC]/70 dark:border-[#384232]">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#777367] mb-3 flex items-center gap-1.5">
                                <History size={13} className="text-[#B9955B]" /> Approval & Audit History
                            </h4>
                            <div className="divide-y divide-[#D6CDBC]/50 dark:divide-[#384232]">
                                {data.approvals.map((appr) => (
                                    <div key={appr.id} className="py-2.5 flex flex-wrap items-center justify-between text-xs gap-2">
                                        <div className="flex items-center gap-2">
                                            {appr.decision === 'APPROVED' ? (
                                                <CheckCircle2 size={14} className="text-[#5E7D64]" />
                                            ) : (
                                                <XCircle size={14} className="text-[#A84B4B]" />
                                            )}
                                            <span className="font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                                {appr.decision}
                                            </span>
                                            <span className="text-[#777367]">by</span>
                                            <span className="font-semibold text-[#29291F] dark:text-[#F5F1E9]">{appr.approverName}</span>
                                            {appr.comment && (
                                                <span className="text-[#777367] italic">“{appr.comment}”</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-[#777367]">
                                            {new Date(appr.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
