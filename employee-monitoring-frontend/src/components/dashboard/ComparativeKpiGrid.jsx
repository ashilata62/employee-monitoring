import React from 'react';
import {
    Briefcase,
    Monitor,
    MonitorOff,
    Clock,
    TrendingUp,
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

const FormattedDisplayValue = ({ value }) => {
    if (typeof value !== 'string') {
        return <span>{value}</span>;
    }

    // Pattern 1: "00h 00m 00s"
    const matchHMS = value.match(/^(\d{1,3})h\s*(\d{2})m\s*(\d{2})s$/);
    if (matchHMS) {
        return (
            <div className="flex items-baseline font-sans font-bold tracking-tight text-[#29291F] dark:text-[#F5F1E9] tabular-nums leading-none">
                <span className="text-xl sm:text-2xl">{matchHMS[1]}</span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#777367] dark:text-[#9E988A] ml-0.5 mr-1.5">h</span>
                <span className="text-xl sm:text-2xl">{matchHMS[2]}</span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#777367] dark:text-[#9E988A] ml-0.5 mr-1.5">m</span>
                <span className="text-base sm:text-lg text-[#777367] dark:text-[#9E988A]">{matchHMS[3]}</span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[#777367]/80 dark:text-[#9E988A]/80 ml-0.5">s</span>
            </div>
        );
    }

    // Pattern 2: "00:00 h"
    const matchHM = value.match(/^(\d{1,3}):(\d{2})\s*h$/);
    if (matchHM) {
        return (
            <div className="flex items-baseline font-sans font-bold tracking-tight text-[#29291F] dark:text-[#F5F1E9] tabular-nums leading-none">
                <span className="text-xl sm:text-2xl">{matchHM[1]}:{matchHM[2]}</span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#777367] dark:text-[#9E988A] ml-1">h</span>
            </div>
        );
    }

    // Pattern 3: percentage like "75%" or other string
    return (
        <span className="font-sans font-bold text-xl sm:text-2xl text-[#29291F] dark:text-[#F5F1E9] tracking-tight tabular-nums leading-none">
            {value}
        </span>
    );
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
    const isZero = activeDelta.percent === 0 && (!activeDelta.percentFormatted || activeDelta.percentFormatted === '0%' || activeDelta.percentFormatted === '+0%');

    let deltaBadgeClass = 'bg-[#EEE8DD]/70 dark:bg-[#30382B] text-[#777367] dark:text-[#B8B3A7]';
    if (!isZero) {
        deltaBadgeClass = isPositive
            ? 'bg-[#5E7D64]/10 dark:bg-[#5E7D64]/20 text-[#5E7D64] dark:text-[#A4C2A8]'
            : 'bg-[#A84B4B]/10 dark:bg-[#A84B4B]/20 text-[#A84B4B] dark:text-[#E8A5A5]';
    }

    return (
        <div className="group bg-[#EEE8DD] dark:bg-[#252B20] rounded-xl sm:rounded-2xl border border-[#D6CDBC] dark:border-[#384232] p-3.5 sm:p-4 shadow-warm-xs hover:border-[#B9955B]/60 dark:hover:border-[#B9955B]/50 transition-all duration-200 flex flex-col justify-between">
            {/* Top row: Title & Mini Icon */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.12em] truncate">
                    {title}
                </span>
                <div className="h-7 w-7 rounded-lg bg-[#EEE8DD]/80 dark:bg-[#30382B] flex items-center justify-center text-[#B9955B] group-hover:bg-[#B9955B]/15 group-hover:text-[#A17D45] transition-colors shrink-0">
                    <Icon size={14} strokeWidth={2} />
                </div>
            </div>

            {/* Metric Value */}
            <div className="my-1.5 sm:my-2 min-h-[28px] flex items-center">
                <FormattedDisplayValue value={displayValue} />
            </div>

            {/* Bottom row: Delta Pill & Diff */}
            <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-[#D6CDBC]/70 dark:border-[#384232]/70 text-[11px] mt-1">
                <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${deltaBadgeClass}`}>
                    <span className="text-[9px]">{isUp ? '▲' : '▼'}</span>
                    <span>{activeDelta.percentFormatted || `${activeDelta.percent}%`}</span>
                </span>
                {activeDelta.diffHoursFormatted ? (
                    <span className="text-[#777367] dark:text-[#B8B3A7] font-medium tabular-nums text-[10px] sm:text-[11px] truncate">
                        {activeDelta.diffHoursFormatted}
                    </span>
                ) : (
                    <span className="text-[#9E988A] dark:text-[#777367] text-[10px] font-medium">
                        vs prev
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
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
