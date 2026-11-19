import { useState, useEffect, useRef } from 'react';
import { formatSecondsToHMS } from '../utils/timeFormat';
import { useAuthStore } from '../store/authStore';

/**
 * Pure calculation of work session seconds based on server timestamps.
 * Formula: (Current Time - Clock In Time) - Total Break Seconds
 * When on break: (Break Start Time - Clock In Time) - Total Break Seconds
 */
export function getActiveSessionSeconds(activeAttendance, isClockedIn, isOnBreak) {
    if (!isClockedIn || !activeAttendance?.clockIn) return 0;
    const clockInMs = new Date(activeAttendance.clockIn).getTime();
    if (isNaN(clockInMs)) return 0;
    const breakSec = Math.max(0, Math.floor(Number(activeAttendance.totalBreakSeconds) || 0));

    if (isOnBreak && activeAttendance.openBreak) {
        const breakStartMs = new Date(activeAttendance.openBreak).getTime();
        if (!isNaN(breakStartMs)) {
            return Math.max(0, Math.floor((breakStartMs - clockInMs) / 1000) - breakSec);
        }
    }

    return Math.max(0, Math.floor((Date.now() - clockInMs) / 1000) - breakSec);
}

/**
 * Global reactive hook that provides the persistent live work session timer.
 * Synchronously initialized from timestamps so it NEVER resets on navigation.
 * Ticks every 1s when active, freezes when on break, 0 when clocked out.
 */
export function useSessionTimer() {
    const { isClockedIn, isOnBreak, activeAttendance } = useAuthStore();

    const calculate = () => getActiveSessionSeconds(activeAttendance, isClockedIn, isOnBreak);
    const [seconds, setSeconds] = useState(calculate);

    // Keep seconds in sync when activeAttendance or break status changes
    useEffect(() => {
        setSeconds(calculate());
        if (!isClockedIn || isOnBreak) return undefined;

        const id = setInterval(() => {
            setSeconds(calculate());
        }, 1000);

        return () => clearInterval(id);
    }, [isClockedIn, isOnBreak, activeAttendance?.clockIn, activeAttendance?.openBreak, activeAttendance?.totalBreakSeconds]);

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

