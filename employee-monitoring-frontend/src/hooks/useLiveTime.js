import { useState, useEffect, useRef } from 'react';
import { formatSecondsToHMS } from '../utils/timeFormat';
import { useAuthStore } from '../store/authStore';

/**
 * Pure calculation of work session seconds based on server timestamps.
 * Formula: (Current Time - Clock In Time) - Total Break Seconds - Total Idle Deduction
 * When on break: (Break Start Time - Clock In Time) - Total Break Seconds - Total Idle Deduction
 * When idle paused: returns frozen seconds directly.
 */
export function getActiveSessionSeconds(activeAttendance, isClockedIn, isOnBreak, isIdlePaused = false, frozenSeconds = null) {
    if (!isClockedIn || !activeAttendance?.clockIn) return 0;
    if (isIdlePaused && typeof frozenSeconds === 'number' && !isNaN(frozenSeconds)) {
        return Math.max(0, Math.floor(frozenSeconds));
    }

    const clockInMs = new Date(activeAttendance.clockIn).getTime();
    if (isNaN(clockInMs)) return 0;
    const breakSec = Math.max(0, Math.floor(Number(activeAttendance.totalBreakSeconds) || 0));
    const idleDeduction = Math.max(0, Math.floor(Number(activeAttendance.totalIdleDeductionSeconds) || 0));

    if (isOnBreak && activeAttendance.openBreak) {
        const breakStartMs = new Date(activeAttendance.openBreak).getTime();
        if (!isNaN(breakStartMs)) {
            return Math.max(0, Math.floor((breakStartMs - clockInMs) / 1000) - breakSec - idleDeduction);
        }
    }

    return Math.max(0, Math.floor((Date.now() - clockInMs) / 1000) - breakSec - idleDeduction);
}

/**
 * Global reactive hook that provides the persistent live work session timer.
 * Synchronously initialized from timestamps so it NEVER resets on navigation.
 * Ticks every 1s when active, freezes when on break or idle modal is open, 0 when clocked out.
 */
export function useSessionTimer() {
    const { isClockedIn, isOnBreak, isIdlePaused, frozenIdleSeconds, activeAttendance } = useAuthStore();

    const calculate = () => getActiveSessionSeconds(
        activeAttendance,
        isClockedIn,
        isOnBreak,
        isIdlePaused,
        frozenIdleSeconds
    );
    const [seconds, setSeconds] = useState(calculate);

    // Keep seconds in sync when activeAttendance, break status, or idle pause state changes
    useEffect(() => {
        setSeconds(calculate());
        if (!isClockedIn || isOnBreak || isIdlePaused) return undefined;

        const id = setInterval(() => {
            setSeconds(calculate());
        }, 1000);

        return () => clearInterval(id);
    }, [
        isClockedIn,
        isOnBreak,
        isIdlePaused,
        frozenIdleSeconds,
        activeAttendance?.clockIn,
        activeAttendance?.openBreak,
        activeAttendance?.totalBreakSeconds,
        activeAttendance?.totalIdleDeductionSeconds
    ]);

    return seconds;
}

/**
 * Live ticking h-m-s display for KPI cards.
 * Uses wall-clock interpolation so it continues seamlessly without jumping or resetting.
 */
export function useLiveTimeDisplay(baseSeconds, enabled = false) {
    const validBase = Math.max(0, Math.floor(baseSeconds || 0));
    const [display, setDisplay] = useState(validBase);
    const anchorBaseRef = useRef(validBase);
    const startRef = useRef(null);

    useEffect(() => {
        const nb = Math.max(0, Math.floor(baseSeconds || 0));
        anchorBaseRef.current = nb;
        startRef.current = Date.now();
        setDisplay(nb);
    }, [baseSeconds]);

    useEffect(() => {
        if (!enabled) {
            startRef.current = null;
            setDisplay(anchorBaseRef.current);
            return undefined;
        }

        if (!startRef.current) {
            startRef.current = Date.now();
        }

        const id = setInterval(() => {
            const wallElapsed = Math.floor((Date.now() - startRef.current) / 1000);
            setDisplay(anchorBaseRef.current + wallElapsed);
        }, 1000);

        return () => clearInterval(id);
    }, [enabled]);

    return formatSecondsToHMS(display);
}

