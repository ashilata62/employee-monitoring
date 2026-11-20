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
import { useAuthStore } from '../../store/authStore';
import { useSessionTimer } from '../../hooks/useLiveTime';
import { formatSecondsToHMS } from '../../utils/timeFormat';

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
            <div className="flex items-baseline font-mono font-bold tracking-tight text-[#29291F] dark:text-[#F5F1E9] tabular-nums leading-none flex-nowrap whitespace-nowrap">
                <span className="text-base xs:text-lg sm:text-xl lg:text-2xl">{matchHMS[1]}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#B9955B] ml-0.5 mr-1">h</span>
                <span className="text-base xs:text-lg sm:text-xl lg:text-2xl">{matchHMS[2]}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#B9955B] ml-0.5 mr-1">m</span>
                <span className="text-base xs:text-lg sm:text-xl lg:text-2xl text-[#29291F] dark:text-[#F5F1E9]">{matchHMS[3]}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#B9955B] ml-0.5">s</span>
            </div>
        );
    }

    // Pattern 2: "00:00 h"
    const matchHM = value.match(/^(\d{1,3}):(\d{2})\s*h$/);
    if (matchHM) {
        return (
            <div className="flex items-baseline font-sans font-bold tracking-tight text-[#29291F] dark:text-[#F5F1E9] tabular-nums leading-none flex-nowrap whitespace-nowrap">
                <span className="text-base xs:text-lg sm:text-xl lg:text-2xl">{matchHM[1]}:{matchHM[2]}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#777367] dark:text-[#9E988A] ml-1">h</span>
            </div>
        );
    }

    // Pattern 3: percentage like "75%" or other string
    return (
        <span className="font-sans font-bold text-base xs:text-lg sm:text-xl lg:text-2xl text-[#29291F] dark:text-[#F5F1E9] tracking-tight tabular-nums leading-none flex-nowrap whitespace-nowrap">
            {value}
        </span>
    );
};

const KpiCard = ({
    title,
    displayValue,
    delta,
    inverse = false,
    liveTick = false,
    icon: Icon
}) => {
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
        <div className="group bg-[#EEE8DD] dark:bg-[#252B20] rounded-xl sm:rounded-2xl border border-[#D6CDBC] dark:border-[#384232] p-3 sm:p-4 shadow-warm-xs hover:border-[#B9955B]/60 dark:hover:border-[#B9955B]/50 transition-all duration-200 flex flex-col justify-between">
            {/* Top row: Title & Mini Icon */}
            <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-[10px] sm:text-[11px] xl:text-xs font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-wider truncate" title={title}>
                        {title}
                    </span>
                    {liveTick && (
                        <span className="relative flex h-2 w-2 shrink-0" title="Live ticking stopwatch">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    )}
                </div>
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-[#EEE8DD]/80 dark:bg-[#30382B] flex items-center justify-center text-[#B9955B] group-hover:bg-[#B9955B]/15 group-hover:text-[#A17D45] transition-colors shrink-0">
                    <Icon size={13} strokeWidth={2} />
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

export function ComparativeKpiGrid({ sec, stats, deltas, role, isToday = true, liveTick = false }) {
    const d = deltas || {};
    const { isClockedIn } = useAuthStore();
    const sessionSeconds = useSessionTimer();

    const isSessionUser = role?.toUpperCase() === 'EMPLOYEE' || role?.toUpperCase() === 'MANAGER';

    // When Employee or Manager is viewing Today:
    // If clocked out: ALL cards reset to 00h 00m 00s and 0% immediately with zero latency!
    // If clocked in: session timer ticks live from 00h 00m 00s upwards in sync with top pill timer!
    // For Admin: Displays genuine workforce/team aggregate metrics from stats.summary!
    const effectiveWorkTime = isSessionUser && isToday
        ? (isClockedIn ? formatSecondsToHMS(sessionSeconds) : '00h 00m 00s')
        : (stats?.summary?.workTime || formatSecondsToHMS(sec?.workTime));

    const effectiveActiveTime = isSessionUser && isToday
        ? (isClockedIn ? formatSecondsToHMS(sessionSeconds) : '00h 00m 00s')
        : (stats?.summary?.activeTime || formatSecondsToHMS(sec?.activeTime));

    const effectiveProductiveTime = isSessionUser && isToday
        ? (isClockedIn ? formatSecondsToHMS(sessionSeconds) : '00h 00m 00s')
        : (stats?.summary?.productiveTime || formatSecondsToHMS(sec?.productiveTime));

    const effectiveIdleTime = isSessionUser && isToday
        ? '00h 00m 00s'
        : (stats?.summary?.idleTime || formatSecondsToHMS(sec?.idleTime));

    const effectiveManualTime = isSessionUser && isToday
        ? '00h 00m 00s'
        : (stats?.summary?.manualTime || formatSecondsToHMS(sec?.manualTime));

    const effectiveUnproductiveTime = isSessionUser && isToday
        ? '00h 00m 00s'
        : (stats?.summary?.unproductiveTime || formatSecondsToHMS(sec?.unproductiveTime));

    const effectiveNeutralTime = isSessionUser && isToday
        ? '00h 00m 00s'
        : (stats?.summary?.neutralTime || formatSecondsToHMS(sec?.neutralTime));

    const effectiveProductivity = isSessionUser && isToday
        ? (isClockedIn ? '100%' : '0%')
        : (stats?.summary?.utilization !== undefined ? `${stats.summary.utilization}%` : (stats?.summary?.productivity !== undefined ? `${stats.summary.productivity}%` : '0%'));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
            <KpiCard
                title="Work Time"
                displayValue={effectiveWorkTime}
                delta={d.workTime}
                liveTick={liveTick}
                icon={Briefcase}
            />

            <KpiCard
                title="Active Time"
                displayValue={effectiveActiveTime}
                delta={d.activeTime}
                liveTick={liveTick}
                icon={Monitor}
            />

            <KpiCard
                title="Idle Time"
                displayValue={effectiveIdleTime}
                delta={d.idleTime}
                inverse={true}
                icon={MonitorOff}
            />

            <KpiCard
                title="Manual Time"
                displayValue={effectiveManualTime}
                delta={d.manualTime}
                icon={Clock}
            />

            <KpiCard
                title="Productive Time"
                displayValue={effectiveProductiveTime}
                delta={d.productiveTime}
                icon={Award}
            />

            <KpiCard
                title="Unproductive Time"
                displayValue={effectiveUnproductiveTime}
                delta={d.unproductiveTime}
                inverse={true}
                icon={Activity}
            />

            <KpiCard
                title="Neutral Time"
                displayValue={effectiveNeutralTime}
                delta={d.neutralTime}
                icon={PieChart}
            />

            <KpiCard
                title="Productivity"
                displayValue={effectiveProductivity}
                delta={d.productivity || d.utilization}
                icon={TrendingUp}
            />
        </div>
    );
}
