import React, { useState, useEffect, useMemo } from 'react';
import {
    Activity,
    Clock,
    Zap,
    Users,
    TrendingDown,
    Search,
    MapPin,
    Eye,
    ChevronRight,
    LayoutGrid,
    List,
    Download,
    Video,
    ShieldAlert
} from 'lucide-react';
import { useRealTime } from '../hooks/RealTimeContext';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import { LiveMapView } from '../components/location/LiveMapView';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const statusColors = {
    online: 'bg-[#5E7D64]',
    active: 'bg-[#5E7D64]',
    idle: 'bg-[#C98A3C]',
    idle_warning: 'bg-[#D97706]',
    passive: 'bg-[#60A5FA]',
    break: 'bg-[#B9955B]',
    offline: 'bg-[#9E988A]'
};

const LiveTimer = ({ startTime, status }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) return;
        const update = () => {
            const now = new Date();
            const start = new Date(startTime);
            const diff = Math.max(0, Math.floor((now - start) / 1000));
            setElapsed(diff);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;

    return (
        <div className="flex items-center gap-1.5 font-sans font-bold tabular-nums">
            <span className="text-[#29291F] dark:text-[#F5F1E9]">
                {h}h {m}m {s}s
            </span>
            {status === 'break' && (
                <div className="h-1.5 w-1.5 rounded-full bg-[#B9955B] animate-pulse" title="Active Break" />
            )}
        </div>
    );
};

