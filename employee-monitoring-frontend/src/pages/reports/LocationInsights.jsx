import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    MapPin,
    Building2,
    Home,
    Share2,
    Calendar as CalendarIcon,
    Download,
    ChevronDown,
    Search,
    Users,
    Briefcase,
    TrendingUp,
    Monitor,
    Zap,
    Filter,
    ArrowRightLeft,
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import api from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import { InsightfulModuleSwitcher } from '../../components/common/InsightfulModuleSwitcher';

const cleanLocation = (loc) => {
    if (!loc) return 'Office';
    const s = String(loc).toLowerCase();
    if (s.includes('office') || s.includes('in-office')) return 'Office';
    if (s.includes('hybrid')) return 'Hybrid';
    if (s.includes('remote')) return 'Remote';
    return 'Remote';
};

// Circular Gauge Component (Insightful Style)
const CircularUtilizationGauge = ({ percentage, location, color, trackColor }) => {
    const radius = 64;
    const strokeWidth = 14;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex items-center gap-5 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="relative flex items-center justify-center">
                <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
                    <circle
                        stroke={trackColor || "#e2e8f0"}
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <circle
                        stroke={color || "#0ea5e9"}
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference + " " + circumference}
                        style={{ strokeDashoffset, transition: "stroke-dashoffset 0.8s ease-in-out" }}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                    <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                        {percentage}%
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                        Utilization
                    </span>
                </div>
            </div>
            <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    LOCATION
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                    {location}
                </span>
            </div>
        </div>
    );
};

// Comparative Metric Bar (Work Time, Productive Time, Computer Activity)
const MetricCompareBar = ({ label, officeVal, remoteVal, officeHours, remoteHours }) => {
    const total = Math.max(officeVal + remoteVal, 1);
    const officePct = Math.round((officeVal / total) * 100);
    const remotePct = 100 - officePct;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="tabular-nums text-slate-900 dark:text-white font-extrabold">{officeHours}</span>
                <span className="text-slate-500 font-semibold">{label}</span>
                <span className="tabular-nums text-slate-900 dark:text-white font-extrabold">{remoteHours}</span>
            </div>
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 gap-1 p-0.5">
                <div
                    className="h-full rounded-full bg-[#38bdf8] transition-all duration-700"
                    style={{ width: `${officePct}%` }}
                    title={`Office: ${officeHours} (${officePct}%)`}
                />
                <div
                    className="h-full rounded-full bg-[#fde047] transition-all duration-700"
                    style={{ width: `${remotePct}%` }}
                    title={`Remote: ${remoteHours} (${remotePct}%)`}
                />
            </div>
        </div>
    );
};

