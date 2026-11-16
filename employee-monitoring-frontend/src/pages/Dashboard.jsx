import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Clock,
    Activity,
    TrendingUp,
    TrendingDown,
    Filter,
    Download,
    ChevronDown,
    Plus,
    Calendar,
    ArrowRightLeft,
    MoreHorizontal,
    Monitor,
    Globe,
    Zap
} from 'lucide-react';
import {
    ResponsiveContainer,
    ComposedChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Bar
} from 'recharts';
import { useFilterStore } from '../store/filterStore';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import { GlobalCalendar } from '../components/GlobalCalendar';
import { useRealTime } from '../hooks/RealTimeContext';
import { useAuthStore } from '../store/authStore';
import { useLiveTimeDisplay } from '../hooks/useLiveTime';
import { parseTimeValueToSeconds } from '../utils/timeFormat';
import { API_BASE_URL, BASE_URL } from '../config/api';

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
import { WorkSessionBanner } from '../components/dashboard/WorkSessionBanner';

const LiveSummaryCard = ({ title, baseSeconds, live, trend, subValue, icon, color = 'primary' }) => {
    const value = useLiveTimeDisplay(baseSeconds, live);
    return (
        <SummaryCard
            title={title}
            value={value}
            trend={trend}
            subValue={subValue}
            icon={icon}
            color={color}
        />
    );
};