const InsightStatCard = ({ title, value, total, icon: Icon, subLabel }) => (
    <div className="bg-[#FBF9F5] dark:bg-[#252B20] p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E5DED2] dark:border-[#384232] shadow-warm-xs flex flex-col justify-between hover:border-[#B9955B]/60 transition-all">
        <div className="flex justify-between items-center mb-1.5 sm:mb-2 gap-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-wider truncate">{title}</span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-[#EEE8DD]/70 dark:bg-[#30382B] flex items-center justify-center text-[#B9955B] shrink-0">
                <Icon size={13} strokeWidth={2} />
            </div>
        </div>
        <div className="my-0.5 sm:my-1 flex items-baseline gap-1">
            <h3 className="font-sans text-lg sm:text-2xl font-bold text-[#29291F] dark:text-[#F5F1E9] tabular-nums tracking-tight">{value}</h3>
            {total && <span className="text-xs font-semibold text-[#777367] dark:text-[#9E988A]">/ {total}</span>}
        </div>
        {subLabel && <p className="text-[10px] text-[#777367] dark:text-[#B8B3A7] font-medium pt-1.5 border-t border-[#E5DED2]/60 dark:border-[#384232]/60 mt-1 truncate">{subLabel}</p>}
    </div>
);

export function RealTimeInsights() {
    const { stats, addEmployee } = useRealTime();
    const { role } = useAuthStore();
    const navigate = useNavigate();
    const rolePath = role ? `/${role.toLowerCase()}` : '';
    const employees = stats.empMetrics || [];
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [activeTab, setActiveTab] = useState('overview');
    const [viewMode, setViewMode] = useState('grid');
    const [secAgo, setSecAgo] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setSecAgo(s => s + 1), 1000);
        return () => clearInterval(t);
    }, []);
    useEffect(() => { setSecAgo(0); }, [employees]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return employees.filter(e => {
            const matchesSearch = e.name.toLowerCase().includes(q) || (e.team || '').toLowerCase().includes(q);
            const matchesStatus = statusFilter === 'ALL' || (e.status || '').toUpperCase() === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [employees, search, statusFilter]);

    const onlineEmps = employees.filter(e => e.status === 'online');
    const idleEmps = employees.filter(e => e.status === 'idle');
    const breakEmps = employees.filter(e => e.status === 'break');
    const presentToday = onlineEmps.length + idleEmps.length + breakEmps.length;

    const handleAddEmployee = (emp) => { addEmployee(emp); setIsModalOpen(false); };

    const formatSecs = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h}h ${m}m ${sec}s`;
    };

    const formatHours = (hours) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return (
            <div className="flex flex-col items-center">
                <span className="font-bold text-[#29291F] dark:text-[#F5F1E9] tabular-nums">{h}h</span>
                <span className="text-[10px] font-medium text-[#777367] uppercase tabular-nums">{m.toString().padStart(2, '0')}m</span>
            </div>
        );
    };

    const handleDownload = () => {
        const headers = ['Employee Name', 'Total Work Hours', 'Manual Hours', 'Activity Hours', 'Team', 'Status', 'Total Break Time', 'Productivity Score', 'Utilization Score'];
        const rows = filtered.map(e => {
            const breaks = Array.isArray(e.breaks) ? e.breaks : [];
            const totalBreakSecs = breaks.reduce((acc, b) => {
                if (b.startTime && b.endTime) {
                    return acc + Math.floor((new Date(b.endTime) - new Date(b.startTime)) / 1000);
                }
                return acc;
            }, 0);
            const formatH = (hrs) => {
                const h = Math.floor(hrs);
                const m = Math.round((hrs - h) * 60);
                return `${h}h ${m}m`;
            };
            return [
                e.name,
                formatH(e.totalWorkHours || 0),
                formatH(e.manualHours || 0),
                formatH(e.computerActivityHours || 0),
                e.team || '—',
                e.status,
                formatSecs(totalBreakSecs),
                e.productivityScore || 0,
                e.utilizationScore || 0
            ];
        });
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `real-time-insights-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-normal text-[#29291F] dark:text-[#F5F1E9] tracking-tight">Real-Time Insights</h1>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-widest">
                        <div className="h-2 w-2 rounded-full bg-[#5E7D64] animate-pulse" />
                        Live — refreshed {secAgo < 5 ? 'just now' : `${secAgo}s ago`}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-[#EEE8DD] dark:bg-[#252B20] p-1 rounded-xl border border-[#E5DED2] dark:border-[#384232] flex items-center shadow-warm-xs">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'overview'
                                ? 'bg-[#30382B] text-white shadow-xs'
                                : 'text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7]'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'map'
                                ? 'bg-[#30382B] text-white shadow-xs'
                                : 'text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7]'
                                }`}
                        >
                            <MapPin size={13} className={activeTab === 'map' ? 'text-[#D3B98D]' : ''} />
                            Live Map
                        </button>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                <InsightStatCard title="Present Today" value={presentToday} total={employees.length} icon={Users} subLabel={`${employees.length} total team`} />
                <InsightStatCard title="Currently Active" value={onlineEmps.length} icon={Zap} subLabel={`${stats.online} online`} />
                <InsightStatCard title="Idle" value={idleEmps.length} icon={Clock} subLabel="Inactive now" />
                <InsightStatCard title="Offline" value={stats.offline} icon={TrendingDown} subLabel="Not tracked today" />
                <InsightStatCard title="Productivity Today" value={`${stats.summary?.productivity ?? 0}%`} icon={Activity} subLabel="vs. active time" />
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-[#FBF9F5] dark:bg-[#252B20] border border-[#E5DED2] dark:border-[#384232] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] outline-none shadow-warm-xs cursor-pointer hover:border-[#B9955B] transition-colors"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ONLINE">Online</option>
                                <option value="IDLE">Idle</option>
                                <option value="BREAK">On Break</option>
                                <option value="OFFLINE">Offline</option>
                            </select>

                            <div className="relative w-full sm:w-64 group">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777367]" />
                                <input
                                    type="text"
                                    placeholder="Search employee or team"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-[#FBF9F5] dark:bg-[#252B20] border border-[#E5DED2] dark:border-[#384232] rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none shadow-warm-xs text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] focus:border-[#B9955B] transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownload}
                                title="Download CSV"
                                className="p-2 border border-[#E5DED2] dark:border-[#384232] bg-[#FBF9F5] dark:bg-[#252B20] rounded-xl text-[#777367] hover:text-[#B9955B] hover:bg-[#EEE8DD] transition-all shadow-warm-xs cursor-pointer"
                            >
                                <Download size={15} />
                            </button>
                            <button
                                onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
                                title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
                                className={`p-2 border rounded-xl transition-all shadow-warm-xs cursor-pointer ${viewMode === 'grid'
                                    ? 'border-[#B9955B] bg-[#EEE8DD] text-[#30382B]'
                                    : 'border-[#E5DED2] dark:border-[#384232] bg-[#FBF9F5] dark:bg-[#252B20] text-[#777367] hover:bg-[#EEE8DD]'
                                    }`}
                            >
                                {viewMode === 'list' ? <LayoutGrid size={15} /> : <List size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Employee List/Grid */}
                    {viewMode === 'list' ? (
                        <div className="bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border border-[#E5DED2] dark:border-[#384232] shadow-warm-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="text-[#777367] dark:text-[#B8B3A7] font-semibold border-b border-[#E5DED2] dark:border-[#384232] bg-[#EEE8DD]/40 dark:bg-[#1E2419]">
                                        <tr>
                                            <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Employee Name</th>
                                            <th className="px-6 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Work Time</th>
                                            <th className="px-6 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Manual</th>
                                            <th className="px-6 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Computer</th>
                                            <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Team</th>
                                            <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Status</th>
                                            <th className="px-6 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Breaks</th>
                                            <th className="px-6 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Productivity</th>
                                            <th className="px-6 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Utilization</th>
                                            <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5DED2]/60 dark:divide-[#384232]/60">
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan="10" className="py-12 text-center text-[#777367] font-medium">No employees match your filter.</td>
                                            </tr>
                                        ) : filtered.map((emp) => {
                                            const breaks = Array.isArray(emp.breaks) ? emp.breaks : [];
                                            const totalBreakSecs = breaks.reduce((acc, b) => {
                                                if (b.startTime && b.endTime) {
                                                    return acc + Math.floor((new Date(b.endTime) - new Date(b.startTime)) / 1000);
                                                }
                                                return acc;
                                            }, 0);
                                            const isOnline = emp.status === 'online';

                                            return (
                                                <tr key={emp.id} className="hover:bg-[#EEE8DD]/30 dark:hover:bg-[#1E2419] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-[#EEE8DD] dark:bg-[#384232] text-[#30382B] dark:text-[#F5F1E9] flex items-center justify-center font-bold text-xs border border-[#E5DED2] dark:border-[#4A5742]">
                                                                {emp.initials || (emp.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-xs text-[#29291F] dark:text-[#F5F1E9]">{emp.name}</p>
                                                                <p className="text-[10px] text-[#777367]">{emp.email || '—'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">{formatHours(emp.totalWorkHours || 0)}</td>
                                                    <td className="px-6 py-4 text-center">{formatHours(emp.manualHours || 0)}</td>
                                                    <td className="px-6 py-4 text-center">{formatHours(emp.computerActivityHours || 0)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#EEE8DD]/70 dark:bg-[#384232]/60 text-[11px] font-semibold text-[#29291F] dark:text-[#F5F1E9] border border-[#E5DED2]/60 dark:border-[#384232] whitespace-nowrap">
                                                            {emp.team || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                            (emp.status === 'online' || emp.status === 'active') ? 'bg-[#5E7D64]/10 text-[#5E7D64]' :
                                                            emp.status === 'idle' ? 'bg-[#C98A3C]/10 text-[#C98A3C]' :
                                                            emp.status === 'idle_warning' ? 'bg-[#D97706]/15 text-[#D97706]' :
                                                            emp.status === 'passive' ? 'bg-[#60A5FA]/15 text-[#3B82F6]' :
                                                            emp.status === 'break' ? 'bg-[#B9955B]/15 text-[#A17D45]' :
                                                            'bg-[#777367]/10 text-[#777367]'
                                                        }`}>
                                                            <span className={`h-1.5 w-1.5 rounded-full ${statusColors[emp.status] || statusColors.offline}`} />
                                                            {emp.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-[11px] font-medium text-[#777367]">
                                                        {formatSecs(totalBreakSecs)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-bold text-[#B9955B]">{emp.productivityScore || 0}%</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-bold text-[#5E7D64]">{emp.utilizationScore || 0}%</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => navigate(`${rolePath}/screenshots?employee=${emp.id}`)}
                                                            className="px-3 py-1.5 bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] rounded-lg text-[11px] font-semibold transition-all inline-flex items-center gap-1.5 shadow-warm-xs cursor-pointer"
                                                        >
                                                            <Video size={12} className="text-[#D3B98D]" /> View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                            {filtered.length === 0 ? (
                                <div className="col-span-full py-16 text-center text-[#777367] font-medium text-sm">No employees match your search.</div>
                            ) : filtered.map((emp) => (
                                <div key={emp.id} className="bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border border-[#E5DED2] dark:border-[#384232] shadow-warm-xs p-4 sm:p-5 flex flex-col gap-3.5 hover:shadow-warm-md hover:border-[#B9955B]/60 transition-all">
                                    <div className="flex items-start justify-between gap-2.5">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#EEE8DD] dark:bg-[#384232] text-[#30382B] dark:text-[#F5F1E9] border border-[#E5DED2] dark:border-[#4A5742] flex items-center justify-center font-bold text-xs shrink-0">
                                                    {emp.avatar ? (
                                                        <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover rounded-xl"
                                                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                        />
                                                    ) : null}
                                                    <span className={`${emp.avatar ? 'hidden' : 'flex'}`}>
                                                        {emp.initials || (emp.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </span>
                                                </div>
                                                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#FBF9F5] dark:border-[#252B20] ${statusColors[emp.status] || statusColors.offline}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-xs sm:text-sm text-[#29291F] dark:text-[#F5F1E9] truncate" title={emp.name}>{emp.name}</p>
                                                <p className="text-[11px] font-medium text-[#777367] dark:text-[#A8A295] truncate" title={emp.team}>{emp.team || 'No Team'}</p>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                            (emp.status === 'online' || emp.status === 'active') ? 'bg-[#5E7D64]/10 text-[#5E7D64] dark:bg-[#5E7D64]/20' :
                                            emp.status === 'idle' ? 'bg-[#C98A3C]/10 text-[#C98A3C] dark:bg-[#C98A3C]/20' :
                                            emp.status === 'idle_warning' ? 'bg-[#D97706]/15 text-[#D97706] dark:bg-[#D97706]/25' :
                                            emp.status === 'passive' ? 'bg-[#60A5FA]/15 text-[#3B82F6] dark:bg-[#60A5FA]/25' :
                                            emp.status === 'break' ? 'bg-[#B9955B]/15 text-[#A17D45] dark:bg-[#B9955B]/25 dark:text-[#D3B98D]' :
                                            'bg-[#777367]/10 text-[#777367] dark:bg-[#777367]/20 dark:text-[#A8A295]'
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${statusColors[emp.status] || statusColors.offline}`} />
                                            {emp.status}
                                        </span>
                                    </div>

                                    {/* Activity and Location */}
                                    <div className="bg-[#EEE8DD]/40 dark:bg-[#1E2419] rounded-xl p-2.5 flex flex-col gap-1 border border-[#E5DED2]/60 dark:border-[#384232]/60">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-wider gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <Activity size={11} className="text-[#B9955B] shrink-0" />
                                                <span className="truncate" title={emp.activeApp || 'Idle'}>
                                                    {emp.status === 'offline' ? 'Offline' : (emp.activeApp || 'Idle')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 text-[#777367] dark:text-[#9E988A]">
                                                <MapPin size={11} className="shrink-0" />
                                                <span>{emp.location || 'Remote'}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-[#777367] dark:text-[#A8A295] truncate italic px-0.5" title={emp.activeWindow}>
                                            {emp.status === 'offline' ? 'No recent activity' : (emp.activeWindow || 'Waiting for activity...')}
                                        </p>
                                    </div>

                                    {/* Progress Bars */}
                                    <div className="space-y-2 pt-1">
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] mb-1">
                                                <span>Productivity</span><span className="text-[#B9955B] font-bold">{emp.productivityScore || 0}%</span>
                                            </div>
                                            <div className="h-1.5 bg-[#EEE8DD] dark:bg-[#1E2419] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#B9955B] rounded-full transition-all" style={{ width: `${emp.productivityScore || 0}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] mb-1">
                                                <span>Utilization</span><span className="text-[#5E7D64] font-bold">{emp.utilizationScore || 0}%</span>
                                            </div>
                                            <div className="h-1.5 bg-[#EEE8DD] dark:bg-[#1E2419] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#5E7D64] rounded-full transition-all" style={{ width: `${emp.utilizationScore || 0}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-auto pt-2">
                                        <button
                                            onClick={() => navigate(`${rolePath}/screenshots?employee=${emp.id}`)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] rounded-xl text-xs font-semibold shadow-warm-xs transition-all active:scale-95 cursor-pointer"
                                        >
                                            <Video size={13} className="text-[#D3B98D]" />
                                            <span>View Screenshots</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <LiveMapView />
            )}

            <AddEmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddEmployee} />
        </div>
    );
}
