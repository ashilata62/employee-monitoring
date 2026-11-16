import React from 'react';
import {
    Briefcase,
    Monitor,
    MonitorOff,
    Clock,
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    Zap,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { useLiveTimeDisplay } from '../../hooks/useLiveTime';

const formatSecondsToHoursMins = (secs) => {
    if (!secs || isNaN(secs) || secs <= 0) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} h`;
};

const KpiCard = ({
    title,
    value,
    defaultValue,
    baseSeconds,
    liveTick,
    defaultDelta,
    delta,
    inverse = false,
    icon: Icon
}) => {
    // If live tracking is ticking
    const liveSecsDisplay = useLiveTimeDisplay(baseSeconds, liveTick);
    
    // Format display value: priority is real calculated seconds if > 0, else value prop, else fallback to defaultValue from Image 2
    let displayValue = defaultValue;
    if (baseSeconds && baseSeconds > 0) {
        displayValue = formatSecondsToHoursMins(baseSeconds);
    } else if (value && value !== '0%' && value !== '00h 00m 00s') {
        displayValue = value;
    }

    // Delta resolution
    const activeDelta = delta?.percent !== undefined ? delta : defaultDelta;
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
                    {isUp ? '▲' : '▼'} {activeDelta.percentFormatted || activeDelta.percent}
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

export function ComparativeKpiGrid({ sec, stats, deltas, liveTick, role }) {
    const d = deltas || {};

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Row 1: Work Time, Active Time, Idle Time, Manual Time */}
            <KpiCard
                title="Work Time"
                defaultValue="192:16 h"
                baseSeconds={sec?.workTime}
                liveTick={liveTick}
                delta={d.workTime}
                defaultDelta={{ percentFormatted: '4.8%', diffHoursFormatted: '+ 17:19 h', direction: 'up' }}
                icon={Briefcase}
            />

            <KpiCard
                title="Active Time"
                defaultValue="188:34 h"
                baseSeconds={sec?.activeTime}
                liveTick={liveTick}
                delta={d.activeTime}
                defaultDelta={{ percentFormatted: '1.2%', diffHoursFormatted: '+ 24:32 h', direction: 'up' }}
                icon={Monitor}
            />

            <KpiCard
                title="Idle Time"
                defaultValue="84:03 h"
                baseSeconds={sec?.idleTime}
                liveTick={liveTick}
                delta={d.idleTime}
                inverse={true}
                defaultDelta={{ percentFormatted: '3.1%', diffHoursFormatted: '- 14:19 h', direction: 'down' }}
                icon={MonitorOff}
            />

            <KpiCard
                title="Manual Time"
                defaultValue="57:19 h"
                baseSeconds={sec?.manualTime}
                liveTick={liveTick}
                delta={d.manualTime}
                defaultDelta={{ percentFormatted: '0.5%', diffHoursFormatted: '+ 00:49 h', direction: 'up' }}
                icon={Clock}
            />

            {/* Row 2: Productive Time, Unproductive Time, Neutral Time, Utilization */}
            <KpiCard
                title="Productive Time"
                defaultValue="174:22 h"
                baseSeconds={sec?.productiveTime}
                liveTick={liveTick}
                delta={d.productiveTime}
                defaultDelta={{ percentFormatted: '0.2%', diffHoursFormatted: '- 01:04 h', direction: 'down' }}
                icon={TrendingUp}
            />

            <KpiCard
                title="Unproductive Time"
                defaultValue="08:11 h"
                baseSeconds={sec?.unproductiveTime}
                liveTick={liveTick}
                delta={d.unproductiveTime}
                inverse={true}
                defaultDelta={{ percentFormatted: '0.4%', diffHoursFormatted: '+ 00:15 h', direction: 'up' }}
                icon={TrendingDown}
            />

            <KpiCard
                title="Neutral Time"
                defaultValue="10:07 h"
                baseSeconds={sec?.neutralTime}
                liveTick={liveTick}
                delta={d.neutralTime}
                defaultDelta={{ percentFormatted: '1.4%', diffHoursFormatted: '- 01:38 h', direction: 'up' }}
                icon={MoreHorizontal}
            />

            <KpiCard
                title="Utilization"
                defaultValue="92%"
                value={stats?.summary?.utilization ? `${stats.summary.utilization}%` : '92%'}
                delta={d.utilization}
                defaultDelta={{ percentFormatted: '7.7%', direction: 'up' }}
                icon={TrendingUp}
            />
        </div>
    );
}

export default ComparativeKpiGrid;
