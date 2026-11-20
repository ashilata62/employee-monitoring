import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Briefcase,
    Monitor,
    MonitorOff,
    Clock,
    TrendingUp,
    Activity,
    Zap,
    MoreHorizontal
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSessionTimer } from '../../hooks/useLiveTime';
import { formatSecondsToHMS } from '../../utils/timeFormat';
import { subscribeStaffStatus } from '../../utils/staffSync';
import useSocket from '../../hooks/useSocket';

const formatSecondsToHoursMins = (secs) => {
    if (secs === null || secs === undefined || isNaN(secs) || secs < 0) return '00:00 h';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} h`;
};

const formatToHMHour = (val) => {
    if (!val && val !== 0) return '00:00 h';
    if (typeof val === 'number') {
        return formatSecondsToHoursMins(val);
    }
    if (typeof val === 'string') {
        if (/^\d+:\d{2}\s*h$/.test(val)) return val;
        const match = val.match(/^(\d+)h\s*(\d+)m/);
        if (match) {
            return `${String(match[1]).padStart(2, '0')}:${String(match[2]).padStart(2, '0')} h`;
        }
    }
    return val;
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

// Helper: Determine accurate live operational status for any employee
const resolveStaffLiveStatus = (emp, liveMatch) => {
    const liveStatus = (liveMatch?.status || liveMatch?.accountStatus || '').toLowerCase();
    const empStatus = (emp?.status || emp?.accountStatus || '').toLowerCase();

    // 1. Explicit offline: if clocked out or marked offline, employee is OFFLINE
    const isExplicitOffline = liveStatus === 'offline' || 
                              liveMatch?.isOnline === false || 
                              liveMatch?.isClockedIn === false || 
                              empStatus === 'offline' || 
                              emp?.isClockedIn === false;

    if (isExplicitOffline) {
        return { isActive: false, isIdle: false, isOnBreak: false, isOffline: true };
    }

    // 2. Break
    const isBreak = liveStatus === 'break' || liveMatch?.isOnBreak === true || empStatus === 'break' || emp?.isOnBreak === true;
    if (isBreak) {
        return { isActive: false, isIdle: false, isOnBreak: true, isOffline: false };
    }

    // 3. Idle / AFK (>= 10 minutes or explicit idle)
    const isIdle = liveStatus === 'idle' || liveStatus === 'afk' || liveMatch?.isIdle === true || (liveMatch?.idleTime || 0) >= 600 || empStatus === 'idle' || empStatus === 'afk';
    if (isIdle) {
        return { isActive: false, isIdle: true, isOnBreak: false, isOffline: false };
    }

    // 4. Working / Active
    const isWorking = liveStatus === 'online' || liveStatus === 'active' || liveMatch?.isOnline === true || empStatus === 'online' || emp?.isOnline === true;
    if (isWorking) {
        return { isActive: true, isIdle: false, isOnBreak: false, isOffline: false };
    }

    return { isActive: false, isIdle: false, isOnBreak: false, isOffline: true };
};

export function ComparativeKpiGrid({
    sec,
    stats,
    deltas,
    role,
    isToday = true,
    activeFilter = {},
    employees = []
}) {
    const d = deltas || {};
    const { isClockedIn, isOnBreak, isIdlePaused } = useAuthStore();
    const sessionSeconds = useSessionTimer();
    const isSessionUser = role?.toUpperCase() === 'EMPLOYEE';
    const { socket } = useSocket();

    // Real-time socket and cross-tab staff live status map
    const [liveStaffMap, setLiveStaffMap] = useState({});

    // 1. Cross-tab sync via BroadcastChannel & window events
    useEffect(() => {
        const unsubscribe = subscribeStaffStatus((data) => {
            if (data?.employeeId) {
                setLiveStaffMap(prev => ({
                    ...prev,
                    [String(data.employeeId)]: data
                }));
            }
        });
        return unsubscribe;
    }, []);

    // 2. Real-Time Socket.IO listeners for instantaneous status updates across all clients/browsers
    useEffect(() => {
        if (!socket) return;

        const handleStatus = ({ employeeId, status }) => {
            if (!employeeId) return;
            const raw = (status || '').toLowerCase();
            const isOnline = raw === 'online' || raw === 'active';
            const isBreak = raw === 'break';
            const isIdle = raw === 'idle' || raw === 'afk';
            setLiveStaffMap(prev => ({
                ...prev,
                [String(employeeId)]: {
                    employeeId: String(employeeId),
                    status: isOnline ? 'online' : (isBreak ? 'break' : (isIdle ? 'idle' : 'offline')),
                    isOnline,
                    isOnBreak: isBreak,
                    isIdle
                }
            }));
        };

        const handleAttendance = (data) => {
            if (!data?.employeeId) return;
            const type = String(data.type || '').toLowerCase();
            if (type === 'break-end' || type === 'clock-in') {
                setLiveStaffMap(prev => ({
                    ...prev,
                    [String(data.employeeId)]: {
                        employeeId: String(data.employeeId),
                        status: 'online',
                        isOnline: true,
                        isOnBreak: false,
                        isIdle: false
                    }
                }));
            } else if (type === 'break-start') {
                setLiveStaffMap(prev => ({
                    ...prev,
                    [String(data.employeeId)]: {
                        employeeId: String(data.employeeId),
                        status: 'break',
                        isOnline: false,
                        isOnBreak: true,
                        isIdle: false
                    }
                }));
            } else if (type === 'clock-out') {
                setLiveStaffMap(prev => ({
                    ...prev,
                    [String(data.employeeId)]: {
                        employeeId: String(data.employeeId),
                        status: 'offline',
                        isOnline: false,
                        isOnBreak: false,
                        isIdle: false
                    }
                }));
            }
        };

        const handleResumed = (data) => {
            if (!data?.employeeId) return;
            setLiveStaffMap(prev => ({
                ...prev,
                [String(data.employeeId)]: {
                    employeeId: String(data.employeeId),
                    status: 'online',
                    isOnline: true,
                    isOnBreak: false,
                    isIdle: false
                }
            }));
        };

        socket.on('employee:status', handleStatus);
        socket.on('attendance:update', handleAttendance);
        socket.on('employee:idle_resumed', handleResumed);

        return () => {
            socket.off('employee:status', handleStatus);
            socket.off('attendance:update', handleAttendance);
            socket.off('employee:idle_resumed', handleResumed);
        };
    }, [socket]);

    const filteredEmployeeId = activeFilter?.employeeId ? String(activeFilter.employeeId) : null;

    // Calculate live staff status counts and active multipliers
    const staffCounts = useMemo(() => {
        if (isSessionUser) {
            if (!isClockedIn) {
                return { activeCount: 0, idleCount: 0, breakCount: 0, isCurrentIdle: false, isCurrentActive: false, isCurrentBreak: false };
            }
            if (isOnBreak) {
                return { activeCount: 0, idleCount: 0, breakCount: 1, isCurrentIdle: false, isCurrentActive: false, isCurrentBreak: true };
            }
            if (isIdlePaused) {
                return { activeCount: 0, idleCount: 1, breakCount: 0, isCurrentIdle: true, isCurrentActive: false, isCurrentBreak: false };
            }
            return { activeCount: 1, idleCount: 0, breakCount: 0, isCurrentIdle: false, isCurrentActive: true, isCurrentBreak: false };
        }

        if (filteredEmployeeId) {
            const liveData = liveStaffMap[filteredEmployeeId];
            const emp = employees.find(e => 
                String(e.id) === filteredEmployeeId || 
                String(e.userId) === filteredEmployeeId || 
                String(e.employeeId) === filteredEmployeeId
            );
            const resolved = resolveStaffLiveStatus(emp, liveData);
            return {
                activeCount: resolved.isActive ? 1 : 0,
                idleCount: resolved.isIdle ? 1 : 0,
                breakCount: resolved.isOnBreak ? 1 : 0,
                isCurrentIdle: resolved.isIdle,
                isCurrentActive: resolved.isActive,
                isCurrentBreak: resolved.isOnBreak
            };
        }

        // Viewing all staff / team
        let activeCount = 0;
        let idleCount = 0;
        let breakCount = 0;

        employees.forEach(e => {
            // Ignore admin accounts from monitored employee count
            const r = (e.role || e.user?.role || '').toUpperCase();
            const nm = (e.fullName || e.name || '').toLowerCase();
            const em = (e.email || '').toLowerCase();
            if (r === 'ADMIN' || nm.includes('admin demo') || em.startsWith('admin@')) return;

            const id = String(e.id || e.employeeId || e.userId);
            const live = liveStaffMap[id] || (e.email ? Object.values(liveStaffMap).find(lm => lm.email && lm.email.toLowerCase() === e.email.toLowerCase()) : null);
            const resolved = resolveStaffLiveStatus(e, live);
            if (resolved.isActive) activeCount++;
            else if (resolved.isIdle) idleCount++;
            else if (resolved.isOnBreak) breakCount++;
        });

        return {
            activeCount,
            idleCount,
            breakCount,
            isCurrentIdle: idleCount > 0 && activeCount === 0,
            isCurrentActive: activeCount > 0,
            isCurrentBreak: breakCount > 0 && activeCount === 0 && idleCount === 0
        };
    }, [isSessionUser, isClockedIn, isOnBreak, isIdlePaused, filteredEmployeeId, liveStaffMap, employees]);

    // Live ticking stopwatch: increments every 1 second by exact active and idle staff counts
    const [elapsedActive, setElapsedActive] = useState(0);
    const [elapsedIdle, setElapsedIdle] = useState(0);

    const baseSignature = `${filteredEmployeeId || 'all'}_${sec?.workTime || 0}_${sec?.activeTime || 0}_${sec?.idleTime || 0}_${sec?.unproductiveTime || 0}`;

    useEffect(() => {
        setElapsedActive(0);
        setElapsedIdle(0);
    }, [baseSignature]);

    useEffect(() => {
        if (!isToday) return undefined;

        // If no active employees and no idle employees (e.g. all on break or offline), DO NOT TICK!
        if (staffCounts.activeCount === 0 && staffCounts.idleCount === 0) {
            return undefined;
        }

        const interval = setInterval(() => {
            setElapsedActive(prev => prev + staffCounts.activeCount);
            setElapsedIdle(prev => prev + staffCounts.idleCount);
        }, 1000);

        return () => clearInterval(interval);
    }, [isToday, staffCounts.activeCount, staffCounts.idleCount]);

    // Raw base seconds from backend
    const baseWork = Number(sec?.workTime) || 0;
    const baseActive = Number(sec?.activeTime) || 0;
    const baseIdle = Number(sec?.idleTime) || 0;
    const baseProductive = Number(sec?.productiveTime) || 0;
    const baseUnproductive = Number(sec?.unproductiveTime) || Number(sec?.idleTime) || 0;
    const baseNeutral = Number(sec?.neutralTime) || 0;
    const baseManual = Number(sec?.manualTime) || 0;

    // Calculate real-time seconds dynamically based on employee active/idle state
    let curWork = baseWork;
    let curActive = baseActive;
    let curIdle = baseIdle;
    let curProductive = baseProductive;
    let curUnproductive = baseUnproductive;
    let curNeutral = baseNeutral;
    let curManual = baseManual;

    if (isSessionUser && isToday) {
        if (isClockedIn) {
            if (staffCounts.isCurrentIdle) {
                curWork = sessionSeconds + elapsedIdle;
                curActive = sessionSeconds; // Active is frozen!
                curIdle = baseIdle + elapsedIdle; // Idle ticks!
                curUnproductive = baseUnproductive + elapsedIdle; // Unproductive ticks!
                curProductive = sessionSeconds;
            } else if (staffCounts.isCurrentBreak) {
                // On Break: Freeze timers!
                curWork = sessionSeconds;
                curActive = sessionSeconds;
                curIdle = baseIdle;
                curUnproductive = baseUnproductive;
                curProductive = sessionSeconds;
            } else {
                // Active Working
                curWork = sessionSeconds;
                curActive = sessionSeconds;
                curIdle = baseIdle;
                curUnproductive = baseUnproductive;
                curProductive = sessionSeconds;
            }
        } else {
            curWork = 0;
            curActive = 0;
            curIdle = 0;
            curProductive = 0;
            curUnproductive = 0;
            curNeutral = 0;
            curManual = 0;
        }
    } else if (isToday) {
        // For Admin / Manager:
        // Active work increments work, active, and productive time
        // Idle increments work, idle, and unproductive time
        // When everyone is on break: elapsedActive = 0, elapsedIdle = 0 -> All timers stay 100% frozen!
        curWork = baseWork + elapsedActive + elapsedIdle;
        curActive = baseActive + elapsedActive;
        curProductive = baseProductive + elapsedActive;
        curIdle = baseIdle + elapsedIdle;
        curUnproductive = baseUnproductive + elapsedIdle;
    }

    // Display values: When viewing Today, format in detailed HMS (e.g. 03h 52m 14s)
    const effectiveWorkTime = isToday ? formatSecondsToHMS(curWork) : formatToHMHour(stats?.summary?.workTime || baseWork);
    const effectiveActiveTime = isToday ? formatSecondsToHMS(curActive) : formatToHMHour(stats?.summary?.activeTime || baseActive);
    const effectiveIdleTime = isToday ? formatSecondsToHMS(curIdle) : formatToHMHour(stats?.summary?.idleTime || baseIdle);
    const effectiveManualTime = isToday ? formatSecondsToHMS(curManual) : formatToHMHour(stats?.summary?.manualTime || baseManual);
    const effectiveProductiveTime = isToday ? formatSecondsToHMS(curProductive) : formatToHMHour(stats?.summary?.productiveTime || baseProductive);
    const effectiveUnproductiveTime = isToday ? formatSecondsToHMS(curUnproductive) : formatToHMHour(stats?.summary?.unproductiveTime || baseUnproductive);
    const effectiveNeutralTime = isToday ? formatSecondsToHMS(curNeutral) : formatToHMHour(stats?.summary?.neutralTime || baseNeutral);

    const effectiveProductivity = useMemo(() => {
        if (isSessionUser && isToday) {
            return isClockedIn ? '100%' : '0%';
        }
        if (curWork > 0) {
            const pct = Math.min(100, Math.round((curProductive / curWork) * 100));
            return `${pct}%`;
        }
        if (stats?.summary?.utilization !== undefined) return `${stats.summary.utilization}%`;
        if (stats?.summary?.productivity !== undefined) return `${stats.summary.productivity}%`;
        return '0%';
    }, [isSessionUser, isToday, isClockedIn, curProductive, curWork, stats?.summary]);

    // Live tick pulsing dot: ONLY on when actual staff members are active or idle!
    // When all employees are on break or offline: ALL TICK INDICATORS ARE OFF (false)!
    const tickWork = isToday && (staffCounts.activeCount > 0 || staffCounts.idleCount > 0);
    const tickActive = isToday && staffCounts.activeCount > 0;
    const tickIdle = isToday && staffCounts.idleCount > 0;
    const tickProductive = isToday && staffCounts.activeCount > 0;
    const tickUnproductive = isToday && staffCounts.idleCount > 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
            <KpiCard
                title="Work Time"
                displayValue={effectiveWorkTime}
                delta={d.workTime}
                liveTick={tickWork}
                icon={Briefcase}
            />

            <KpiCard
                title="Active Time"
                displayValue={effectiveActiveTime}
                delta={d.activeTime}
                liveTick={tickActive}
                icon={Monitor}
            />

            <KpiCard
                title="Idle Time"
                displayValue={effectiveIdleTime}
                delta={d.idleTime}
                inverse={true}
                liveTick={tickIdle}
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
                liveTick={tickProductive}
                icon={TrendingUp}
            />

            <KpiCard
                title="Unproductive Time"
                displayValue={effectiveUnproductiveTime}
                delta={d.unproductiveTime}
                inverse={true}
                liveTick={tickUnproductive}
                icon={Zap}
            />

            <KpiCard
                title="Neutral Time"
                displayValue={effectiveNeutralTime}
                delta={d.neutralTime}
                icon={MoreHorizontal}
            />

            <KpiCard
                title={role?.toUpperCase() === 'ADMIN' ? 'Utilization' : 'Productivity'}
                displayValue={effectiveProductivity}
                delta={d.utilization || d.productivity}
                icon={role?.toUpperCase() === 'ADMIN' ? Activity : TrendingUp}
            />
        </div>
    );
}
