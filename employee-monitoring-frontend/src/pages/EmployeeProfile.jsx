import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Mail, Users, MapPin, DollarSign,
    Calendar, Clock, Shield, ArrowLeft,
    TrendingUp, Monitor, Globe
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useEmployeeStore } from '../store/employeeStore';
import employeeService from '../services/employeeService';
import activityService from '../services/activityService';
import api from '../services/apiClient';

export function EmployeeProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { employees } = useEmployeeStore();
    const [employee, setEmployee] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activityTrend, setActivityTrend] = useState([]);
    const [topApps, setTopApps] = useState([]);
    const [stats, setStats] = useState({
        totalHours: '00:00',
        productivity: '0%',
        activity: '0%'
    });

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const response = await employeeService.getEmployeeById(id);
                setEmployee(response.data);
            } catch (error) {
                console.error("Failed to fetch employee details:", error);
                const found = employees.find(e => e.id === id);
                if (found) setEmployee(found);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchStats = async () => {
            try {
                const res = await activityService.getEmployeeSummary(id);
                if (res.success && res.data && Array.isArray(res.data)) {
                    const summaries = res.data;
                    
                    // Aggregate stats across all days
                    let totalWorkHrs = 0;
                    let totalActiveHrs = 0;
                    let totalProductiveHrs = 0;

                    summaries.forEach(day => {
                        totalWorkHrs += day.workHours || 0;
                        totalActiveHrs += day.activeHours || 0;
                        totalProductiveHrs += day.productiveHours || 0;
                    });

                    const productivityPct = totalActiveHrs > 0 ? Math.round((totalProductiveHrs / totalActiveHrs) * 100) : 0;
                    const utilizationPct = totalWorkHrs > 0 ? Math.round((totalActiveHrs / totalWorkHrs) * 100) : 0;

                    const formatHrs = (h) => {
                        if (!h || isNaN(h)) return '00:00';
                        const whole = Math.floor(h);
                        const mins = Math.round((h % 1) * 60);
                        return `${String(whole).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
                    };

                    setStats({
                        totalHours: formatHrs(totalActiveHrs), // Showing active hours as "Total Hours"
                        productivity: `${productivityPct}%`,
                        activity: `${utilizationPct}%`
                    });

                    // Generate 7-day activity trend from real database summaries
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const summaryByDate = {};
                    summaries.forEach(s => { summaryByDate[s.date] = s; });

                    const latestDateStr = summaries.length > 0 ? summaries[0].date : new Date().toISOString().split('T')[0];
                    const refDate = new Date(latestDateStr);

                    const trendDays = [];
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date(refDate);
                        d.setDate(refDate.getDate() - i);
                        const dStr = d.toISOString().split('T')[0];
                        const daySummary = summaryByDate[dStr];
                        trendDays.push({
                            name: dayNames[d.getDay()],
                            date: dStr,
                            active: daySummary ? Number((daySummary.activeHours || 0).toFixed(1)) : 0,
                            idle: daySummary ? Number((daySummary.idleHours || 0).toFixed(1)) : 0
                        });
                    }
                    setActivityTrend(trendDays);
                } else {
                    // Default values if no data
                    setStats({
                        totalHours: '00:00',
                        productivity: '0%',
                        activity: '0%'
                    });
                    setActivityTrend([]);
                }
            } catch (err) {
                console.error("Failed to fetch stats:", err);
                setStats({
                    totalHours: '00:00',
                    productivity: '0%',
                    activity: '0%'
                });
                setActivityTrend([]);
            }

            // Fetch real top applications & websites from MySQL database
            try {
                const appsRes = await api.get('/reports', {
                    params: { type: 'apps-websites', userId: id }
                });
                const appsList = appsRes.data?.data?.apps || appsRes.data?.apps || [];
                const formattedApps = appsList.slice(0, 5).map(app => ({
                    name: app.name,
                    duration: app.timeFormatted || `${Math.floor((app.duration || 0) / 3600)}h ${Math.floor(((app.duration || 0) % 3600) / 60)}m`,
                    percentage: Math.round(app.usagePercent || 0),
                    type: app.productivity === 'PRODUCTIVE' ? 'Productive' : app.productivity === 'UNPRODUCTIVE' ? 'Unproductive' : 'Neutral'
                }));
                setTopApps(formattedApps);
            } catch (err) {
                console.error("Failed to fetch top apps:", err);
                setTopApps([]);
            }
        };

        fetchDetail();
        fetchStats();
    }, [id, employees]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B9955B]"></div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="p-8 text-center text-[#777367] dark:text-[#B8B3A7]">
                Employee not found.
                <button onClick={() => navigate(-1)} className="block mx-auto mt-4 text-[#B9955B] hover:underline font-semibold text-xs cursor-pointer">
                    Go Back
                </button>
            </div>
        );
    }

    const employeeInitials = (employee.name || employee.fullName || 'E')
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const isCustomAvatar = employee.avatar && !employee.avatar.includes('ui-avatars.com');

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 text-[#29291F] dark:text-[#F5F1E9]">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#777367] dark:text-[#B8B3A7] hover:text-[#30382B] dark:hover:text-[#D3B98D] transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 text-[#B9955B]" />
                    Back to Employees
                </button>
                <div className="flex space-x-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        (employee.status || '').toLowerCase() === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20'
                            : (employee.status || '').toLowerCase() === 'invited'
                            ? 'bg-[#EEE8DD] dark:bg-[#1E2419] text-[#B9955B] dark:text-[#D3B98D] border-[#D6CDBC] dark:border-[#384232]'
                            : 'bg-[#EEE8DD] dark:bg-[#1E2419] text-[#777367] dark:text-[#B8B3A7] border-[#D6CDBC] dark:border-[#384232]'
                    }`}>
                        {employee.status || 'OFFLINE'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1 bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl p-6 shadow-warm-xs border border-[#D6CDBC] dark:border-[#384232] space-y-6">
                    <div className="flex flex-col items-center text-center">
                        {isCustomAvatar ? (
                            <img
                                src={employee.avatar}
                                alt={employee.name || employee.fullName}
                                className="w-24 h-24 rounded-full object-cover border-2 border-[#D6CDBC] dark:border-[#384232] shadow-sm mb-4"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-[#EEE8DD] dark:bg-[#1E2419] border-2 border-[#D6CDBC] dark:border-[#384232] flex items-center justify-center text-2xl font-serif font-bold text-[#30382B] dark:text-[#D3B98D] shadow-inner mb-4">
                                {employeeInitials}
                            </div>
                        )}
                        <h2 className="font-serif text-2xl font-normal text-[#29291F] dark:text-[#F5F1E9] tracking-tight">
                            {employee.name || employee.fullName}
                        </h2>
                        <p className="text-xs font-semibold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.12em] mt-1">
                            {employee.role}
                        </p>
                    </div>

                    <div className="space-y-4 border-t border-[#D6CDBC]/60 dark:border-[#384232] pt-6">
                        <div className="flex items-center text-xs font-medium text-[#29291F] dark:text-[#E2E8DE]">
                            <Mail className="w-4 h-4 mr-3 text-[#B9955B] dark:text-[#D3B98D] shrink-0" />
                            <span className="truncate">{employee.email}</span>
                        </div>
                        <div className="flex items-center text-xs font-medium text-[#29291F] dark:text-[#E2E8DE]">
                            <Users className="w-4 h-4 mr-3 text-[#B9955B] dark:text-[#D3B98D] shrink-0" />
                            <span>{employee.team || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center text-xs font-medium text-[#29291F] dark:text-[#E2E8DE]">
                            <MapPin className="w-4 h-4 mr-3 text-[#B9955B] dark:text-[#D3B98D] shrink-0" />
                            <span>{employee.location || 'Remote'}</span>
                        </div>
                        <div className="flex items-center text-xs font-medium text-[#29291F] dark:text-[#E2E8DE]">
                            <DollarSign className="w-4 h-4 mr-3 text-[#B9955B] dark:text-[#D3B98D] shrink-0" />
                            <span>${employee.hourlyRate || 0.00} / hour</span>
                        </div>
                    </div>
                </div>

                {/* Activity & Stats */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Total Hours', value: stats.totalHours, icon: Clock, iconColor: 'text-[#B9955B] dark:text-[#D3B98D]', bg: 'bg-[#EEE8DD] dark:bg-[#1E2419]' },
                            { label: 'Productivity', value: stats.productivity, icon: TrendingUp, iconColor: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100/60 dark:bg-emerald-500/10' },
                            { label: 'Activity', value: stats.activity, icon: Shield, iconColor: 'text-[#30382B] dark:text-[#D3B98D]', bg: 'bg-[#EEE8DD] dark:bg-[#1E2419]' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-[#FBF9F5] dark:bg-[#252B20] p-4 sm:p-5 rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`p-2 rounded-xl ${stat.bg} border border-[#D6CDBC]/50 dark:border-[#384232]/50`}>
                                        <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-serif text-2xl sm:text-3xl font-medium text-[#29291F] dark:text-[#F5F1E9] tracking-tight">{stat.value}</p>
                                    <p className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mt-1">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl p-6 shadow-warm-xs border border-[#D6CDBC] dark:border-[#384232] min-h-[300px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif text-lg font-medium text-[#29291F] dark:text-[#F5F1E9] border-l-3 border-[#B9955B] pl-3">
                                Employee Activity Summary
                            </h3>
                            <div className="flex items-center text-xs font-semibold text-[#777367] dark:text-[#B8B3A7]">
                                <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#B9955B]" />
                                Last 7 Days
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="h-64">
                                <p className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-wider mb-4">
                                    Activity Trend (Hours)
                                </p>
                                {activityTrend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={activityTrend}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(214, 205, 188, 0.25)" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#777367' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#777367' }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#252B20', borderColor: '#384232', color: '#F5F1E9', borderRadius: '12px' }} />
                                            <Bar dataKey="active" name="Active" fill="#B9955B" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="idle" name="Idle" fill="#777367" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-[#777367] dark:text-[#B8B3A7] font-semibold">
                                        No activity logs recorded for this employee yet.
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-wider">
                                    Top Applications & Websites
                                </p>
                                {topApps.length > 0 ? (
                                    <div className="space-y-3">
                                        {topApps.map((app, index) => (
                                            <div key={index} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-semibold text-[#29291F] dark:text-[#F5F1E9]">{app.name}</span>
                                                    <span className="text-[#777367] dark:text-[#B8B3A7] font-medium">{app.duration} ({app.percentage}%)</span>
                                                </div>
                                                <div className="w-full bg-[#EEE8DD] dark:bg-[#1E2419] h-2 rounded-full overflow-hidden border border-[#D6CDBC]/40 dark:border-[#384232]/40">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            app.type === 'Productive' ? 'bg-emerald-600 dark:bg-emerald-500' : app.type === 'Unproductive' ? 'bg-[#A84B4B]' : 'bg-[#B9955B]'
                                                        }`}
                                                        style={{ width: `${Math.min(app.percentage, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-40 flex items-center justify-center text-xs text-[#777367] dark:text-[#B8B3A7] font-semibold">
                                        No tracked application usage for this employee.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
