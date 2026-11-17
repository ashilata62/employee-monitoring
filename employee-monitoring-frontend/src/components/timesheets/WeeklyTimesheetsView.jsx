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
    FileText,
    Loader2
} from 'lucide-react';
import { timesheetService, mondayOf, addDaysStr, fmtMoney, fmtH } from '../../services/timesheetService';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../utils/toastManager';

const STATUS_BADGE = {
    DRAFT: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    SUBMITTED: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    APPROVED: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    REJECTED: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
};

export function WeeklyTimesheetsView({ employees = [] }) {
    const { role, user } = useAuthStore();
    const [weekStart, setWeekStart] = useState(() => mondayOf());
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Initial load and filter change
    const loadTimesheet = async () => {
        setLoading(true);
        try {
            const empId = role === 'EMPLOYEE' ? null : (selectedEmployeeId || null);
            const res = await timesheetService.getWeek(weekStart, empId);
            if (res.success) {
                // If single employee or array
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
                toast.success('Timesheet submitted for manager approval! 🚀');
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
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setWeekStart(prev => addDaysStr(prev, -7))}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title="Previous Week"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Calendar size={14} className="text-primary-600 dark:text-primary-400" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            Week of {weekStart}
                        </span>
                        {data && (
                            <span className="text-[10px] text-slate-400">
                                ({data.weekStart} to {data.weekEnd})
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setWeekStart(prev => addDaysStr(prev, 7))}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title="Next Week"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <button
                        onClick={() => setWeekStart(mondayOf())}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition"
                    >
                        Current Week
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Admin/Manager Employee Picker */}
                    {(role === 'ADMIN' || role === 'MANAGER') && employees.length > 0 && (
                        <select
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 outline-none focus:border-primary-500"
                        >
                            <option value="">Select Employee...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.fullName || emp.name} ({emp.team?.name || 'General'})
                                </option>
                            ))}
                        </select>
                    )}

                    {(role === 'ADMIN' || role === 'MANAGER') && (
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700"
                        >
                            <Download size={13} />
                            Payroll CSV
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <Loader2 size={28} className="animate-spin text-primary-600" />
                    <span className="text-xs font-bold">Calculating timesheet hours...</span>
                </div>
            ) : !data ? (
                <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    No timesheet records found for this period.
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
                    {/* Header: Employee Info + Status + Metrics + Action */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                    {data.employeeName}
                                </h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_BADGE[data.status] || STATUS_BADGE.DRAFT}`}>
                                    {data.status}
                                </span>
                                {data.overThreshold && (
                                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        <AlertTriangle size={11} /> {fmtH(data.overtimeMinutes)} OT
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Team: <span className="font-semibold text-slate-600 dark:text-slate-300">{data.teamName}</span> · Rate: <span className="font-semibold text-slate-600 dark:text-slate-300">{fmtMoney(data.hourlyRate)}/h</span>
                            </p>
                        </div>

                        {/* Top Metrics Rollup */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <Clock size={14} className="text-primary-500" />
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Hours</div>
                                    <div className="text-sm font-black text-slate-800 dark:text-slate-100">{fmtH(data.totalMinutes)}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <DollarSign size={14} className="text-emerald-500" />
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Pay</div>
                                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{fmtMoney(data.totalPay)}</div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            {(data.status === 'DRAFT' || data.status === 'REJECTED') && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || data.totalMinutes === 0}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-black text-xs uppercase tracking-wider shadow-sm shadow-primary-600/30 transition disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    {data.status === 'REJECTED' ? 'Resubmit for Approval' : 'Submit for Approval'}
                                </button>
                            )}

                            {data.status === 'SUBMITTED' && (
                                <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-500/20">
                                    <Clock size={13} />
                                    Submitted · Awaiting Review
                                </span>
                            )}

                            {data.status === 'APPROVED' && (
                                <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20">
                                    <CheckCircle2 size={13} />
                                    Approved & Locked
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Rejection Alert Banner */}
                    {data.status === 'REJECTED' && data.approvals && data.approvals.length > 0 && (
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-3">
                            <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                    Timesheet Rejected by {data.approvals[0].approverName}
                                </h4>
                                <p className="text-xs text-rose-600 dark:text-rose-300 mt-1 font-medium italic">
                                    “{data.approvals[0].comment || 'Please review your daily attendance and resubmit.'}”
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 7-Day Weekly Grid (Punchcard Layout) */}
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                            <span>Daily Breakdown (Monday to Sunday)</span>
                            <span className="text-[10px] text-slate-400 font-normal">Regular: {fmtH(data.regularMinutes)} · OT: {fmtH(data.overtimeMinutes)}</span>
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
                                        className={`rounded-xl border p-3 flex flex-col justify-between min-h-[140px] transition ${
                                            isHeavy
                                                ? 'bg-amber-500/5 border-amber-500/30'
                                                : day.minutes > 0
                                                ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{dayName}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{dateFormatted}</span>
                                        </div>

                                        <div className="my-2">
                                            <div className="text-lg font-black text-slate-900 dark:text-white">
                                                {day.minutes > 0 ? fmtH(day.minutes) : <span className="text-slate-300 dark:text-slate-700 text-sm font-bold">—</span>}
                                            </div>
                                            {isHeavy && (
                                                <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5 mt-0.5">
                                                    <AlertTriangle size={10} /> {fmtH(day.minutes - 480)} OT
                                                </span>
                                            )}
                                        </div>

                                        {/* Session items list */}
                                        <div className="space-y-1 mt-auto">
                                            {day.sessions.slice(0, 3).map((sess, idx) => (
                                                <div
                                                    key={idx}
                                                    className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 bg-white dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700/50"
                                                    title={sess.type === 'attendance' ? `Clocked: ${new Date(sess.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : `Manual: ${sess.note}`}
                                                >
                                                    <span className={`w-1 h-1 rounded-full ${sess.type === 'attendance' ? 'bg-primary-500' : 'bg-violet-500'}`} />
                                                    {sess.type === 'attendance'
                                                        ? `${new Date(sess.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                        : (sess.note || 'Manual')}
                                                </div>
                                            ))}
                                            {day.sessions.length > 3 && (
                                                <div className="text-[8px] text-slate-400 font-bold text-center">
                                                    +{day.sessions.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Audit History Timeline */}
                    {data.approvals && data.approvals.length > 0 && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                <History size={13} /> Approval & Audit History
                            </h4>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {data.approvals.map((appr) => (
                                    <div key={appr.id} className="py-2.5 flex flex-wrap items-center justify-between text-xs gap-2">
                                        <div className="flex items-center gap-2">
                                            {appr.decision === 'APPROVED' ? (
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                            ) : (
                                                <XCircle size={14} className="text-rose-500" />
                                            )}
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {appr.decision}
                                            </span>
                                            <span className="text-slate-400">by</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{appr.approverName}</span>
                                            {appr.comment && (
                                                <span className="text-slate-500 italic">“{appr.comment}”</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400">
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