export function LocationInsights() {
    const { role } = useAuthStore();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocationFilter, setSelectedLocationFilter] = useState('ALL');

    useEffect(() => {
        const fetchLocationData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/employees');
                const list = res.data?.data || res.data || [];
                setEmployees(list);
            } catch (err) {
                console.error('Failed to load employee locations:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLocationData();
    }, []);

    // Standard demo employees matching Insightful reference image 1 if DB is sparse
    const displayEmployees = useMemo(() => {
        if (employees.length > 0) {
            return employees.map((emp, idx) => ({
                id: emp.id,
                name: emp.fullName || emp.name || `Employee ${idx + 1}`,
                location: cleanLocation(emp.location || (idx % 3 === 0 ? 'Office' : idx % 3 === 1 ? 'Remote' : 'Hybrid')),
                avatar: emp.avatar || null,
                workTime: '08:30 h',
                productiveTime: '07:15 h'
            }));
        }
        return [
            { id: '1', name: 'Richard Smith', location: 'Office', workTime: '08:35 h', productiveTime: '07:20 h' },
            { id: '2', name: 'Jessica Anderson', location: 'Remote', workTime: '16:00 h', productiveTime: '14:00 h' },
            { id: '3', name: 'Mike Stevenson', location: 'Hybrid', workTime: '12:15 h', productiveTime: '10:45 h' },
            { id: '4', name: 'Emily Davis', location: 'Office', workTime: '08:10 h', productiveTime: '07:05 h' },
            { id: '5', name: 'David Wilson', location: 'Remote', workTime: '08:45 h', productiveTime: '08:00 h' }
        ];
    }, [employees]);

    const filteredEmployees = useMemo(() => {
        return displayEmployees.filter(emp => {
            const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLoc = selectedLocationFilter === 'ALL' || emp.location.toUpperCase() === selectedLocationFilter;
            return matchesSearch && matchesLoc;
        });
    }, [displayEmployees, searchQuery, selectedLocationFilter]);

    const rolePrefix = role ? `/${role.toLowerCase()}` : '/admin';

    const handleExport = () => {
        const headers = ['Employee Name', 'Location', 'Work Time', 'Productive Time'];
        const rows = filteredEmployees.map(e => [e.name, e.location, e.workTime, e.productiveTime]);
        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `office-vs-remote-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Timeline - Location stacked chart data (Matching Insightful Reference Image 1)
    const timelineLocationData = [
        { day: 'Jun 01', office: 6.5, remote: 2.0 },
        { day: 'Jun 02', office: 8.0, remote: 1.5 },
        { day: 'Jun 03', office: 4.2, remote: 5.0 },
        { day: 'Jun 04', office: 2.5, remote: 6.5 },
        { day: 'Jun 07', office: 5.0, remote: 4.0 },
        { day: 'Jun 08', office: 4.0, remote: 4.5 },
        { day: 'Jun 09', office: 3.5, remote: 5.2 },
        { day: 'Jun 10', office: 2.0, remote: 6.8 },
        { day: 'Jun 13', office: 5.0, remote: 3.0 },
        { day: 'Jun 14', office: 4.5, remote: 3.5 }
    ];

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            {/* ── Top Insightful Module Switcher ────────────────────────────────────── */}
            <InsightfulModuleSwitcher activeTab="location" />

            {/* ── Top Header ──────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Building2 className="text-sky-500" size={28} />
                        Office vs Remote
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Compare productivity, utilization, and activity patterns between in-office and remote team members.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`${rolePrefix}/settings/reports/location-insights`)}
                        className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Configure Locations
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* ── Main Two-Column Layout (Matching Reference Image 1) ─────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* ── Left Column: Employee Location Table (5 Cols) ─────────────────── */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
                        </div>
                        <select
                            value={selectedLocationFilter}
                            onChange={(e) => setSelectedLocationFilter(e.target.value)}
                            className="text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none"
                        >
                            <option value="ALL">All</option>
                            <option value="OFFICE">Office</option>
                            <option value="REMOTE">Remote</option>
                            <option value="HYBRID">Hybrid</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/75 dark:bg-slate-800/40 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                                <tr>
                                    <th className="px-5 py-3.5">Employee ↓</th>
                                    <th className="px-5 py-3.5 text-right">Location</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs overflow-hidden">
                                                    {emp.avatar ? (
                                                        <img src={emp.avatar} alt={emp.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        emp.name.substring(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-white block">
                                                        {emp.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        Work: {emp.workTime}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black ${
                                                    emp.location === 'Office'
                                                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                                                        : emp.location === 'Remote'
                                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                                }`}
                                            >
                                                {emp.location}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Right Column: Office vs Remote Widgets & Timeline (7 Cols) ───── */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Top Office vs Remote Comparison Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                Office vs Remote
                            </h2>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#38bdf8]" /> Office
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#fde047]" /> Remote
                                </span>
                            </div>
                        </div>

                        {/* Circular Utilization Gauges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CircularUtilizationGauge
                                percentage={68.9}
                                location="Office"
                                color="#0284c7"
                                trackColor="#e0f2fe"
                            />
                            <CircularUtilizationGauge
                                percentage={92.5}
                                location="Remote"
                                color="#f59e0b"
                                trackColor="#fef3c7"
                            />
                        </div>

                        {/* Metric Comparison Bars */}
                        <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                            <MetricCompareBar
                                label="Work Time"
                                officeVal={8.58}
                                remoteVal={16.0}
                                officeHours="08:35 h"
                                remoteHours="16:00 h"
                            />
                            <MetricCompareBar
                                label="Productive Time"
                                officeVal={9.0}
                                remoteVal={14.0}
                                officeHours="09:00 h"
                                remoteHours="14:00 h"
                            />
                            <MetricCompareBar
                                label="Computer Activity"
                                officeVal={7.0}
                                remoteVal={14.0}
                                officeHours="07:00 h"
                                remoteHours="14:00 h"
                            />
                        </div>
                    </div>

                    {/* Timeline - Location Stacked Bar Chart */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                                Timeline - Location
                            </h3>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#38bdf8]" /> Office
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#fde047]" /> Remote
                                </span>
                            </div>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timelineLocationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="day"
                                        stroke="#94a3b8"
                                        fontSize={11}
                                        fontWeight={600}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={11}
                                        fontWeight={600}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `${val.toString().padStart(2, '0')} h`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0f172a',
                                            borderRadius: '12px',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: '12px',
                                            fontWeight: 600
                                        }}
                                        formatter={(val, name) => [`${val} h`, name === 'office' ? 'Office' : 'Remote']}
                                    />
                                    <Bar dataKey="office" stackId="a" fill="#38bdf8" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="remote" stackId="a" fill="#fde047" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LocationInsights;
