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

const mockActivityData = [
    { name: 'Mon', active: 6.5, idle: 1.2 },
    { name: 'Tue', active: 7.2, idle: 0.5 },
    { name: 'Wed', active: 5.8, idle: 1.8 },
    { name: 'Thu', active: 6.9, idle: 0.8 },
    { name: 'Fri', active: 6.2, idle: 1.1 },
    { name: 'Sat', active: 0, idle: 0 },
    { name: 'Sun', active: 0, idle: 0 },
];

const mockTopApps = [
    { name: 'Visual Studio Code', duration: '22h 15m', percentage: 70, type: 'Productive' },
    { name: 'Google Chrome', duration: '5h 45m', percentage: 18, type: 'Neutral' },
    { name: 'Slack', duration: '2h 30m', percentage: 8, type: 'Productive' },
    { name: 'Zoom Meetings', duration: '1h 10m', percentage: 4, type: 'Productive' },
];

export function EmployeeProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { employees } = useEmployeeStore();
    const [employee, setEmployee] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
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
                } else {
                    // Default values if no data
                    setStats({
                        totalHours: '00:00',
                        productivity: '0%',
                        activity: '0%'
                    });
                }
            } catch (err) {
                console.error("Failed to fetch stats:", err);
                setStats({
                    totalHours: '00:00',
                    productivity: '0%',
                    activity: '0%'
                });
            }
        };

        fetchDetail();
        fetchStats();
    }, [id, employees]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="p-8 text-center text-gray-500">
                Employee not found.
                <button onClick={() => navigate(-1)} className="block mx-auto mt-4 text-indigo-600 hover:underline">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Employees
                </button>
                <div className="flex space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${employee.status === 'active' ? 'bg-green-100 text-green-700' :
                            employee.status === 'invited' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                        }`}>
                        {employee.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
                    <div className="flex flex-col items-center text-center">
                        <img
                            src={employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || employee.fullName)}&background=random`}
                            alt={employee.name}
                            className="w-24 h-24 rounded-full border-4 border-indigo-50 mb-4"
                        />
                        <h2 className="text-xl font-bold text-gray-900">{employee.name || employee.fullName}</h2>
                        <p className="text-gray-500 text-sm mt-1">{employee.role}</p>
                    </div>

                    <div className="space-y-4 border-t border-gray-50 pt-6">
                        <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-3 text-gray-400" />
                            {employee.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <Users className="w-4 h-4 mr-3 text-gray-400" />
                            {employee.team || 'Unassigned'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                            {employee.location || 'Remote'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="w-4 h-4 mr-3 text-gray-400" />
                            ${employee.hourlyRate || 0.00} / hour
                        </div>
                    </div>
                </div>

                {/* Activity & Stats */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Total Hours', value: stats.totalHours, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Productivity', value: stats.productivity, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Activity', value: stats.activity, icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900 border-l-4 border-indigo-600 pl-3">Employee Activity Summary</h3>
                            <div className="flex items-center text-xs text-gray-400">
                                <Calendar className="w-3 h-3 mr-1" />
                                Last 7 Days
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="h-64">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Activity Trend (Hours)</p>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mockActivityData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="active" name="Active" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="idle" name="Idle" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Applications & Websites</p>
                                <div className="space-y-3">
                                    {mockTopApps.map((app, index) => (
                                        <div key={index} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{app.name}</span>
                                                <span className="text-slate-500 font-medium">{app.duration} ({app.percentage}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${
                                                        app.type === 'Productive' ? 'bg-emerald-500' : 'bg-slate-400'
                                                    }`}
                                                    style={{ width: `${app.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
