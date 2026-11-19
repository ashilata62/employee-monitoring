import React, { useState, useEffect, useMemo } from 'react';
import {
    MapPin,
    Building2,
    Home,
    Download,
    Search,
    Users,
    Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import api from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import { InsightfulModuleSwitcher } from '../../components/common/InsightfulModuleSwitcher';

const cleanLocation = (loc) => {
    if (!loc) return 'Office';
    const s = String(loc).toLowerCase();
    if (s.includes('office') || s.includes('in-office')) return 'Office';
    if (s.includes('remote')) return 'Remote';
    if (s.includes('hybrid')) return 'Hybrid';
    return 'Office';
};

// Circular Gauge Component (Insightful Style)
const CircularUtilizationGauge = ({ percentage = 0, location, color, trackColor }) => {
    const radius = 64;
    const strokeWidth = 14;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex items-center gap-5 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex-1">
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
const MetricCompareBar = ({ label, officeVal = 0, remoteVal = 0, officeHours = '00:00 h', remoteHours = '00:00 h' }) => {
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
    const [locationReport, setLocationReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocationFilter, setSelectedLocationFilter] = useState('ALL');

    useEffect(() => {
        const fetchLocationData = async (isBackground = false) => {
            if (!isBackground) setLoading(true);
            try {
                // Fetch real location report from database
                const res = await api.get('/reports?type=location');
                const data = res.data?.data || res.data || {};
                setLocationReport(data);
            } catch (err) {
                console.error('Failed to load location report:', err);
            } finally {
                if (!isBackground) setLoading(false);
            }
        };

        fetchLocationData();
        const interval = setInterval(() => fetchLocationData(true), 30000);
        return () => clearInterval(interval);
    }, []);

    const rolePrefix = role ? `/${role.toLowerCase()}` : '/admin';

    const employees = useMemo(() => {
        return locationReport?.employees || [];
    }, [locationReport]);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLoc = selectedLocationFilter === 'ALL' || (emp.location || '').toUpperCase() === selectedLocationFilter;
            return matchesSearch && matchesLoc;
        });
    }, [employees, searchQuery, selectedLocationFilter]);

    const handleExport = () => {
        const headers = ['Employee Name', 'Location', 'Work Time', 'Productive Time', 'Utilization'];
        const rows = filteredEmployees.map(e => [e.name, e.location, e.workTime, e.productiveTime, `${e.utilization}%`]);
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

    const officeData = locationReport?.office || { utilization: 0, workHours: '00:00 h', productiveHours: '00:00 h', activeHours: '00:00 h', workVal: 0, prodVal: 0, actVal: 0 };
    const remoteData = locationReport?.remote || { utilization: 0, workHours: '00:00 h', productiveHours: '00:00 h', activeHours: '00:00 h', workVal: 0, prodVal: 0, actVal: 0 };
    const timelineData = locationReport?.timeline || [];

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

            {/* ── Main Two-Column Layout ────────────────────────────────────────── */}
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
                        </select>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[560px] overflow-y-auto">
                        {filteredEmployees.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400 font-semibold">
                                No employees found for this filter.
                            </div>
                        ) : (
                            filteredEmployees.map((emp) => (
                                <div key={emp.id} className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-300">
                                            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                {emp.name}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                Work: {emp.workTime} • Prod: {emp.productiveTime}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                        emp.location === 'Office'
                                            ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                                            : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                        {emp.location}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Right Column: Comparative Gauges & Metric Bars (7 Cols) ───────── */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                                Office vs Remote
                            </h2>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#0284c7]" /> Office
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Remote
                                </span>
                            </div>
                        </div>

                        {/* Comparative Utilization Gauges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CircularUtilizationGauge
                                percentage={officeData.utilization}
                                location="Office"
                                color="#0284c7"
                                trackColor="#e0f2fe"
                            />
                            <CircularUtilizationGauge
                                percentage={remoteData.utilization}
                                location="Remote"
                                color="#f59e0b"
                                trackColor="#fef3c7"
                            />
                        </div>

                        {/* Metric Comparison Bars */}
                        <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                            <MetricCompareBar
                                label="Work Time"
                                officeVal={officeData.workVal}
                                remoteVal={remoteData.workVal}
                                officeHours={officeData.workHours}
                                remoteHours={remoteData.workHours}
                            />
                            <MetricCompareBar
                                label="Productive Time"
                                officeVal={officeData.prodVal}
                                remoteVal={remoteData.prodVal}
                                officeHours={officeData.productiveHours}
                                remoteHours={remoteData.productiveHours}
                            />
                            <MetricCompareBar
                                label="Computer Activity"
                                officeVal={officeData.actVal}
                                remoteVal={remoteData.actVal}
                                officeHours={officeData.activeHours}
                                remoteHours={remoteData.activeHours}
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
                            {timelineData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">
                                    No location timeline data available for this range.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LocationInsights;
