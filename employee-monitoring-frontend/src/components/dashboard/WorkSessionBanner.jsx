import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { MonitorCheck, MonitorOff, LogIn, LogOut, Video, VideoOff, Clock } from 'lucide-react';
import { toast } from '../../utils/toastManager';

export function WorkSessionBanner() {
    const { user, isClockedIn, clockIn, clockOut, isOnBreak, toggleBreak, activeAttendance, isTrackerActive, setTrackerActive } = useAuthStore();
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const isAgentActive = isTrackerActive || user?.agentStatus === 'active';

    // ── Elapsed timer ──────────────────────────────────────────────────────────
    useEffect(() => {
        let timer;
        if (isClockedIn && activeAttendance?.clockIn) {
            const clockInMs = new Date(activeAttendance.clockIn).getTime();
            const breakSec = activeAttendance.totalBreakSeconds || 0;

            const calculateWorkSeconds = () => {
                if (isOnBreak && activeAttendance.openBreak) {
                    const breakStartMs = new Date(activeAttendance.openBreak).getTime();
                    return Math.max(0, Math.floor((breakStartMs - clockInMs) / 1000) - breakSec);
                }
                return Math.max(0, Math.floor((Date.now() - clockInMs) / 1000) - breakSec);
            };

            setElapsedSeconds(calculateWorkSeconds());

            if (!isOnBreak) {
                timer = setInterval(() => {
                    setElapsedSeconds(calculateWorkSeconds());
                }, 1000);
            }
        } else if (!isClockedIn) {
            setElapsedSeconds(0);
        }
        return () => clearInterval(timer);
    }, [isClockedIn, activeAttendance?.clockIn, activeAttendance?.openBreak, activeAttendance?.totalBreakSeconds, isOnBreak]);

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    };

    // ── Clock In / Out ─────────────────────────────────────────────────────────
    const handleClockIn = async () => {
        setIsLoading(true);
        try {
            await clockIn();
            // Automatically start screen tracking & recording upon clock in
            window.dispatchEvent(new Event('start-web-tracker'));
            toast.success('Clocked in successfully. Screen tracking started.');
        } catch (err) {
            console.error('Clock in failed', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClockOut = async () => {
        setIsLoading(true);
        try {
            // Stop tracker before clocking out
            window.dispatchEvent(new Event('stop-web-tracker'));
            await clockOut();
        } catch (err) { console.error('Clock out failed', err); }
        finally { setIsLoading(false); }
    };

    // ── Tracker Start / Stop ───────────────────────────────────────────────────
    const handleStartTracker = () => {
        window.dispatchEvent(new Event('start-web-tracker'));
        toast.success('Screen tracker starting… Allow screen sharing when prompted.');
    };

    const handleStopTracker = () => {
        window.dispatchEvent(new Event('stop-web-tracker'));
        toast.success('Screen tracker stopped.');
    };

    return (
        <div className="bg-[#EEE8DD] dark:bg-[#252B20] p-4 sm:p-5 rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs flex flex-col gap-3.5 mb-6 sm:mb-8 w-full">

            {/* ── Row 1: Timer + status ───────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-center gap-4 justify-between p-4 sm:p-5 bg-[#EEE8DD]/50 dark:bg-[#1E2419] rounded-xl border border-[#D6CDBC] dark:border-[#384232]">
                {/* Timer */}
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1">
                        {isOnBreak ? 'Session Paused' : 'Total Work Hours'}
                    </span>
                    <div className="font-sans text-2xl xs:text-3xl lg:text-4xl font-bold text-[#29291F] dark:text-[#F5F1E9] tabular-nums tracking-tight">
                        {formatTime(elapsedSeconds)}
                    </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2">
                    {isAgentActive ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F7F4] text-[#5E7D64] border border-[#C8DAC8] text-xs font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5E7D64] animate-pulse" />
                            Tracker Active
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEE8DD] text-[#777367] text-xs font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9E988A]" />
                            Tracker Inactive
                        </span>
                    )}
                    {isClockedIn && (
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isOnBreak
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                                : 'bg-[#FDFBF7] text-[#B9955B] border border-[#D6CDBC]'
                        }`}>
                            <Clock size={12} />
                            {isOnBreak ? 'On Break' : 'Clocked In'}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Row 2: Action Buttons ───────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3">

                {/* Clock In / Out */}
                {!isClockedIn ? (
                    <button
                        onClick={handleClockIn}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#30382B] hover:bg-[#3C4536] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-warm-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <LogIn size={15} className="text-[#D3B98D]" />
                        Clock In
                    </button>
                ) : (
                    <button
                        onClick={handleClockOut}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#A84B4B] hover:bg-[#8E3B3B] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-warm-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <LogOut size={15} />
                        Clock Out
                    </button>
                )}

                {/* Take Break / Resume Work */}
                {isClockedIn && (
                    <button
                        onClick={async () => {
                            try {
                                setIsLoading(true);
                                await toggleBreak();
                            } catch (e) {
                                console.error('Failed to toggle break', e);
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-5 py-2.5 ${
                            isOnBreak
                                ? 'bg-[#5E7D64] hover:bg-[#4A6B53]'
                                : 'bg-[#B9955B] hover:bg-[#A17D45]'
                        } disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-warm-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer`}
                    >
                        <Clock size={15} />
                        {isOnBreak ? 'Resume Work' : 'Take a Break'}
                    </button>
                )}

                {/* Start / Stop Tracker (Screen Share + Recording) */}
                {!isAgentActive ? (
                    <button
                        onClick={handleStartTracker}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#5E7D64] hover:bg-[#4A6B53] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-warm-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <MonitorCheck size={15} />
                        Start Tracker
                        <span className="ml-1 text-[9px] bg-white/20 rounded-md px-1.5 py-0.5 font-bold uppercase tracking-wider">+ Recording</span>
                    </button>
                ) : (
                    <button
                        onClick={handleStopTracker}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#A84B4B] hover:bg-[#8E3B3B] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-warm-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <MonitorOff size={15} />
                        Stop Tracker
                    </button>
                )}
            </div>

        </div>
    );
}
