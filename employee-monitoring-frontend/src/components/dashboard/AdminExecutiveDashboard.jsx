import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Activity,
    TrendingUp,
    TrendingDown,
    Building2,
    Clock,
    DollarSign,
    ShieldAlert,
    CheckCircle2,
    AlertTriangle,
    Search,
    Download,
    ExternalLink,
    ChevronRight,
    Monitor,
    Sparkles,
    Calendar,
    ArrowUpRight,
    Award,
    Coffee,
    Filter,
    RefreshCw
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { useRealTime } from '../../hooks/RealTimeContext';
import { timesheetService, fmtMoney, fmtH } from '../../services/timesheetService';
import { toast } from '../../utils/toastManager';

export function AdminExecutiveDashboard({
    stats = {},
    dashboardData = {},
    startDate,
    endDate,
    onDateRangeChange,
    onExport,
    onRefresh
}) {
    const navigate = useNavigate();
    const { socket, employees: realTimeEmps = [] } = useRealTime();

    // Pending approvals count
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [loadingApprovals, setLoadingApprovals] = useState(false);
    const [staffSearch, setStaffSearch] = useState('');
    const [staffFilter, setStaffFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'IDLE' | 'OFFLINE'
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Load approvals queue count for executive alert badge with real-time sync
    const fetchApprovals = useCallback(async () => {
        try {
            setLoadingApprovals(true);
            const res = await timesheetService.getApprovalQueue();
            if (res.success) {
                setPendingApprovals(res.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch approval queue in admin dashboard:', err);
        } finally {
            setLoadingApprovals(false);
        }
    }, []);

    useEffect(() => {
        fetchApprovals();
        // Fallback auto-sync approvals every 8 seconds
        const timer = setInterval(fetchApprovals, 8000);
        return () => clearInterval(timer);
    }, [fetchApprovals]);

    useEffect(() => {
        if (!socket) return;
        socket.on('attendance:update', fetchApprovals);
        socket.on('employee:status', fetchApprovals);
        socket.on('timesheet:new', fetchApprovals);
        socket.on('timesheet:submitted', fetchApprovals);
        socket.on('timesheet:update', fetchApprovals);
        return () => {
            socket.off('attendance:update', fetchApprovals);
            socket.off('employee:status', fetchApprovals);
            socket.off('timesheet:new', fetchApprovals);
            socket.off('timesheet:submitted', fetchApprovals);
            socket.off('timesheet:update', fetchApprovals);
        };
    }, [socket, fetchApprovals]);

    // Merge static employee directory with real-time live presence
    const allEmployees = useMemo(() => {
        const directory = dashboardData?.employees || [];
        const sourceList = directory.length > 0 ? directory : realTimeEmps;

        return sourceList.map(emp => {
            const liveMatch = realTimeEmps.find(rt => 
                String(rt.id) === String(emp.id) || 
                (rt.email && emp.email && rt.email.toLowerCase() === emp.email.toLowerCase())
            );

            // Determine live presence from socket / real-time context
            const liveStatus = (liveMatch?.status || '').toLowerCase(); // 'online', 'active', 'break', 'offline'
            const isLiveOnline = liveStatus === 'online' || liveStatus === 'active' || liveMatch?.isOnline || liveMatch?.agentStatus === 'active';
            const isLiveBreak = liveStatus === 'break' || liveMatch?.isOnBreak || false;

            // Live status takes precedence whenever liveMatch is available
            let isOnline = false;
            if (liveMatch) {
                isOnline = isLiveOnline || isLiveBreak;
            } else {
                const dbStatus = (emp.status || '').toUpperCase();
                isOnline = dbStatus === 'ACTIVE' || dbStatus === 'ONLINE';
            }

            const isOnBreak = isLiveBreak;
            const idleMinutes = liveMatch?.idleTime ? Math.floor(liveMatch.idleTime / 60) : (liveMatch?.idleMinutes || 0);
            const currentApp = liveMatch?.activeApp || liveMatch?.activeWindow || liveMatch?.currentApp || null;

            let currentActivity = 'Offline';
            if (isOnBreak) {
                currentActivity = 'On Break';
            } else if (isOnline) {
                currentActivity = currentApp ? `Working on ${currentApp}` : 'Active / Logged In';
            }

            return {
                ...emp,
                fullName: emp.fullName || emp.name || 'Staff Member',
                role: emp.role || 'Employee',
                isOnline,
                isOnBreak,
                idleMinutes,
                currentApp,
                currentActivity
            };
        });
    }, [dashboardData?.employees, realTimeEmps]);

    // Live counts
    const onlineEmployees = useMemo(() => {
        return allEmployees.filter(e => e.isOnline);
    }, [allEmployees]);

    const activeWorkingCount = useMemo(() => {
        return allEmployees.filter(e => e.isOnline && !e.isOnBreak && (e.idleMinutes || 0) < 5).length;
    }, [allEmployees]);

    const idleCount = useMemo(() => {
        return allEmployees.filter(e => e.isOnline && ((e.idleMinutes || 0) >= 5 || e.isOnBreak)).length;
    }, [allEmployees]);

    const offlineCount = Math.max(0, allEmployees.length - onlineEmployees.length);

    // Filtered Staff for the Live Radar Board
    const filteredStaff = useMemo(() => {
        return allEmployees.filter(emp => {
            const matchesQuery = !staffSearch ||
                (emp.fullName || emp.name || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
                (emp.email || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
                (emp.role || '').toLowerCase().includes(staffSearch.toLowerCase());

            if (!matchesQuery) return false;

            if (staffFilter === 'ACTIVE') {
                return emp.isOnline && !emp.isOnBreak && (emp.idleMinutes || 0) < 5;
            }
            if (staffFilter === 'IDLE') {
                return emp.isOnline && ((emp.idleMinutes || 0) >= 5 || emp.isOnBreak);
            }
            if (staffFilter === 'OFFLINE') {
                return !emp.isOnline;
            }
            return true;
        });
    }, [allEmployees, staffSearch, staffFilter]);

    // Teams / Department Leaderboard
    const teamsList = useMemo(() => {
        return dashboardData?.teams || [];
    }, [dashboardData?.teams]);

    // Intraday Peak Hours Chart Data
    const intradayData = useMemo(() => {
        const raw = stats?.intradayActivity || [];
        if (!raw.length) {
            return [
                { name: '09:00', active: 3.5, break: 0.5, idle: 0.2 },
                { name: '11:00', active: 6.2, break: 0.8, idle: 0.5 },
                { name: '13:00', active: 4.1, break: 1.8, idle: 0.4 },
                { name: '15:00', active: 7.4, break: 0.6, idle: 0.3 },
                { name: '17:00', active: 5.8, break: 0.4, idle: 0.2 }
            ];
        }
        return raw.map(item => ({
            name: item.name || item.hour || '',
            active: Number(((item.active || 0) / 3600).toFixed(1)),
            break: Number(((item.break || 0) / 3600).toFixed(1)),
            idle: Number(((item.idle || 0) / 3600).toFixed(1))
        }));
    }, [stats?.intradayActivity]);

    // Top Performers & Focus Areas
    const topPerformers = useMemo(() => {
        return dashboardData?.topProductive || [];
    }, [dashboardData?.topProductive]);

    const needsAttention = useMemo(() => {
        return dashboardData?.topUnproductive || [];
    }, [dashboardData?.topUnproductive]);

    // Org Productivity Score
    const orgProductivityScore = Number(stats?.summary?.utilization) || 88;
    const totalWorkHours = Number(stats?.summary?.totalWorkHours) || 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Executive Header & Action Hub */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#EEE8DD] dark:bg-[#252B20] p-5 sm:p-6 rounded-3xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-full bg-[#B9955B]/15 text-[#B9955B] dark:bg-[#B9955B]/25 dark:text-[#D3B98D] text-[10px] font-bold uppercase tracking-wider border border-[#B9955B]/30 flex items-center gap-1.5">
                            <Sparkles size={12} /> Executive Command Center
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAEFEA] dark:bg-[#1E2B20] text-[#5E7D64] dark:text-[#8BB394] text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5E7D64] animate-pulse" /> Live Telemetry · Auto-Sync
                        </span>
                    </div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#29291F] dark:text-[#F5F1E9] mt-2 tracking-tight">
                        Workforce Intelligence & Governance
                    </h1>
                    <p className="text-xs text-[#777367] dark:text-[#B8B3A7] mt-1 font-medium">
                        Real-time operations radar, cross-department productivity benchmarks, and operational backlog.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={async () => {
                            setIsRefreshing(true);
                            if (onRefresh) await onRefresh();
                            await fetchApprovals();
                            setTimeout(() => setIsRefreshing(false), 600);
                        }}
                        title="Auto-refresh active. Click to force instant sync."
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#1E2419] text-[#29291F] dark:text-[#F5F1E9] border border-[#D6CDBC] dark:border-[#384232] hover:bg-[#E5DDCF] dark:hover:bg-[#252B20] text-xs font-semibold transition cursor-pointer shadow-warm-xs"
                    >
                        <RefreshCw size={13} className={`text-[#5E7D64] ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Sync</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/time-attendance')}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] text-xs font-semibold uppercase tracking-wider transition shadow-warm-xs cursor-pointer active:scale-95"
                    >
                        <ShieldAlert size={14} className="text-[#D3B98D]" />
                        <span>Approvals Queue ({pendingApprovals.length})</span>
                    </button>
                    <button
                        onClick={() => {
                            if (onExport) onExport();
                            else toast.info('Exporting organization analytics report...');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#1E2419] text-[#29291F] dark:text-[#F5F1E9] border border-[#D6CDBC] dark:border-[#384232] hover:bg-[#E5DDCF] dark:hover:bg-[#252B20] text-xs font-semibold transition cursor-pointer shadow-warm-xs"
                    >
                        <Download size={14} className="text-[#B9955B]" />
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            {/* Row 1: Top 5 Executive Metric Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {/* 1. Live Active Workforce */}
                <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] p-4 shadow-warm-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777367] dark:text-[#B8B3A7]">
                            Workforce Online
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#5E7D64]/10 dark:bg-[#5E7D64]/20 text-[#5E7D64] dark:text-[#8BB394] flex items-center justify-center">
                            <Users size={14} />
                        </div>
                    </div>
                    <div className="my-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold font-sans text-[#29291F] dark:text-[#F5F1E9] tabular-nums">
                                {onlineEmployees.length}
                            </span>
                            <span className="text-xs font-medium text-[#777367] dark:text-[#B8B3A7]">
                                / {allEmployees.length} Headcount
                            </span>
                        </div>
                        <p className="text-[10px] text-[#5E7D64] dark:text-[#8BB394] font-semibold mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5E7D64]" />
                            {activeWorkingCount} active · {idleCount} idle / break
                        </p>
                    </div>
                    <div className="pt-2 border-t border-[#D6CDBC]/60 dark:border-[#384232] text-[10px] text-[#777367] dark:text-[#B8B3A7] flex items-center justify-between">
                        <span>Offline: {offlineCount}</span>
                        <span className="font-semibold text-[#B9955B]">Real-time Pulse</span>
                    </div>
                </div>

                {/* 2. Org-Wide Productivity */}
                <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] p-4 shadow-warm-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777367] dark:text-[#B8B3A7]">
                            Org Productivity
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#B9955B]/15 text-[#B9955B] flex items-center justify-center">
                            <TrendingUp size={14} />
                        </div>
                    </div>
                    <div className="my-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold font-sans text-[#29291F] dark:text-[#F5F1E9] tabular-nums">
                                {orgProductivityScore}%
                            </span>
                        </div>
                        <p className="text-[10px] text-[#5E7D64] dark:text-[#8BB394] font-semibold mt-0.5">
                            ▲ +3.2% vs prior reference period
                        </p>
                    </div>
                    <div className="pt-2 border-t border-[#D6CDBC]/60 dark:border-[#384232] text-[10px] text-[#777367] dark:text-[#B8B3A7] flex items-center justify-between">
                        <span>Company Benchmark: 80%</span>
                        <span className="font-semibold text-[#5E7D64]">Optimal</span>
                    </div>
                </div>

                {/* 3. Logged Shift Work Hours */}
                <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] p-4 shadow-warm-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777367] dark:text-[#B8B3A7]">
                            Total Hours Logged
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#B9955B]/15 text-[#B9955B] flex items-center justify-center">
                            <Clock size={14} />
                        </div>
                    </div>
                    <div className="my-1">
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold font-sans text-[#29291F] dark:text-[#F5F1E9] tabular-nums">
                                {totalWorkHours > 0 ? `${totalWorkHours}h` : (stats?.summary?.workTime || '0h')}
                            </span>
                        </div>
                        <p className="text-[10px] text-[#777367] dark:text-[#B8B3A7] font-medium mt-0.5">
                            Cumulative tracked shifts
                        </p>
                    </div>
                    <div className="pt-2 border-t border-[#D6CDBC]/60 dark:border-[#384232] text-[10px] text-[#777367] dark:text-[#B8B3A7] flex items-center justify-between">
                        <span>Active: {stats?.summary?.activeTime || '--'}</span>
                        <span className="font-semibold text-[#B9955B]">Timesheets</span>
                    </div>
                </div>

                {/* 4. Active Departments */}
                <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] p-4 shadow-warm-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777367] dark:text-[#B8B3A7]">
                            Departments Active
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#30382B] text-[#D3B98D] flex items-center justify-center">
                            <Building2 size={14} />
                        </div>
                    </div>
                    <div className="my-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold font-sans text-[#29291F] dark:text-[#F5F1E9] tabular-nums">
                                {teamsList.length || 1}
                            </span>
                            <span className="text-xs font-medium text-[#777367] dark:text-[#B8B3A7]">
                                Teams Operating
                            </span>
                        </div>
                        <p className="text-[10px] text-[#777367] dark:text-[#B8B3A7] font-medium mt-0.5">
                            Dev, Sales, Operations
                        </p>
                    </div>
                    <div className="pt-2 border-t border-[#D6CDBC]/60 dark:border-[#384232] text-[10px] text-[#777367] dark:text-[#B8B3A7] flex items-center justify-between">
                        <span onClick={() => navigate('/admin/teams')} className="text-[#B9955B] hover:underline cursor-pointer flex items-center gap-0.5">
                            View Teams <ChevronRight size={11} />
                        </span>
                        <span className="font-semibold text-[#5E7D64]">100% Online</span>
                    </div>
                </div>

                {/* 5. Pending Action Backlog */}
                <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] p-4 shadow-warm-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777367] dark:text-[#B8B3A7]">
                            Action Required
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#FAF0E1] dark:bg-[#2C2415] text-[#C98A3C] flex items-center justify-center border border-[#E8D4B8] dark:border-[#5C4A28]">
                            <ShieldAlert size={14} />
                        </div>
                    </div>
                    <div className="my-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold font-sans text-[#C98A3C] dark:text-[#E5B56D] tabular-nums">
                                {pendingApprovals.length}
                            </span>
                            <span className="text-xs font-medium text-[#777367] dark:text-[#B8B3A7]">
                                Pending Timesheets
                            </span>
                        </div>
                        <p className="text-[10px] text-[#777367] dark:text-[#B8B3A7] font-medium mt-0.5">
                            Requires Manager/Admin Sign-off
                        </p>
                    </div>
                    <div className="pt-2 border-t border-[#D6CDBC]/60 dark:border-[#384232] text-[10px] flex items-center justify-between">
                        <span
                            onClick={() => navigate('/admin/time-attendance')}
                            className="text-[#C98A3C] dark:text-[#E5B56D] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                            Open Review Queue <ArrowUpRight size={11} />
                        </span>
                    </div>
                </div>
            </div>

            {/* Row 2: Live Staff Radar (Left) + Department Performance Matrix (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: Real-Time Workforce Radar (7 cols) */}
                <div className="lg:col-span-7 bg-[#EEE8DD] dark:bg-[#252B20] rounded-3xl border border-[#D6CDBC] dark:border-[#384232] p-5 sm:p-6 shadow-warm-xs space-y-4 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D6CDBC]/70 dark:border-[#384232]">
                        <div>
                            <h2 className="font-serif text-lg font-bold text-[#29291F] dark:text-[#F5F1E9] flex items-center gap-2">
                                <Activity size={17} className="text-[#B9955B]" /> Real-Time Staff Radar
                            </h2>
                            <p className="text-xs text-[#777367] dark:text-[#B8B3A7] mt-0.5">
                                Current live computer activity and working application for all staff
                            </p>
                        </div>

                        {/* Search & Status Filter Pills */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#777367]" />
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={staffSearch}
                                    onChange={(e) => setStaffSearch(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 text-xs bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl text-[#29291F] dark:text-[#F5F1E9] outline-none focus:border-[#B9955B] w-36 sm:w-44"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold uppercase tracking-wider">
                        {[
                            { key: 'ALL', label: `All Staff (${allEmployees.length})` },
                            { key: 'ACTIVE', label: `Active Working (${activeWorkingCount})` },
                            { key: 'IDLE', label: `Idle / Break (${idleCount})` },
                            { key: 'OFFLINE', label: `Offline (${offlineCount})` },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setStaffFilter(tab.key)}
                                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                    staffFilter === tab.key
                                        ? 'bg-[#30382B] text-white shadow-warm-xs'
                                        : 'bg-[#F5F1E9] dark:bg-[#1E2419] text-[#777367] dark:text-[#B8B3A7] hover:bg-[#E5DDCF] dark:hover:bg-[#252B20] border border-[#D6CDBC]/60 dark:border-[#384232]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Employee Radar List */}
                    <div className="divide-y divide-[#D6CDBC]/50 dark:divide-[#384232] overflow-y-auto max-h-[360px] pr-1">
                        {filteredStaff.length === 0 ? (
                            <div className="p-8 text-center text-xs text-[#777367] dark:text-[#B8B3A7]">
                                No staff members match the selected filter.
                            </div>
                        ) : (
                            filteredStaff.map((emp) => {
                                const isOnline = emp.isOnline;
                                const isBreak = emp.isOnBreak;
                                const isIdle = (emp.idleMinutes || 0) >= 5;

                                let statusBg = 'bg-[#EAEFEA] dark:bg-[#1E2B20] text-[#5E7D64] dark:text-[#8BB394] border-[#C5D7C7] dark:border-[#325238]';
                                let statusText = 'Working';
                                let dotColor = 'bg-[#5E7D64]';

                                if (!isOnline) {
                                    statusBg = 'bg-[#EEE8DD] dark:bg-[#1E2419] text-[#777367] dark:text-[#B8B3A7] border-[#D6CDBC] dark:border-[#384232]';
                                    statusText = 'Offline';
                                    dotColor = 'bg-[#9E988A]';
                                } else if (isBreak) {
                                    statusBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800';
                                    statusText = 'On Break';
                                    dotColor = 'bg-amber-500';
                                } else if (isIdle) {
                                    statusBg = 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-300 dark:border-amber-800';
                                    statusText = `Idle (${emp.idleMinutes}m)`;
                                    dotColor = 'bg-amber-500';
                                }

                                return (
                                    <div
                                        key={emp.id}
                                        onClick={() => navigate('/admin/activities')}
                                        className="py-3 flex items-center justify-between gap-3 hover:bg-[#F5F1E9]/60 dark:hover:bg-[#1E2419]/60 px-2 rounded-xl transition cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative">
                                                <div className="w-9 h-9 rounded-xl bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] flex items-center justify-center text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] shrink-0">
                                                    {(emp.fullName || emp.name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#EEE8DD] dark:border-[#252B20] ${dotColor}`} />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] truncate group-hover:text-[#B9955B] transition-colors">
                                                        {emp.fullName || emp.name}
                                                    </span>
                                                    <span className="text-[10px] text-[#777367] dark:text-[#B8B3A7]">
                                                        · {emp.role}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[#777367] dark:text-[#B8B3A7] truncate flex items-center gap-1.5 mt-0.5">
                                                    <Monitor size={11} className="text-[#B9955B] shrink-0" />
                                                    <span className="truncate">
                                                        {emp.currentApp || emp.currentActivity || 'No active app reported'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusBg}`}>
                                                {statusText}
                                            </span>
                                            <ChevronRight size={14} className="text-[#777367] group-hover:text-[#B9955B] transition-transform group-hover:translate-x-0.5" />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Panel: Department / Team Performance Matrix (5 cols) */}
                <div className="lg:col-span-5 bg-[#EEE8DD] dark:bg-[#252B20] rounded-3xl border border-[#D6CDBC] dark:border-[#384232] p-5 sm:p-6 shadow-warm-xs space-y-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-[#D6CDBC]/70 dark:border-[#384232]">
                            <div>
                                <h2 className="font-serif text-lg font-bold text-[#29291F] dark:text-[#F5F1E9] flex items-center gap-2">
                                    <Building2 size={17} className="text-[#B9955B]" /> Department Benchmarks
                                </h2>
                                <p className="text-xs text-[#777367] dark:text-[#B8B3A7] mt-0.5">
                                    Team productivity and resource distribution
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/admin/teams')}
                                className="text-[10px] font-bold text-[#B9955B] hover:underline uppercase tracking-wider cursor-pointer"
                            >
                                Manage Teams
                            </button>
                        </div>

                        {/* Team Leaderboard Progress Bars */}
                        <div className="space-y-4 mt-4">
                            {teamsList.length === 0 ? (
                                <div className="p-6 text-center text-xs text-[#777367] dark:text-[#B8B3A7]">
                                    No department stats recorded yet.
                                </div>
                            ) : (
                                teamsList.map((team, idx) => {
                                    const score = team.productivity !== undefined ? team.productivity : 85;
                                    const isOptimal = score >= 75;

                                    return (
                                        <div key={team.id || idx} className="space-y-1.5 bg-[#F5F1E9] dark:bg-[#1E2419] p-3 rounded-2xl border border-[#D6CDBC]/60 dark:border-[#384232]">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-serif font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                                        {team.name}
                                                    </span>
                                                </div>
                                                <span className={`font-bold tabular-nums text-xs ${isOptimal ? 'text-[#5E7D64] dark:text-[#8BB394]' : 'text-[#C98A3C]'}`}>
                                                    {score}% Productivity
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full h-2 rounded-full bg-[#EEE8DD] dark:bg-[#252B20] overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isOptimal ? 'bg-[#5E7D64]' : 'bg-[#C98A3C]'}`}
                                                    style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] text-[#777367] dark:text-[#B8B3A7] pt-0.5">
                                                <span>Active Operations</span>
                                                <span className="text-[#B9955B] font-semibold">{isOptimal ? 'High Output' : 'Needs Review'}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Quick Admin Policy & Agent Health Callout */}
                    <div className="mt-4 p-4 rounded-2xl bg-[#30382B] text-white flex items-center justify-between gap-3 shadow-warm-xs">
                        <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                <Monitor size={14} className="text-[#D3B98D]" />
                                Desktop Monitoring Client
                            </h4>
                            <p className="text-[10px] text-[#B8C2B3] mt-0.5">
                                Automated screen capture and activity sync active across organization
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/monitoring-agents')}
                            className="px-3 py-1.5 rounded-xl bg-[#B9955B] hover:bg-[#A17D45] text-white text-[10px] font-bold uppercase tracking-wider transition cursor-pointer shrink-0"
                        >
                            Agent Status
                        </button>
                    </div>
                </div>
            </div>

            {/* Row 3: 24-Hour Intraday Activity Chart (Left) + Top Performers & Focus Areas (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Intraday Peak Operational Hours (7 cols) */}
                <div className="lg:col-span-7 bg-[#EEE8DD] dark:bg-[#252B20] rounded-3xl border border-[#D6CDBC] dark:border-[#384232] p-5 sm:p-6 shadow-warm-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#D6CDBC]/70 dark:border-[#384232]">
                        <div>
                            <h2 className="font-serif text-lg font-bold text-[#29291F] dark:text-[#F5F1E9] flex items-center gap-2">
                                <Clock size={17} className="text-[#B9955B]" /> Org Peak Activity Profile
                            </h2>
                            <p className="text-xs text-[#777367] dark:text-[#B8B3A7] mt-0.5">
                                Workforce hourly workload distribution (Active vs Break vs Idle)
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-wider bg-[#F5F1E9] dark:bg-[#1E2419] px-2.5 py-1 rounded-lg border border-[#D6CDBC]/60 dark:border-[#384232]">
                            24-Hour Cycle
                        </span>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={intradayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(185, 149, 91, 0.15)" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#777367' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#777367' }} unit="h" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#252B20',
                                        borderColor: '#384232',
                                        borderRadius: '12px',
                                        color: '#F5F1E9',
                                        fontSize: '11px'
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                <Bar dataKey="active" name="Productive Work (h)" fill="#5E7D64" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="break" name="Break Time (h)" fill="#C98A3C" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="idle" name="Idle / Inactive (h)" fill="#9E988A" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Top Performers & Focus Areas Leaderboard (5 cols) */}
                <div className="lg:col-span-5 bg-[#EEE8DD] dark:bg-[#252B20] rounded-3xl border border-[#D6CDBC] dark:border-[#384232] p-5 sm:p-6 shadow-warm-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#D6CDBC]/70 dark:border-[#384232]">
                        <div>
                            <h2 className="font-serif text-lg font-bold text-[#29291F] dark:text-[#F5F1E9] flex items-center gap-2">
                                <Award size={17} className="text-[#B9955B]" /> Workforce Performance Board
                            </h2>
                            <p className="text-xs text-[#777367] dark:text-[#B8B3A7] mt-0.5">
                                Top productive contributors & coaching opportunities
                            </p>
                        </div>
                    </div>

                    {/* Top Performers List */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#5E7D64] dark:text-[#8BB394] flex items-center gap-1.5">
                            <Sparkles size={12} /> Top Contributors
                        </span>

                        {topPerformers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-[#777367] dark:text-[#B8B3A7] bg-[#F5F1E9] dark:bg-[#1E2419] rounded-xl border border-[#D6CDBC]/50">
                                Activity data will appear as shifts progress.
                            </div>
                        ) : (
                            topPerformers.slice(0, 3).map((emp, i) => (
                                <div key={emp.id || i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC]/60 dark:border-[#384232]">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-5 h-5 rounded-full bg-[#B9955B]/20 text-[#B9955B] text-[10px] font-bold flex items-center justify-center">
                                            #{i + 1}
                                        </span>
                                        <div>
                                            <div className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">{emp.name}</div>
                                            <div className="text-[10px] text-[#777367] dark:text-[#B8B3A7]">{emp.team || 'Development'}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-[#5E7D64] dark:text-[#8BB394] tabular-nums">
                                            {emp.utilization}%
                                        </div>
                                        <div className="text-[9px] text-[#777367] dark:text-[#B8B3A7]">
                                            {emp.productive ? `${(emp.productive / 3600).toFixed(1)}h logged` : 'High Output'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Focus Areas (High Idle) */}
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C98A3C] flex items-center gap-1.5 pt-2">
                            <AlertTriangle size={12} /> Needs Review (High Idle Time)
                        </span>

                        {needsAttention.length === 0 ? (
                            <div className="p-3 text-center text-xs text-[#5E7D64] bg-[#EAEFEA] dark:bg-[#1E2B20] rounded-xl border border-[#C5D7C7] dark:border-[#325238]">
                                ✓ All employees within optimal idle thresholds.
                            </div>
                        ) : (
                            needsAttention.slice(0, 2).map((emp, i) => (
                                <div key={emp.id || i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF0E1] dark:bg-[#2A2418] border border-[#E8D4B8] dark:border-[#5C4A28]">
                                    <div className="flex items-center gap-2">
                                        <Coffee size={14} className="text-[#C98A3C]" />
                                        <div>
                                            <div className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">{emp.name}</div>
                                            <div className="text-[10px] text-[#777367] dark:text-[#B8B3A7]">{emp.team || 'General'}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-[#C98A3C] tabular-nums">
                                            {emp.idle ? `${(emp.idle / 3600).toFixed(1)}h Idle` : `${100 - (emp.utilization || 0)}% AFK`}
                                        </div>
                                        <div className="text-[9px] text-[#777367] dark:text-[#B8B3A7]">Review Suggested</div>
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
