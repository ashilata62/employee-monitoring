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
                    {/* Admin/Manager Employee Picker */}
                    {(role === 'ADMIN' || role === 'MANAGER') && employees.length > 0 && (
                        <select
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className="text-xs font-semibold bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl px-3.5 py-2 text-[#29291F] dark:text-[#F5F1E9] outline-none focus:border-[#B9955B] cursor-pointer"
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
                                        className={`rounded-xl border p-3 flex flex-col justify-between min-h-[140px] transition-all ${
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
                                                    className="text-[9px] font-medium text-[#777367] truncate flex items-center gap-1 bg-[#EEE8DD] dark:bg-[#252B20] px-1.5 py-0.5 rounded border border-[#D6CDBC]/70 dark:border-[#384232]"
                                                    title={sess.type === 'attendance' ? `Clocked: ${new Date(sess.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : `Manual: ${sess.note}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sess.type === 'attendance' ? 'bg-[#5E7D64]' : 'bg-[#B9955B]'}`} />
                                                    {sess.type === 'attendance'
                                                        ? `${new Date(sess.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                        : (sess.note || 'Manual')}
                                                </div>
                                            ))}
                                            {day.sessions.length > 3 && (
                                                <div className="text-[8px] text-[#777367] font-bold text-center">
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
