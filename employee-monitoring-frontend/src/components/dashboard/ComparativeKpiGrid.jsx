import React from 'react';
import {
    Briefcase,
    Monitor,
    MonitorOff,
    Clock,
    TrendingUp,
    TrendingDown,
    Award,
    Activity,
    PieChart
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
    const liveSecsDisplay = useLiveTimeDisplay(baseSeconds, liveTick);
    
    let displayValue = '00:00 h';
    if (value !== undefined && value !== null) {
        displayValue = value;
    } else if (baseSeconds !== undefined && baseSeconds !== null) {
        displayValue = liveSecsDisplay || formatSecondsToHoursMins(baseSeconds);
    }

    const activeDelta = delta?.percent !== undefined
        ? delta
        : { percent: 0, percentFormatted: '0%', diffHoursFormatted: '', direction: 'up' };

    const isUp = activeDelta.direction === 'up' || (activeDelta.percentFormatted || '').includes('▲') || (activeDelta.percentFormatted || '').startsWith('+');
    const isPositive = inverse ? !isUp : isUp;
    const deltaColor = isPositive ? 'text-[#5E7D64]' : 'text-[#A84B4B]';

    return (
        <div className="bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border border-[#E5DED2] dark:border-[#384232] p-5 shadow-warm-xs hover:shadow-warm-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em]">
                    {title}
                </span>
                <div className="h-8 w-8 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#30382B] flex items-center justify-center text-[#B9955B]">
                    <Icon size={16} strokeWidth={2} />
                </div>
            </div>

            <div className="my-2">
                <div className="text-2xl lg:text-3xl font-serif font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight tabular-nums">
                    {displayValue}
                </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#E5DED2]/60 dark:border-[#384232]/60 text-xs mt-1">
                <span className={`flex items-center gap-0.5 font-bold ${deltaColor}`}>
                    {isUp ? '▲' : '▼'} {activeDelta.percentFormatted || `${activeDelta.percent}%`}
                </span>
                {activeDelta.diffHoursFormatted && (
                    <span className="text-[#777367] dark:text-[#B8B3A7] font-medium tabular-nums text-[11px]">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 mb-8">
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

            <KpiCard
                title="Productive Time"
                baseSeconds={sec?.productiveTime}
                liveTick={liveTick}
                delta={d.productiveTime}
                icon={Award}
            />

            <KpiCard
                title="Unproductive Time"
                baseSeconds={sec?.unproductiveTime}
                liveTick={liveTick}
                delta={d.unproductiveTime}
                inverse={true}
                icon={Activity}
            />

            <KpiCard
                title="Neutral Time"
                baseSeconds={sec?.neutralTime}
                liveTick={liveTick}
                delta={d.neutralTime}
                icon={PieChart}
            />

            <KpiCard
                title="Productivity"
                value={utilizationVal}
                delta={d.productivity}
                icon={TrendingUp}
            />
        </div>
    );
}
