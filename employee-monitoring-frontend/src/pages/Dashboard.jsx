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
import { GlobalCalendar } from '../components/GlobalCalendar';
import { useRealTime } from '../hooks/RealTimeContext';
import { useAuthStore } from '../store/authStore';
import { useLiveTimeDisplay, useSessionTimer } from '../hooks/useLiveTime';
import { parseTimeValueToSeconds } from '../utils/timeFormat';
import { API_BASE_URL, BASE_URL } from '../config/api';

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
import { WorkSessionBanner } from '../components/dashboard/WorkSessionBanner';
import { ComparativeKpiGrid } from '../components/dashboard/ComparativeKpiGrid';
import { ProductivityStackedChart } from '../components/dashboard/ProductivityStackedChart';
import { PeriodComparisonBar } from '../components/dashboard/PeriodComparisonBar';
import { EmployeeWorkforceAnalytics } from '../components/dashboard/EmployeeWorkforceAnalytics';

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

export function Dashboard() {
    const { employees: contextEmployees, teams: contextTeams, stats: realTimeStats, isLoading: isRealTimeLoading } = useRealTime();
    const { role, isClockedIn, isOnBreak } = useAuthStore();
    const sessionSeconds = useSessionTimer();
    const { dateRange, setDateRange } = useFilterStore();
    const { start: startDate, end: endDate } = dateRange || {};
    const [compareStartDate, setCompareStartDate] = useState(null);
    const [compareEndDate, setCompareEndDate] = useState(null);
    const [activeFilter, setActiveFilter] = useState({ employeeId: null, teamId: null, role: null });
    const [activeChartTab, setActiveChartTab] = useState('Activities');
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
                    data = await dashboardService.getAdminDashboard(startDate, endDate, compareStartDate, compareEndDate);
                } else if (role === 'MANAGER') {
                    data = await dashboardService.getManagerDashboard(startDate, endDate, compareStartDate, compareEndDate);
                } else {
                    data = await dashboardService.getEmployeeDashboard(startDate, endDate, compareStartDate, compareEndDate);
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
    }, [role, startDate, endDate, compareStartDate, compareEndDate]);

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

    const sec = useMemo(() => {
        const rawSec = stats?.summarySeconds || {};
        if (!isToday) {
            return rawSec;
        }
        if (!isClockedIn) {
            return {
                ...rawSec,
                workTime: 0,
                activeTime: 0,
                productiveTime: 0,
            };
        }
        return {
            ...rawSec,
            workTime: sessionSeconds,
            activeTime: sessionSeconds,
            productiveTime: sessionSeconds,
        };
    }, [stats?.summarySeconds, isToday, isClockedIn, sessionSeconds]);

    const liveTick = useMemo(() => {
        if (!isToday) return false;
        // Only tick when clocked in and not on break
        return isClockedIn && !isOnBreak;
    }, [isToday, isClockedIn, isOnBreak]);

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
        <div className="w-full">
            {role === 'EMPLOYEE' && <WorkSessionBanner />}

            {/* Insightful Module Quick Switcher */}
            {(() => {
                const roleBase = `/${(role || 'employee').toLowerCase()}`;
                return (
                    <div className="flex items-center gap-2.5 mb-6 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            onClick={() => navigate(roleBase)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#30382B] text-white shadow-warm-xs whitespace-nowrap cursor-pointer"
                        >
                            <Zap size={14} className="text-[#D3B98D]" />
                            <span>Productivity Trends</span>
                        </button>
                        <button
                            onClick={() => navigate(`${roleBase}/activities`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#FBF9F5] dark:bg-[#252B20] text-[#29291F] dark:text-[#F5F1E9] border border-[#E5DED2] dark:border-[#384232] hover:bg-[#EEE8DD] transition-all shadow-warm-xs whitespace-nowrap cursor-pointer"
                        >
                            <Activity size={14} className="text-[#B9955B]" />
                            <span>Activities Timeline</span>
                        </button>
                        {role !== 'EMPLOYEE' && (
                            <>
                                <button
                                    onClick={() => navigate(`${roleBase}/reports/location-insights`)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#FBF9F5] dark:bg-[#252B20] text-[#29291F] dark:text-[#F5F1E9] border border-[#E5DED2] dark:border-[#384232] hover:bg-[#EEE8DD] transition-all shadow-warm-xs whitespace-nowrap cursor-pointer"
                                >
                                    <Globe size={14} className="text-[#5E7D64]" />
                                    <span>Office vs Remote</span>
                                </button>
                                <button
                                    onClick={() => navigate(`${roleBase}/reports/apps-websites`)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#FBF9F5] dark:bg-[#252B20] text-[#29291F] dark:text-[#F5F1E9] border border-[#E5DED2] dark:border-[#384232] hover:bg-[#EEE8DD] transition-all shadow-warm-xs whitespace-nowrap cursor-pointer"
                                >
                                    <Monitor size={14} className="text-[#30382B] dark:text-[#D3B98D]" />
                                    <span>Apps & Websites Usage</span>
                                </button>
                            </>
                        )}
                    </div>
                );
            })()}

            {/* Reference Period vs Compared Period Bar (Insightful Image 1) */}
            <PeriodComparisonBar
                startDate={startDate}
                endDate={endDate}
                compareStartDate={compareStartDate || stats.comparison?.comparedPeriod?.startDate}
                compareEndDate={compareEndDate || stats.comparison?.comparedPeriod?.endDate}
                onDateRangeChange={(start, end) => setDateRange(start, end)}
                onCompareRangeChange={(start, end) => {
                    setCompareStartDate(start);
                    setCompareEndDate(end);
                }}
                onFilterChange={(filters) => setActiveFilter(filters)}
                onExport={handleDownload}
                employees={dashboardData?.employees || []}
                teams={dashboardData?.teams || []}
                role={role}
            />

            {/* 8 Comparative KPI Cards (Insightful Image 1) */}
            <ComparativeKpiGrid
                sec={sec}
                stats={stats}
                deltas={stats.comparison?.deltas}
                liveTick={liveTick}
                role={role}
            />

            {/* Main Visualizations: Stacked Productivity, Activities & Timeline (Insightful Image 2) */}
            <ProductivityStackedChart
                intradayData={chartData}
                productivityBreakdown={stats.productivityBreakdown}
                onExport={handleDownload}
            />
        </div>
    );
}