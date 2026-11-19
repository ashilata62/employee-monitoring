import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Check,
    X,
    AlertTriangle,
    Download,
    Loader2,
    Calendar,
    ShieldAlert,
    Clock,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { timesheetService, fmtMoney, fmtH } from '../../services/timesheetService';
import { toast } from '../../utils/toastManager';
import { cn } from '../../utils/cn';

export function ApprovalsQueueView() {
    const [queue, setQueue] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

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

    const pendingList = useMemo(() => queue.filter(q => q.status === 'SUBMITTED'), [queue]);
    const approvedList = useMemo(() => queue.filter(q => q.status === 'APPROVED'), [queue]);
    const rejectedList = useMemo(() => queue.filter(q => q.status === 'REJECTED'), [queue]);

    const displayedQueue = useMemo(() => {
        if (filterStatus === 'SUBMITTED') return pendingList;
        if (filterStatus === 'APPROVED') return approvedList;
        if (filterStatus === 'REJECTED') return rejectedList;
        return queue;
    }, [queue, filterStatus, pendingList, approvedList, rejectedList]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelected(pendingList.map(q => q.timesheetId));
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
            const res = await timesheetService.reject(rejectModal.timesheet.timesheetId, rejectModal.comment.trim());
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
            await timesheetService.exportPayrollCsv();
            toast.success('Payroll CSV downloaded');
        } catch (err) {
            toast.error('Failed to export payroll CSV');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Bulk Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#EEE8DD] dark:bg-[#252B20] p-4 rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-serif text-base font-bold text-[#29291F] dark:text-[#F5F1E9] uppercase tracking-wider flex items-center gap-2.5">
                        <span>Approval Queue</span>
                    </h2>

                    {/* Filter Status Tabs */}
                    <div className="flex items-center gap-1 bg-[#F5F1E9] dark:bg-[#1E2419] p-1 rounded-xl border border-[#D6CDBC] dark:border-[#384232]">
                        <button
                            type="button"
                            onClick={() => setFilterStatus('ALL')}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer",
                                filterStatus === 'ALL'
                                    ? "bg-[#30382B] text-[#FDFBF7] shadow-warm-xs"
                                    : "text-[#777367] dark:text-[#B8B3A7] hover:text-[#29291F]"
                            )}
                        >
                            All ({queue.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('SUBMITTED')}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1",
                                filterStatus === 'SUBMITTED'
                                    ? "bg-[#FAF0E1] text-[#C98A3C] border border-[#E8D4B8]"
                                    : "text-[#777367] dark:text-[#B8B3A7] hover:text-[#C98A3C]"
                            )}
                        >
                            Pending ({pendingList.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('APPROVED')}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1",
                                filterStatus === 'APPROVED'
                                    ? "bg-[#EAEFEA] text-[#5E7D64] border border-[#C5D7C7]"
                                    : "text-[#777367] dark:text-[#B8B3A7] hover:text-[#5E7D64]"
                            )}
                        >
                            Approved ({approvedList.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('REJECTED')}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1",
                                filterStatus === 'REJECTED'
                                    ? "bg-[#FAF3F2] text-[#A84B4B] border border-[#F2D6D3]"
                                    : "text-[#777367] dark:text-[#B8B3A7] hover:text-[#A84B4B]"
                            )}
                        >
                            Rejected ({rejectedList.length})
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {selected.length > 0 && (
                        <button
                            onClick={handleBulkApprove}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] text-xs font-semibold uppercase tracking-wider transition shadow-warm-xs disabled:opacity-50 cursor-pointer active:scale-95"
                        >
                            <Check size={14} className="text-[#D3B98D]" />
                            Approve {selected.length} Selected
                        </button>
                    )}

                    <button
                        onClick={handleDownloadPayroll}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#F5F1E9] dark:bg-[#1E2419] text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] rounded-xl transition border border-[#D6CDBC] dark:border-[#384232] cursor-pointer shadow-warm-xs"
                    >
                        <Download size={13} className="text-[#B9955B]" />
                        Payroll CSV
                    </button>
                </div>
            </div>

            {/* Queue Table */}
            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center text-[#777367] dark:text-[#B8B3A7] gap-2 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232]">
                    <Loader2 size={28} className="animate-spin text-[#B9955B]" />
                    <span className="text-xs font-bold">Loading approval queue...</span>
                </div>
            ) : displayedQueue.length === 0 ? (
                <div className="p-16 text-center bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
                    <div className="text-3xl mb-2">🎉</div>
                    <h3 className="font-serif text-xl font-normal text-[#29291F] dark:text-[#F5F1E9]">
                        {filterStatus === 'ALL' ? 'Queue is Clear' : `No ${filterStatus.toLowerCase()} timesheets`}
                    </h3>
                    <p className="text-xs text-[#777367] dark:text-[#B8B3A7] mt-1">
                        {filterStatus === 'SUBMITTED' 
                            ? 'There are currently no timesheets awaiting approval.' 
                            : 'No records matching the selected filter.'}
                    </p>
                </div>
            ) : (
                <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#D6CDBC]/70 dark:border-[#384232] bg-[#E5DDCF]/60 dark:bg-[#1E2419] text-[10px] font-bold uppercase tracking-[0.14em] text-[#777367] dark:text-[#B8B3A7]">
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selected.length === pendingList.length && pendingList.length > 0}
                                        onChange={handleSelectAll}
                                        disabled={pendingList.length === 0}
                                        className="rounded border-[#D6CDBC] text-[#30382B] focus:ring-[#B9955B] disabled:opacity-30"
                                        title={pendingList.length > 0 ? "Select all pending" : "No pending items to select"}
                                    />
                                </th>
                                <th className="p-4">Employee</th>
                                <th className="p-4">Team</th>
                                <th className="p-4">Week Period</th>
                                <th className="p-4">Regular</th>
                                <th className="p-4">Overtime</th>
                                <th className="p-4">Total Pay</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D6CDBC]/50 dark:divide-[#384232] text-xs">
                            {displayedQueue.map((ts) => {
                                const isChecked = selected.includes(ts.timesheetId);
                                const isPending = ts.status === 'SUBMITTED';

                                return (
                                    <tr
                                        key={ts.timesheetId}
                                        className={`hover:bg-[#F5F1E9]/60 dark:hover:bg-[#1E2419]/60 transition ${
                                            isChecked ? 'bg-[#FAF0E1]/50 dark:bg-[#30382B]/50' : ''
                                        }`}
                                    >
                                        <td className="p-4">
                                            {isPending ? (
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleToggleSelect(ts.timesheetId)}
                                                    className="rounded border-[#D6CDBC] text-[#30382B] focus:ring-[#B9955B]"
                                                />
                                            ) : (
                                                <span className="text-[#C5BEAF] dark:text-[#505A4A]">—</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                            <div>{ts.employeeName}</div>
                                            <div className="text-[10px] text-[#777367] dark:text-[#B8B3A7] font-normal">{ts.employeeEmail}</div>
                                        </td>
                                        <td className="p-4 text-[#777367] dark:text-[#B8B3A7] font-medium">
                                            {ts.teamName || 'General'}
                                        </td>
                                        <td className="p-4 text-[#777367] dark:text-[#B8B3A7] font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} className="text-[#B9955B]" />
                                                <span>{ts.weekStart}</span>
                                            </div>
                                            <div className="text-[10px] text-[#777367] dark:text-[#B8B3A7]">
                                                Submitted {new Date(ts.submittedAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-[#29291F] dark:text-[#F5F1E9] tabular-nums">
                                            {fmtH(ts.regularMinutes)}
                                        </td>
                                        <td className="p-4 font-semibold">
                                            {ts.overtimeMinutes > 0 ? (
                                                <span className="text-[#C98A3C] dark:text-[#E5B56D] font-bold flex items-center gap-1 tabular-nums">
                                                    <AlertTriangle size={11} /> +{fmtH(ts.overtimeMinutes)}
                                                </span>
                                            ) : (
                                                <span className="text-[#777367] dark:text-[#B8B3A7]">0h</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-bold text-[#5E7D64] dark:text-[#8BB394] tabular-nums">
                                            {fmtMoney(ts.totalPay)}
                                        </td>
                                        <td className="p-4">
                                            {ts.status === 'APPROVED' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EAEFEA] dark:bg-[#1E2B20] text-[#5E7D64] dark:text-[#8BB394] border border-[#C5D7C7] dark:border-[#325238]">
                                                    <CheckCircle2 size={12} />
                                                    Approved
                                                </span>
                                            )}
                                            {ts.status === 'REJECTED' && (
                                                <div className="flex flex-col">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF3F2] dark:bg-[#2E1E1E] text-[#A84B4B] dark:text-[#E07A7A] border border-[#F2D6D3] dark:border-[#572E2E]">
                                                        <XCircle size={12} />
                                                        Rejected
                                                    </span>
                                                    {ts.approvals && ts.approvals[0]?.comment && (
                                                        <span className="text-[10px] text-[#A84B4B] dark:text-[#E07A7A] italic mt-0.5 truncate max-w-[150px]" title={ts.approvals[0].comment}>
                                                            "{ts.approvals[0].comment}"
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {ts.status === 'SUBMITTED' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF0E1] dark:bg-[#2C2415] text-[#C98A3C] dark:text-[#E5B56D] border border-[#E8D4B8] dark:border-[#5C4A28]">
                                                    <Clock size={12} />
                                                    Pending Review
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {isPending ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApproveSingle(ts)}
                                                        disabled={actionLoading}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] font-semibold text-xs transition disabled:opacity-50 cursor-pointer shadow-warm-xs"
                                                        title="Approve Timesheet"
                                                    >
                                                        <Check size={13} className="text-[#D3B98D]" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectModal({ open: true, timesheet: ts, comment: '' })}
                                                        disabled={actionLoading}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF3F2] dark:bg-[#2E1E1E] hover:bg-[#F5E4E2] dark:hover:bg-[#3B2626] text-[#A84B4B] dark:text-[#E07A7A] border border-[#F2D6D3] dark:border-[#572E2E] font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
                                                        title="Reject Timesheet"
                                                    >
                                                        <X size={13} />
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2 text-[11px] text-[#777367] dark:text-[#B8B3A7]">
                                                    {ts.status === 'APPROVED' ? (
                                                        <span>By {ts.approvals?.[0]?.approverName || 'Admin'}</span>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span>By {ts.approvals?.[0]?.approverName || 'Admin'}</span>
                                                            <button
                                                                onClick={() => handleApproveSingle(ts)}
                                                                disabled={actionLoading}
                                                                className="text-[#5E7D64] hover:underline font-semibold cursor-pointer"
                                                                title="Change decision to Approved"
                                                            >
                                                                Re-approve
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Reject Modal Dialog - Rendered via Portal to cover full viewport including top Header */}
            {rejectModal.open && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-lg p-6 space-y-4">
                        <div className="flex items-center gap-3 text-[#A84B4B] dark:text-[#E07A7A]">
                            <div className="p-2.5 rounded-xl bg-[#FAF3F2] dark:bg-[#2E1E1E] border border-[#F2D6D3] dark:border-[#572E2E]">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h3 className="font-serif text-lg font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                    Reject Timesheet
                                </h3>
                                <p className="text-xs text-[#777367] dark:text-[#B8B3A7]">
                                    {rejectModal.timesheet?.employeeName} · Week of {rejectModal.timesheet?.weekStart}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#777367] dark:text-[#B8B3A7] mb-1.5">
                                Rejection Reason / Audit Note <span className="text-[#A84B4B] dark:text-[#E07A7A]">*</span>
                            </label>
                            <textarea
                                rows={3}
                                autoFocus
                                placeholder="Explain why this timesheet is being rejected (e.g. Missing punch on Wednesday, Overtime needs pre-approval)..."
                                value={rejectModal.comment}
                                onChange={(e) => setRejectModal(prev => ({ ...prev, comment: e.target.value }))}
                                className="w-full text-xs rounded-xl bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] p-3 text-[#29291F] dark:text-[#F5F1E9] outline-none focus:border-[#B9955B] resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setRejectModal({ open: false, timesheet: null, comment: '' })}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#777367] dark:text-[#B8B3A7] hover:text-[#29291F] dark:hover:text-[#F5F1E9] transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReject}
                                disabled={actionLoading || !rejectModal.comment.trim()}
                                className="px-4 py-2 rounded-xl bg-[#A84B4B] hover:bg-[#913D3D] text-[#FDFBF7] font-semibold text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer shadow-warm-xs"
                            >
                                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
