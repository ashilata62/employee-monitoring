import React from 'react';
import {
    Briefcase,
    Monitor,
    MonitorOff,
    Clock,
    TrendingUp,
    TrendingDown,
    MoreHorizontal
} from 'lucide-react';
import { useLiveTimeDisplay } from '../../hooks/useLiveTime';

const formatSecondsToHoursMins = (secs) => {
    if (secs === null || secs === undefined || isNaN(secs) || secs < 0) return '00:00 h';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} h`;
};

const KpiCard = ({
    title,
    value,
    baseSeconds,
    liveTick,
    delta,
    inverse = false,
    icon: Icon
}) => {
    // If live tracking is ticking
    const liveSecsDisplay = useLiveTimeDisplay(baseSeconds, liveTick);
    
    // Format display value strictly from real DB data
    let displayValue = '00:00 h';
    if (value !== undefined && value !== null) {
        displayValue = value;
    } else if (baseSeconds !== undefined && baseSeconds !== null) {
        displayValue = liveSecsDisplay || formatSecondsToHoursMins(baseSeconds);
    }

    // Delta resolution strictly from comparison API
    const activeDelta = delta?.percent !== undefined
        ? delta
        : { percent: 0, percentFormatted: '0%', diffHoursFormatted: '', direction: 'up' };

    const isUp = activeDelta.direction === 'up' || (activeDelta.percentFormatted || '').includes('▲') || (activeDelta.percentFormatted || '').startsWith('+');
    const isPositive = inverse ? !isUp : isUp;
    const deltaColor = isPositive ? 'text-emerald-500' : 'text-rose-500';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {title}
                </span>
                <Icon size={17} className="text-slate-400 dark:text-slate-500" strokeWidth={1.8} />
            </div>

            <div className="mb-3">
                <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {displayValue}
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
                <span className={`flex items-center gap-0.5 font-bold ${deltaColor}`}>
                    {isUp ? '▲' : '▼'} {activeDelta.percentFormatted || `${activeDelta.percent}%`}
                </span>
                {activeDelta.diffHoursFormatted && (
                    <span className="text-slate-400 dark:text-slate-500 font-medium tabular-nums">
                        {activeDelta.diffHoursFormatted}
                    </span>
                )}
            </div>
        </div>
    );
};

export function ComparativeKpiGrid({ sec, stats, deltas, liveTick }) {
    const d = deltas || {};

    const utilizationVal = stats?.summary?.utilization !== undefined
        ? `${stats.summary.utilization}%`
        : '0%';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Row 1: Work Time, Active Time, Idle Time, Manual Time */}
            <KpiCard
                title="Work Time"
                baseSeconds={sec?.workTime}
                liveTick={liveTick}
                delta={d.workTime}
                icon={Briefcase}
            />

            <KpiCard
                title="Active Time"
                baseSeconds={sec?.activeTime}
                liveTick={liveTick}
                delta={d.activeTime}
                icon={Monitor}
            />

            <KpiCard
                title="Idle Time"
                baseSeconds={sec?.idleTime}
                liveTick={liveTick}
                delta={d.idleTime}
                inverse={true}
                icon={MonitorOff}
            />

            <KpiCard
                title="Manual Time"
                baseSeconds={sec?.manualTime}
                liveTick={liveTick}
                delta={d.manualTime}
                icon={Clock}
            />

            {/* Row 2: Productive Time, Unproductive Time, Neutral Time, Utilization */}
            <KpiCard
                title="Productive Time"
                baseSeconds={sec?.productiveTime}
                liveTick={liveTick}
                delta={d.productiveTime}
                icon={TrendingUp}
            />

            <KpiCard
                title="Unproductive Time"
                baseSeconds={sec?.unproductiveTime}
                liveTick={liveTick}
                delta={d.unproductiveTime}
                inverse={true}
                icon={TrendingDown}
            />

            <KpiCard
                title="Neutral Time"
                baseSeconds={sec?.neutralTime}
                liveTick={liveTick}
                delta={d.neutralTime}
                icon={MoreHorizontal}
            />

            <KpiCard
                title="Utilization"
                value={utilizationVal}
                delta={d.utilization}
                icon={TrendingUp}
            />
        </div>
    );
}

export default ComparativeKpiGrid;
