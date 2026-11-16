import React, { useState, useEffect, useRef } from 'react';
import {
    MapPin,
    Building2,
    Home,
    Share2,
    Calendar as CalendarIcon,
    Download,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    X,
    User,
    Users2,
    Globe2,
    HelpCircle,
    Monitor,
    Plus,
    Settings as SettingsIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocationStore } from '../../store/locationStore';
import { useRealTime } from '../../hooks/RealTimeContext';
import { cn } from '../../utils/cn';
import { LiveMapView } from '../../components/location/LiveMapView';

import { useReportsStore } from '../../store/reportsStore';
import { useFilterStore } from '../../store/filterStore';
import { FilterDropdown } from '../../components/FilterDropdown';
import { ReportsCalendar } from '../../components/ReportsCalendar';

const presets = [
    "Today", "Yesterday", "This Week", "Last 7 Days",
    "Previous Week", "This Month", "Previous Month",
    "Last 3 Months", "Last 6 Months"
];

export function LocationInsights() {
    const navigate = useNavigate();
    const { locationSettings, updateThreshold } = useLocationStore();
    const { locations, attendanceThreshold: globalThreshold } = locationSettings;
    const { locationLogs } = useRealTime();
    
    const { reportData, fetchReportData, loading } = useReportsStore();
    const { selectedEmployee, selectedTeam } = useFilterStore();
    const rawData = reportData['location'] || [];

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    // Default to Today
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [selectedPreset, setSelectedPreset] = useState("Today");

    const getDatesFromPreset = (preset) => {
        const end = new Date();
        const start = new Date();
        switch (preset) {
            case 'Today': start.setHours(0, 0, 0, 0); break;
            case 'Yesterday': 
                start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() - 1); end.setHours(23, 59, 59, 999);
                break;
            case 'This Week': start.setDate(start.getDate() - start.getDay()); break;
            case 'Last 7 Days': start.setDate(start.getDate() - 7); break;
            case 'Last 30 Days': start.setDate(start.getDate() - 30); break;
            case 'This Month': start.setDate(1); break;
            case 'Custom': 
                // Handled by direct state updates
                return { start: startDate, end: endDate };
            default: start.setDate(start.getDate() - 7);
        }
        return { start, end };
    };

    // 1. Update dates when preset changes
    useEffect(() => {
        if (selectedPreset !== 'Custom') {
            const { start, end } = getDatesFromPreset(selectedPreset);
            setStartDate(start);
            setEndDate(end);
        }
    }, [selectedPreset]);

    // 2. Fetch data when dates change
    useEffect(() => {
        if (startDate && endDate) {
            fetchReportData('location', { 
                startDate, 
                endDate,
                userId: selectedEmployee,
                teamId: selectedTeam
            });
        }
    }, [startDate?.getTime(), endDate?.getTime(), fetchReportData, selectedEmployee, selectedTeam]);

    const activeData = React.useMemo(() => {
        return rawData.map(item => ({
            location: item.name,
            hours: Math.round(item.workHours * 10) / 10,
            employees: item.employees
        }));
    }, [rawData]);

    // --- Refs ---
    const calendarRef = useRef(null);
    const filterRef = useRef(null);

    // --- Outside Click Detection ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target) && !event.target.closest('.loc-cal-toggle')) {
                setIsCalendarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleApply = () => {
        setIsCalendarOpen(false);
    };

    const handleCancel = () => {
        setIsCalendarOpen(false);
    };


    const getIcon = (loc) => {
        if (loc === 'Office') return <Building2 size={24} />;
        if (loc === 'Remote') return <Home size={24} />;
        return <Share2 size={24} />;
    };

    const maxHours = locations.length > 0 ? Math.max(...locations.map(d => d.attendanceThreshold * 1.5 || 10), 1) : 1;

    const formatDateRange = () => {
        if (selectedPreset !== 'Custom') return selectedPreset;
        if (!endDate) return startDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Select range';
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    return (
        <div className="space-y-6 relative z-30">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Location Insights</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">View and analyze your location data.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className={`loc-cal-toggle flex w-full sm:w-auto items-center justify-between sm:justify-start gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm ring-1 transition-all ${isCalendarOpen ? 'bg-primary-50 text-primary-600 ring-primary-100 dark:bg-primary-900/20 dark:text-primary-400' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800'}`}
                        >
                            <div className="flex items-center gap-2">
                                <CalendarIcon size={16} className={isCalendarOpen ? 'text-primary-600' : 'text-slate-400'} />
                                <span>{formatDateRange()}</span>
                            </div>
                            <ChevronDown size={14} className={cn("transition-transform duration-200 sm:hidden", isCalendarOpen && "rotate-180")} />
                        </button>

                        {isCalendarOpen && (
                            <div className="absolute right-0 mt-2 z-50">
                                <ReportsCalendar 
                                    selectedPreset={selectedPreset}
                                    setSelectedPreset={setSelectedPreset}
                                    startDate={startDate}
                                    setStartDate={setStartDate}
                                    endDate={endDate}
                                    setEndDate={setEndDate}
                                    isRange={true}
                                    onApply={handleApply}
                                    onCancel={handleCancel}
                                />
                            </div>
                        )}
                    </div>

                    <FilterDropdown />
                </div>
            </div>

            {/* Location Cards removed - Map only */}
            {activeData.length > 0 ? (
                <div className="space-y-6">
                    {/* Map Placeholder -> Live Map View */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                        <LiveMapView />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Monitor size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Office Locations</h3>
                    <p className="text-slate-500 text-center max-w-sm mb-8">
                        Add at least one location to take advantage of location insights throughout the Insightful.
                    </p>
                    <button 
                        onClick={() => navigate('/settings/reports/location-insights')}
                        className="h-12 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all dark:bg-white dark:text-slate-900"
                    >
                        Configure Locations
                    </button>
                </div>
            )}
        </div>
    );
}
