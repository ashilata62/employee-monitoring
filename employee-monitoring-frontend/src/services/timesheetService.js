import api from './apiClient';

export const timesheetService = {
    /**
     * Get weekly timesheet data
     */
    getWeek: async (weekStart, employeeId = null, teamId = null) => {
        const params = {};
        if (weekStart) params.week_start = weekStart;
        if (employeeId) params.employee_id = employeeId;
        if (teamId) params.team_id = teamId;
        const res = await api.get('/timesheets/week', { params });
        return res.data;
    },

    /**
     * Submit timesheet for approval
     */
    submit: async (weekStart, employeeId = null) => {
        const res = await api.post('/timesheets/submit', {
            week_start: weekStart,
            employee_id: employeeId
        });
        return res.data;
    },

    /**
     * Get pending approvals queue (Manager/Admin)
     */
    getApprovalQueue: async (status = null) => {
        const params = {};
        if (status && status !== 'ALL') params.status = status;
        const res = await api.get('/timesheets/approvals/queue', { params });
        return res.data;
    },

    /**
     * Approve single timesheet
     */
    approve: async (timesheetId, comment = 'Approved') => {
        const res = await api.post(`/timesheets/${timesheetId}/approve`, { comment });
        return res.data;
    },

    /**
     * Reject single timesheet with mandatory comment
     */
    reject: async (timesheetId, comment) => {
        const res = await api.post(`/timesheets/${timesheetId}/reject`, { comment });
        return res.data;
    },

    /**
     * Reopen / Unlock timesheet (Admin/Manager)
     */
    reopen: async (timesheetId, reason = 'Unlocked by Administrator') => {
        const res = await api.post(`/timesheets/${timesheetId}/reopen`, { reason });
        return res.data;
    },

    /**
     * Bulk approve timesheets
     */
    bulkApprove: async (timesheetIds) => {
        const res = await api.post('/timesheets/bulk-approve', { ids: timesheetIds });
        return res.data;
    },

    /**
     * Download Payroll CSV
     */
    exportPayrollCsv: async (weekStart) => {
        const res = await api.get('/timesheets/export-csv', {
            params: { week_start: weekStart },
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `payroll-${weekStart}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};

// Date & format helper utilities adapting Punchcard logic
export function mondayOf(d = new Date()) {
    const date = typeof d === 'string' ? new Date(d + 'T00:00:00Z') : new Date(d);
    const day = date.getUTCDay();
    const diff = (day + 6) % 7;
    date.setUTCDate(date.getUTCDate() - diff);
    return date.toISOString().slice(0, 10);
}

export function addDaysStr(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

export function fmtMoney(val) {
    const num = Number(val) || 0;
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtH(min) {
    const m = Number(min) || 0;
    return (m / 60).toFixed(1) + 'h';
}
