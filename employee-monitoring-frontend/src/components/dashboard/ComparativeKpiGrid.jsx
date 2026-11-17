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
            <div className="flex items-baseline font-sans font-bold tracking-tight text-[#0f172a] dark:text-[#f8fafc] tabular-nums leading-none flex-wrap">
                <span className="text-base sm:text-xl md:text-2xl">{matchHMS[1]}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] ml-0.5 mr-1 sm:mr-1.5">h</span>
                <span className="text-base sm:text-xl md:text-2xl">{matchHMS[2]}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] ml-0.5 mr-1 sm:mr-1.5">m</span>
                <span className="text-xs sm:text-base md:text-lg text-[#64748b] dark:text-[#94a3b8]">{matchHMS[3]}</span>
                <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold text-[#64748b]/80 dark:text-[#94a3b8]/80 ml-0.5">s</span>
            </div>
        );
    }

    // Pattern 2: "00:00 h"
    const matchHM = value.match(/^(\d{1,3}):(\d{2})\s*h$/);
    if (matchHM) {
        return (
            <div className="flex items-baseline font-sans font-bold tracking-tight text-[#0f172a] dark:text-[#f8fafc] tabular-nums leading-none">
                <span className="text-base sm:text-xl md:text-2xl">{matchHM[1]}:{matchHM[2]}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] ml-1">h</span>
            </div>
        );
    }

    // Pattern 3: percentage like "75%" or other string
    return (
        <span className="font-sans font-bold text-base sm:text-xl md:text-2xl text-[#0f172a] dark:text-[#f8fafc] tracking-tight tabular-nums leading-none">
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

    let deltaBadgeClass = 'bg-[#f1f5f9]/70 dark:bg-[#1e293b] text-[#64748b] dark:text-[#94a3b8]';
    if (!isZero) {
        deltaBadgeClass = isPositive
            ? 'bg-[#10b981]/10 dark:bg-[#10b981]/20 text-[#10b981] dark:text-[#6ee7b7]'
            : 'bg-[#f43f5e]/10 dark:bg-[#f43f5e]/20 text-[#f43f5e] dark:text-[#fda4af]';
    }

    return (
        <div className="group bg-[#ffffff] dark:bg-[#0f172a] rounded-xl sm:rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(41,41,31,0.03)] hover:shadow-[0_4px_14px_rgba(41,41,31,0.06)] hover:border-[#6366f1]/60 dark:hover:border-[#6366f1]/50 transition-all duration-200 flex flex-col justify-between">
            {/* Top row: Title & Mini Icon */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.12em] truncate">
                    {title}
                </span>
                <div className="h-7 w-7 rounded-lg bg-[#f1f5f9]/80 dark:bg-[#1e293b] flex items-center justify-center text-[#6366f1] group-hover:bg-[#6366f1]/15 group-hover:text-[#A17D45] transition-colors shrink-0">
                    <Icon size={14} strokeWidth={2} />
                </div>
            </div>

            {/* Metric Value */}
            <div className="my-1.5 sm:my-2 min-h-[28px] flex items-center">
                <FormattedDisplayValue value={displayValue} />
            </div>

            {/* Bottom row: Delta Pill & Diff */}
            <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-[#e2e8f0]/70 dark:border-[#1e293b]/70 text-[11px] mt-1">
                <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${deltaBadgeClass}`}>
                    <span className="text-[9px]">{isUp ? '▲' : '▼'}</span>
                    <span>{activeDelta.percentFormatted || `${activeDelta.percent}%`}</span>
                </span>
                {activeDelta.diffHoursFormatted ? (
                    <span className="text-[#64748b] dark:text-[#94a3b8] font-medium tabular-nums text-[10px] sm:text-[11px] truncate">
                        {activeDelta.diffHoursFormatted}
                    </span>
                ) : (
                    <span className="text-[#94a3b8] dark:text-[#64748b] text-[10px] font-medium">
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