const SummaryCard = ({ title, value, trend, subValue, icon: Icon, color = 'primary' }) => {
    const colorMap = {
        primary: 'from-primary-500/10 to-primary-500/5 text-primary-600 border-primary-100 shadow-primary-100/50 dark:border-primary-900/30 dark:shadow-none',
        emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-100 shadow-emerald-100/50 dark:border-emerald-900/30 dark:shadow-none',
        rose: 'from-rose-500/10 to-rose-500/5 text-rose-600 border-rose-100 shadow-rose-100/50 dark:border-rose-900/30 dark:shadow-none',
        amber: 'from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-100 shadow-amber-100/50 dark:border-amber-900/30 dark:shadow-none',
        indigo: 'from-indigo-500/10 to-indigo-500/5 text-indigo-600 border-indigo-100 shadow-indigo-100/50 dark:border-indigo-900/30 dark:shadow-none',
        orange: 'from-orange-500/10 to-orange-500/5 text-orange-600 border-orange-100 shadow-orange-100/50 dark:border-orange-900/30 dark:shadow-none',
        slate: 'from-slate-500/10 to-slate-500/5 text-slate-600 border-slate-100 shadow-slate-100/50 dark:border-slate-900/30 dark:shadow-none',
        cyan: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600 border-cyan-100 shadow-cyan-100/50 dark:border-cyan-900/30 dark:shadow-none',
    };

    const activeColor = colorMap[color] || colorMap.primary;

    return (
        <div className={`group bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border ${activeColor.split(' ')[2]} shadow-lg ${activeColor.split(' ')[3]} transition-all hover:-translate-y-1 hover:shadow-xl dark:shadow-none relative overflow-hidden h-full flex flex-col justify-between`}>
            {/* Subtle Gradient Background */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${activeColor.split(' ')[0]} ${activeColor.split(' ')[1]} rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-500`} />
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${activeColor.split(' ')[0]} ${activeColor.split(' ')[1]} flex items-center justify-center ${activeColor.split(' ')[2]}`}>
                        <Icon size={20} className={activeColor.split(' ')[2]} />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] leading-none">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                            {value}
                        </h3>
                        {trend && (
                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${trend.startsWith('-') ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'}`}>
                                {trend.startsWith('-') ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                                {trend}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 leading-none">
                    <span className={`h-1.5 w-1.5 rounded-full ${activeColor.split(' ')[2].replace('text-', 'bg-')}`} />
                    {subValue}
                </p>
            </div>
        </div>
    );
};

const EmployeeTable = ({ title, data, type }) => (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            <button className="text-[10px] font-black text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 uppercase tracking-wider">View all</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
                <thead className="bg-[#fcfdfe] dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                        <th className="px-4 py-2.5">{title.includes('Team') ? 'Team' : 'Employee'}</th>
                        <th className="px-4 py-2.5 text-right">Productive (h)</th>
                        <th className="px-4 py-2.5 text-right">Unproductive (h)</th>
                        <th className="px-4 py-2.5 text-right">Utilization {type === 'up' ? '↑' : '↓'}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center text-[10px] font-black text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                                            {emp.initials}
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${emp.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                                            {emp.name}
                                            <span className={`text-[8px] px-1 rounded-sm uppercase tracking-tighter ${emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {emp.status === 'ACTIVE' ? 'Active' : 'Offline'}
                                            </span>
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{emp.team}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300">{emp.productive}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300">{emp.unproductive}</td>
                            <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">{emp.utilization}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const CategoryTable = ({ data }) => (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Top Categories</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
                <thead className="bg-[#fcfdfe] dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                        <th className="px-4 py-2.5">Category Name</th>
                        <th className="px-4 py-2.5 text-right">Time ↓</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data.map((cat, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{cat.name}</td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex flex-col items-end">
                                    <span className="font-black text-slate-900 dark:text-white">{cat.time}</span>
                                    <span className={`text-[10px] font-bold flex items-center gap-0.5 ${cat.trend.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {cat.trend.startsWith('-') ? '▼' : '▲'} {cat.trend}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const AppSection = ({ title }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
        <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 self-start mb-8 uppercase tracking-tight">{title}</h3>
        <div className="w-32 h-24 bg-primary-50/50 dark:bg-primary-900/10 rounded-2xl relative mb-6 flex items-center justify-center border border-primary-100/50 dark:border-primary-900/30">
            <Monitor size={32} className="text-primary-200 dark:text-primary-800" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 items-center">
                <div className="w-8 h-1 bg-primary-100 dark:bg-primary-800/50 rounded-full"></div>
                <div className="w-4 h-1 bg-primary-100 dark:bg-primary-800/50 rounded-full"></div>
            </div>
        </div>
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">No data for the selected period</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">Try choosing a different time period in the calendar.</p>
    </div>
);

import dashboardService from '../services/dashboardService';

const pieData = [
    { name: 'Productive', value: 75, color: '#6366f1' },
    { name: 'Unproductive', value: 15, color: '#f43f5e' },
    { name: 'Neutral', value: 10, color: '#94a3b8' }
];

const categories = [
    { name: 'Core Work', time: '5h 30m', trend: '+12%', color: '#6366f1' },
    { name: 'Communication', time: '1h 15m', trend: '-5%', color: '#22d3ee' },
    { name: 'Social Media', time: '0h 45m', trend: '+20%', color: '#f43f5e' },
    { name: 'Others', time: '0h 30m', trend: '+2%', color: '#cbd5e1' }
];

export function Dashboard() {
    const { employees: contextEmployees, teams: contextTeams, stats: realTimeStats, isLoading: isRealTimeLoading } = useRealTime();
    const { role, isClockedIn, isOnBreak } = useAuthStore();
    const { dateRange } = useFilterStore();
    const { start: startDate, end: endDate } = dateRange || {};
    const [activeChartTab, setActiveChartTab] = useState('Activities');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pieData2, setPieData2] = useState([]);
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchDashboardData = async () => {
            // Only set loading on initial fetch to avoid UI flicker during auto-refresh
            if (!dashboardData) setIsLoading(true);
            try {
                let data;
                if (role === 'ADMIN') {
                    data = await dashboardService.getAdminDashboard(startDate, endDate);
                } else if (role === 'MANAGER') {
                    data = await dashboardService.getManagerDashboard(startDate, endDate);
                } else {
                    data = await dashboardService.getEmployeeDashboard(startDate, endDate);
                }
                setDashboardData(data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                if (!dashboardData) setIsLoading(false);
            }
        };

        fetchDashboardData();

        // Auto-refresh every 30 seconds (seconds tick live between refreshes)
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [role, startDate, endDate]);

    const handleDownload = () => {
        const empMetricsData = realTimeStats.empMetrics || [];
        const headers = ['Employee Name', 'Team', 'Productive (h)', 'Unproductive (h)', 'Utilization (%)'];
        const rows = empMetricsData.map(e => [e.name, e.team, e.productive, e.unproductive, e.utilization]);
        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `productivity-report-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const isToday = !startDate || new Date(startDate).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    
    // Merge API data with Real-time stats
    const stats = useMemo(() => {
        const base = dashboardData || realTimeStats;
        if (!base) return realTimeStats;

        const raw = base.summary || {};
        const summarySeconds = {
            workTime: parseTimeValueToSeconds(raw.workTime),
            activeTime: parseTimeValueToSeconds(raw.activeTime),
            idleTime: parseTimeValueToSeconds(raw.idleTime),
            manualTime: parseTimeValueToSeconds(raw.manualTime),
            productiveTime: parseTimeValueToSeconds(raw.productiveTime),
            unproductiveTime: parseTimeValueToSeconds(raw.unproductiveTime),
            neutralTime: parseTimeValueToSeconds(raw.neutralTime),
        };

        return {
            ...base,
            summary: raw,
            summarySeconds,
            screenshots: (isToday && realTimeStats.screenshots?.length > 0) 
                ? realTimeStats.screenshots 
                : (base.screenshots || []),
            empMetrics: (isToday && realTimeStats.empMetrics?.length > 0)
                ? realTimeStats.empMetrics
                : (base.empMetrics || base.topProductive || []),
            topProductive: base.topProductive || (realTimeStats.topProductive || []),
            topUnproductive: base.topUnproductive || (realTimeStats.topUnproductive || [])
        };
    }, [dashboardData, realTimeStats, isToday]);

    const sec = stats?.summarySeconds || {};

    const liveTick = useMemo(() => {
        if (!isToday) return false;
        if (role === 'EMPLOYEE') {
            return isClockedIn && !isOnBreak;
        }
        const list = stats?.empMetrics || contextEmployees || [];
        const someoneOnline = list.some((e) => {
            const s = String(e.status || '').toLowerCase();
            return s === 'active' || s === 'online';
        });
        return someoneOnline || (sec.workTime > 0);
    }, [isToday, role, isClockedIn, isOnBreak, stats?.empMetrics, contextEmployees, sec.workTime]);

    const chartData = stats.intradayActivity?.length
        ? stats.intradayActivity
        : [
            { name: '08:00', active: 0, break: 0, manual: 0, idle: 0 },
            { name: '12:00', active: 0, break: 0, manual: 0, idle: 0 },
            { name: '18:00', active: 0, break: 0, manual: 0, idle: 0 },
        ];

    // ... (rest of the logic remains similar, but using 'stats' which is now role-aware)
    const employeesProd = stats.topProductive || [];
    const teamsList = (stats.teams || stats.departmentStats || []).map(dept => ({
        initials: (dept.name || dept.fullName || '??').substring(0, 2).toUpperCase(),
        name: dept.name || dept.fullName,
        team: '',
        productive: dept.productivity ? `${dept.productivity}%` : '0%',
        unproductive: dept.productivity ? `${100 - dept.productivity}%` : '0%',
        utilization: dept.productivity || 0,
    }));

    const liveScore = useMemo(() => {
        const rawUtil = Number(stats.summary?.utilization);
        if (!isNaN(rawUtil) && rawUtil > 0) return rawUtil;
        const rawProd = Number(stats.summary?.productivity);
        if (!isNaN(rawProd) && rawProd > 0) return rawProd;
        if (liveTick) {
            return 100;
        }
        return 0;
    }, [stats.summary?.utilization, stats.summary?.productivity, liveTick]);

    return (
        <div className="min-h-screen bg-[#fcfdfe] dark:bg-slate-950 pb-12 px-2 sm:px-4 lg:px-8">
            {/* Top Bar / Filter Hub */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-8 mb-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Productivity Trends</h1>
                </div>
                <div className="flex items-center gap-3">
                    <GlobalCalendar />
                    
                    <button
                        onClick={handleDownload}
                        title="Export productivity report as CSV"
                        className="h-10 w-10 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 dark:hover:border-primary-900/30 transition-all hover:text-primary-600 dark:hover:text-primary-400 active:scale-95 shadow-sm"
                    >
                        <Download size={18} strokeWidth={2.5} />
                    </button>

                    {role !== 'EMPLOYEE' && (
                        <div className="relative">
                            <button
                                onClick={() => navigate(`/${role.toLowerCase()}/employees`)}
                                title="View All Employees"
                                className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-all active:scale-95"
                            >
                                <Users size={18} />
                            </button>
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#fcfdfe] dark:border-slate-950 pointer-events-none">{contextEmployees.length || 0}</span>
                        </div>
                    )}
                </div>
            </div>

            {role === 'EMPLOYEE' && <WorkSessionBanner />}

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
                <LiveSummaryCard title="Work Time" baseSeconds={sec.workTime} live={liveTick} trend="" subValue={(role === 'ADMIN' || role === 'MANAGER') ? `${(stats.empMetrics || stats.employees || []).length} employees tracked` : 'Personal activity'} icon={Clock} color="primary" />
                <LiveSummaryCard title="Active Time" baseSeconds={sec.activeTime} live={liveTick} trend="" subValue="Computer activity" icon={Activity} color="indigo" />
                
                {role !== 'EMPLOYEE' && (
                    <>
                        <LiveSummaryCard title="Idle Time" baseSeconds={sec.idleTime} live={liveTick} trend="" subValue="Keyboard/mouse inactive" icon={Clock} color="amber" />
                        <LiveSummaryCard title="Manual Time" baseSeconds={sec.manualTime} live={liveTick} subValue="User-entered time" icon={Plus} color="orange" />
                    </>
                )}

                <LiveSummaryCard title="Productive Time" baseSeconds={sec.productiveTime} live={liveTick} trend="" subValue="High-value work" icon={TrendingUp} color="emerald" />

                {role !== 'EMPLOYEE' && (
                    <>
                        <LiveSummaryCard title="Unproductive Time" baseSeconds={sec.unproductiveTime} live={liveTick} trend="" subValue="Low-value activity" icon={TrendingDown} color="rose" />
                        <LiveSummaryCard title="Neutral Time" baseSeconds={sec.neutralTime} live={liveTick} trend="" subValue="Mixed activity" icon={ArrowRightLeft} color="slate" />
                    </>
                )}

                <SummaryCard title="Productivity Score" value={`${liveScore}%`} subValue={`Work / Productive`} icon={TrendingUp} color="cyan" />
                
                {role === 'MANAGER' && (
                    <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-700 p-4 rounded-lg border border-indigo-500 shadow-lg transition-all hover:scale-[1.02] cursor-pointer" onClick={() => navigate('/manager/tasks')}>
                        <div className="flex justify-between items-start mb-2 text-white/80">
                            <span className="text-[11px] font-black uppercase tracking-wider">Active Strategic Goals</span>
                            <Zap size={14} fill="currentColor" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-1">OKR Oversight</h3>
                        <p className="text-[10px] text-indigo-100 font-medium">Manage milestones & progress</p>
                    </div>
                )}
            </div>

            {/* Main Visualizations */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 overflow-hidden">
                <div className="flex items-center gap-6 px-6 pt-6 border-b border-slate-100 dark:border-slate-800">
                    {['Activities', 'Utilization'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveChartTab(tab)}
                            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeChartTab === tab ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            {tab}
                            {activeChartTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary-600 rounded-full" />}
                        </button>
                    ))}
                </div>
                <div className="h-[400px] w-full p-6 pt-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
                                dy={15}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
                                tickFormatter={(val) => activeChartTab === 'Utilization' ? `${val}%` : `${val}h`}
                                domain={activeChartTab === 'Utilization' ? [0, 100] : [0, 'auto']}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px' }}
                                cursor={{ fill: '#f8fafc' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '30px' }}
                            />
                            {activeChartTab === 'Activities' ? (
                                <>
                                    <Area type="monotone" name="Active Time" dataKey="active" fill="url(#colorActive)" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} />
                                    <Area type="monotone" name="Break Time" dataKey="break" fill="url(#colorBreak)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} />
                                    <Area type="monotone" name="Idle Time" dataKey="idle" fill="url(#colorIdle)" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} />
                                    <Bar name="Manual Time" dataKey="manual" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={20} />
                                </>
                            ) : (
                                <Area type="monotone" name="Utilization %" dataKey="utilization" fill="url(#colorUtil)" stroke="#10b981" strokeWidth={3} fillOpacity={1} />
                            )}
                            <defs>
                                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorBreak" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorIdle" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
                {role !== 'EMPLOYEE' && (
                    <>
                        <EmployeeTable title="Top Productive/Unproductive Employees" data={employeesProd} type="up" />
                        <EmployeeTable title="Top Productive/Unproductive Teams" data={teamsList} type="up" />
                    </>
                )}
            </div>

            {/* Removed unused mock widgets: Analytical Insights & Asset Monitoring */}

            {stats.screenshots?.length > 0 && (
                <div className="mt-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-1 bg-primary-600 rounded-full"></div>
                            <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                                {role === 'EMPLOYEE' ? 'My Recent Work Captures' : 'Recent Team Activity'}
                            </h3>
                        </div>
                        {/* <button
                            onClick={() => navigate(role === 'EMPLOYEE' ? '/employee/screenshots' : '/screenshots')}
                            className="text-[10px] font-black text-primary-600/60 dark:text-primary-400/60 hover:text-primary-600 dark:hover:text-primary-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                        >
                            View All <ArrowRightLeft size={10} />
                        </button> */}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {stats.screenshots
                            .filter(shot => role === 'EMPLOYEE' ? shot.imageUrl?.startsWith('/uploads') : true) // Employees only see REAL data
                            .slice(0, 5)
                            .map((shot) => (
                                <div key={shot.id} className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                                    <img
                                        src={getImageUrl(shot.imageUrl)}
                                        alt="Capture"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            e.target.src = 'https://placehold.co/600x400?text=Processing...';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-3">
                                        <div className="flex flex-col transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="h-4 w-4 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-[7px] font-bold text-white uppercase">
                                                    {shot.employee?.fullName?.charAt(0) || 'E'}
                                                </div>
                                                <span className="text-[9px] font-bold text-white truncate max-w-[80px]">
                                                    {role === 'EMPLOYEE' ? 'Me' : (shot.employee?.fullName || 'Employee')}
                                                </span>
                                            </div>
                                            <span className="text-[8px] font-bold text-white/70 uppercase flex items-center gap-1 tracking-wider">
                                                <Clock size={8} />
                                                {new Date(shot.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Status Badge */}
                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-500/90 backdrop-blur-md rounded text-[8px] font-black text-white uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                        {shot.imageUrl.startsWith('/uploads') ? 'Live' : 'Simulator'}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            <AddEmployeeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}