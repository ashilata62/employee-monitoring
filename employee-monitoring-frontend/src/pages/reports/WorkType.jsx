import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Monitor, Download } from 'lucide-react';
import { useReportsStore } from '../../store/reportsStore';
import { useFilterStore } from '../../store/filterStore';
import { FilterDropdown } from '../../components/FilterDropdown';
import { ReportsCalendar } from '../../components/ReportsCalendar';
import { ExportDropdown } from '../../components/common/ExportDropdown';

const CATEGORY_COLORS = {
    Productive: 'bg-emerald-500',
    Neutral: 'bg-blue-500',
    Unproductive: 'bg-rose-500',
};

const TAB_HELP = {
    category:
        'Time split by productivity level — Productive, Neutral, and Unproductive — based on how apps are classified in Settings.',
    tags:
        'Time split by your custom labels (Focus, Collaborative, Distraction, etc.) assigned in Settings → Productivity.',
};

const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

function formatProductivityLabel(value) {
    if (!value) return 'Unknown';
    return value.charAt(0) + value.slice(1).toLowerCase();
}

export function WorkType() {
    const { reportData, fetchReportData } = useReportsStore();
    const { selectedEmployee, selectedTeam } = useFilterStore();

    const [activeTab, setActiveTab] = useState('category');
    const [activePeriod, setActivePeriod] = useState('Today');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedPreset, setSelectedPreset] = useState('Today');
    const calendarRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                if (!event.target.closest('.calendar-toggle')) setIsCalendarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDatesFromPreset = (preset) => {
        const end = new Date();
        const start = new Date();
        switch (preset) {
            case 'Today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'Yesterday':
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case 'This Week':
                start.setDate(start.getDate() - start.getDay());
                break;
            case 'Last 7 Days':
                start.setDate(start.getDate() - 7);
                break;
            case 'Last 30 Days':
                start.setDate(start.getDate() - 30);
                break;
            case 'This Month':
                start.setDate(1);
                break;
            case 'Custom':
                start.setTime(selectedDate.getTime());
                start.setHours(0, 0, 0, 0);
                end.setTime(selectedDate.getTime());
                end.setHours(23, 59, 59, 999);
                break;
            default:
                start.setDate(start.getDate() - 7);
        }
        return { start, end };
    };

    useEffect(() => {
        const { start, end } = getDatesFromPreset(activePeriod);
        const params = {
            startDate: toYMD(start),
            endDate: toYMD(end),
            userId: selectedEmployee,
            teamId: selectedTeam,
        };
        fetchReportData('work-type', params);
        fetchReportData('work-type-tags', params);
    }, [activePeriod, fetchReportData, selectedEmployee, selectedTeam]);

    const categoryRaw = reportData['work-type'] || [];
    const tagsRaw = reportData['work-type-tags'] || [];

    const categoryData = useMemo(
        () =>
            categoryRaw.map((item) => {
                const name = formatProductivityLabel(item.productivity);
                return {
                    name,
                    hours: Math.round((item.duration / 3600) * 10) / 10,
                    color: CATEGORY_COLORS[name] || 'bg-slate-400',
                };
            }),
        [categoryRaw]
    );

    const tagsData = useMemo(
        () =>
            tagsRaw.map((item, idx) => ({
                name: item.tagName,
                hours: Math.round((item.duration / 3600) * 10) / 10,
                color: 'transition-all duration-700',
                barStyle: {
                    width: '0%',
                    backgroundColor: item.tagColor || '#94a3b8',
                },
                tagColor: item.tagColor,
                key: item.tagName || idx,
            })),
        [tagsRaw]
    );

    const activeData = activeTab === 'category' ? categoryData : tagsData;
    const totalHours = activeData.reduce((acc, curr) => acc + curr.hours, 0);

    const focusScore = useMemo(() => {
        if (totalHours <= 0) return 0;
        if (activeTab === 'category') {
            const productive = categoryData.find((d) => d.name === 'Productive')?.hours || 0;
            return Math.round((productive / totalHours) * 100);
        }
        const focus = tagsData.find((d) => d.name === 'Focus')?.hours || 0;
        const distraction = tagsData.find((d) => d.name === 'Distraction')?.hours || 0;
        const productiveLike = focus + (tagsData.find((d) => d.name === 'Learning')?.hours || 0);
        const denom = productiveLike + distraction || totalHours;
        return Math.round((productiveLike / denom) * 100);
    }, [activeTab, categoryData, tagsData, totalHours]);

    const handleApplyCalendar = () => {
        setActivePeriod(selectedPreset);
        setIsCalendarOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Reports</h1>
                        <div className="mt-4 flex items-center border-b border-slate-200 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setActiveTab('category')}
                                className={`px-4 py-2 text-sm font-bold transition-all relative ${activeTab === 'category' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Category
                                {activeTab === 'category' && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-full" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('tags')}
                                className={`px-4 py-2 text-sm font-bold transition-all relative ${activeTab === 'tags' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Tags
                                {activeTab === 'tags' && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-full" />
                                )}
                            </button>
                        </div>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                            {TAB_HELP[activeTab]}
                        </p>
                    </div>

                    <div className="relative z-30 flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                className={`calendar-toggle rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 shadow-sm ring-1 ${isCalendarOpen ? 'bg-primary-50 text-primary-600 ring-primary-100 dark:bg-primary-900/20 dark:text-primary-400' : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800'}`}
                            >
                                <Calendar size={14} />
                                {selectedPreset}
                            </button>
                            {isCalendarOpen && (
                                <div ref={calendarRef} className="absolute right-0 mt-2 z-50">
                                    <ReportsCalendar
                                        selectedPreset={selectedPreset}
                                        setSelectedPreset={setSelectedPreset}
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                        onApply={handleApplyCalendar}
                                        onCancel={() => setIsCalendarOpen(false)}
                                    />
                                </div>
                            )}
                        </div>
                        <FilterDropdown />
                        <ExportDropdown
                            data={activeData}
                            columns={[
                                { header: activeTab === 'category' ? 'Productivity Category' : 'Productivity Label / Tag', key: 'name' },
                                { header: 'Hours Tracked', key: 'hours', formatter: (val) => `${val}h` },
                                { header: 'Share of Work (%)', key: 'share', formatter: (_, row) => `${totalHours > 0 ? Math.round((row.hours / totalHours) * 100) : 0}%` },
                            ]}
                            fileName="work-type-report"
                            metadata={{
                                title: `Work Distribution (${activeTab === 'category' ? 'Category' : 'Tags'})`,
                                dateRange: activePeriod,
                                filters: `Tab: ${activeTab.toUpperCase()}, Total: ${totalHours}h`
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {activeData.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="mb-6 text-lg font-bold dark:text-white">
                                Distribution by {activeTab === 'category' ? 'Category' : 'Tags'}
                            </h3>
                            <div className="space-y-6">
                                {activeData.map((item) => {
                                    const pct = totalHours > 0 ? Math.round((item.hours / totalHours) * 100) : 0;
                                    const barWidth = totalHours > 0 ? `${pct}%` : '0%';
                                    return (
                                        <div key={item.key || item.name} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                    {activeTab === 'tags' && item.tagColor && (
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                                            style={{ backgroundColor: item.tagColor }}
                                                        />
                                                    )}
                                                    {item.name}
                                                </span>
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {item.hours}h ({pct}%)
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <div
                                                    className={`h-full rounded-full ${activeTab === 'category' ? item.color : ''}`}
                                                    style={
                                                        activeTab === 'tags'
                                                            ? { width: barWidth, backgroundColor: item.tagColor }
                                                            : { width: barWidth }
                                                    }
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-primary-600 p-6 shadow-lg shadow-primary-500/20 text-white">
                            <h3 className="mb-2 text-lg font-bold">Total Time ({activePeriod})</h3>
                            <p className="text-4xl font-black">{totalHours} Hours</p>
                            <p className="mt-4 text-sm text-primary-100">
                                {activeTab === 'category'
                                    ? 'Based on Productive / Neutral / Unproductive classification.'
                                    : 'Based on labels from Productivity settings.'}
                            </p>
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md">
                                    <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                                        {activeTab === 'category' ? 'Productivity Score' : 'Focus Score'}
                                    </p>
                                    <p className="text-lg font-bold">{focusScore} / 100</p>
                                </div>
                                <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md">
                                    <p className="text-xs font-bold uppercase tracking-wider opacity-70">Tracked apps</p>
                                    <p className="text-lg font-bold">{activeData.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <Monitor size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No data for the selected period</h3>
                        <p className="text-slate-500 text-center max-w-sm">
                            {activeTab === 'tags'
                                ? 'Assign labels in Settings → Productivity, or run Auto-Labeling first.'
                                : 'Ensure the agent is running and apps are being tracked.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
