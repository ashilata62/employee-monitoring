import React, { useState, useEffect } from 'react';
import {
    Check,
    X,
    CheckSquare,
    AlertTriangle,
    Download,
    Clock,
    User,
    Loader2,
    Calendar,
    MessageSquare,
    ShieldAlert
} from 'lucide-react';
import { timesheetService, fmtMoney, fmtH, mondayOf } from '../../services/timesheetService';
import { toast } from '../../utils/toastManager';

export function ApprovalsQueueView() {
    const [queue, setQueue] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Reject Modal state
    const [rejectModal, setRejectModal] = useState({ open: false, timesheet: null, comment: '' });

    const loadQueue = async () => {
        setLoading(true);
        try {
            const res = await timesheetService.getApprovalQueue();
            if (res.success) {
                setQueue(res.data || []);
            }
        } catch (err) {
            console.error('Failed to load approval queue:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQueue();
    }, []);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelected(queue.map(q => q.timesheetId));
        } else {
            setSelected([]);
        }
    };

    const handleToggleSelect = (id) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleApproveSingle = async (ts) => {
        setActionLoading(true);
        try {
            const res = await timesheetService.approve(ts.timesheetId, 'Approved');
            if (res.success) {
                toast.success(`Timesheet for ${ts.employeeName} approved!`);
                loadQueue();
                setSelected(prev => prev.filter(i => i !== ts.timesheetId));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Approval failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkApprove = async () => {
        if (selected.length === 0) return;
        setActionLoading(true);
        try {
            const res = await timesheetService.bulkApprove(selected);
            if (res.success) {
                toast.success(`${res.data.approvedCount} timesheet(s) approved!`);
                setSelected([]);
                loadQueue();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Bulk approval failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmReject = async () => {
        if (!rejectModal.timesheet) return;
        if (!rejectModal.comment.trim()) {
            toast.error('A rejection comment is required to explain why this timesheet was rejected.');
            return;
        }

        setActionLoading(true);
        try {
            const res = await timesheetService.reject(rejectModal.timesheet.timesheetId, rejectModal.comment);
            if (res.success) {
                toast.success(`Timesheet for ${rejectModal.timesheet.employeeName} rejected.`);
                setRejectModal({ open: false, timesheet: null, comment: '' });
                loadQueue();
                setSelected(prev => prev.filter(i => i !== rejectModal.timesheet.timesheetId));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Rejection failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadPayroll = async () => {
        try {
            await timesheetService.exportPayrollCsv(mondayOf());
            toast.success('Current week payroll CSV downloaded');
        } catch (err) {
            toast.error('Failed to export payroll CSV');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Bulk Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <span>Approval Queue</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                            {queue.length} Pending
                        </span>
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    {selected.length > 0 && (
                        <button
                            onClick={handleBulkApprove}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition shadow-sm shadow-emerald-600/30 disabled:opacity-50"
                        >
                            <Check size={14} />
                            Approve {selected.length} Selected
                        </button>
                    )}

                    <button
                        onClick={handleDownloadPayroll}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700"
                    >
                        <Download size={13} />
                        Payroll CSV
                    </button>
                </div>
            </div>

            {/* Queue Table */}
            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <Loader2 size={28} className="animate-spin text-primary-600" />
                    <span className="text-xs font-bold">Loading approval queue...</span>
                </div>
            ) : queue.length === 0 ? (
                <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="text-3xl mb-2">🎉</div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                        Queue is Clear
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        There are currently no timesheets awaiting approval.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selected.length === queue.length && queue.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </th>
                                <th className="p-4">Employee</th>
                                <th className="p-4">Team</th>
                                <th className="p-4">Week Period</th>
                                <th className="p-4">Regular</th>
                                <th className="p-4">Overtime</th>
                                <th className="p-4">Total Pay</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            {queue.map((ts) => {
                                const isChecked = selected.includes(ts.timesheetId);

                                return (
                                    <tr
                                        key={ts.timesheetId}
                                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition ${
                                            isChecked ? 'bg-primary-50/30 dark:bg-primary-500/5' : ''
                                        }`}
                                    >
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleSelect(ts.timesheetId)}
                                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                                            <div>{ts.employeeName}</div>
                                            <div className="text-[10px] text-slate-400 font-normal">{ts.employeeEmail}</div>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                                            {ts.teamName || 'General'}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} className="text-slate-400" />
                                                <span>{ts.weekStart}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                Submitted {new Date(ts.submittedAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                                            {fmtH(ts.regularMinutes)}
                                        </td>
                                        <td className="p-4 font-semibold">
                                            {ts.overtimeMinutes > 0 ? (
                                                <span className="text-amber-500 font-bold flex items-center gap-1">
                                                    <AlertTriangle size={11} /> +{fmtH(ts.overtimeMinutes)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">0h</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-black text-emerald-600 dark:text-emerald-400">
                                            {fmtMoney(ts.totalPay)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleApproveSingle(ts)}
                                                    disabled={actionLoading}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50"
                                                    title="Approve Timesheet"
                                                >
                                                    <Check size={13} />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => setRejectModal({ open: true, timesheet: ts, comment: '' })}
                                                    disabled={actionLoading}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition disabled:opacity-50"
                                                    title="Reject Timesheet"
                                                >
                                                    <X size={13} />
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Reject Modal Dialog */}
            {rejectModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-500/20">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Reject Timesheet
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {rejectModal.timesheet?.employeeName} · Week of {rejectModal.timesheet?.weekStart}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Rejection Reason / Audit Note <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                autoFocus
                                placeholder="Explain why this timesheet is being rejected (e.g. Missing punch on Wednesday, Overtime needs pre-approval)..."
                                value={rejectModal.comment}
                                onChange={(e) => setRejectModal(prev => ({ ...prev, comment: e.target.value }))}
                                className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500 resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setRejectModal({ open: false, timesheet: null, comment: '' })}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReject}
                                disabled={actionLoading || !rejectModal.comment.trim()}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
                            >
                                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
