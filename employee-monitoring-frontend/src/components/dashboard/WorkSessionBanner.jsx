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
        if (isClockedIn && activeAttendance?.clockIn && !isOnBreak) {
            const start = new Date(activeAttendance.clockIn).getTime();
            setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
            timer = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isClockedIn, activeAttendance, isOnBreak]);

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    };

    // ── Clock In / Out ─────────────────────────────────────────────────────────
    const handleClockIn = async () => {
        setIsLoading(true);
        try { await clockIn(); }
        catch (err) { console.error('Clock in failed', err); }
        finally { setIsLoading(false); }
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
        <div className="bg-[#ffffff] dark:bg-[#0f172a] p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-warm-xs flex flex-col gap-3.5 mb-6 sm:mb-8 w-full">

            {/* ── Row 1: Timer + status ───────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-center gap-4 justify-between p-4 sm:p-5 bg-[#f1f5f9]/50 dark:bg-[#1E2419] rounded-xl border border-[#e2e8f0] dark:border-[#1e293b]">
                {/* Timer */}
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.14em] mb-1">
                        {isOnBreak ? 'Session Paused' : 'Total Work Hours'}
                    </span>
                    <div className="font-sans text-3xl lg:text-4xl font-bold text-[#0f172a] dark:text-[#f8fafc] tabular-nums tracking-tight">
                        {formatTime(elapsedSeconds)}
                    </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2">
                    {isAgentActive ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F7F4] text-[#10b981] border border-[#C8DAC8] text-xs font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                            Tracker Active
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f1f5f9] text-[#64748b] text-xs font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                            Tracker Inactive
                        </span>
                    )}
                    {isClockedIn && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDFBF7] text-[#6366f1] border border-[#e2e8f0] text-xs font-bold uppercase tracking-wider">
                            <Clock size={12} />
                            Clocked In
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
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1e293b] hover:bg-[#334155] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-warm-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <LogIn size={15} className="text-[#818cf8]" />
                        Clock In
                    </button>
                ) : (
                    <button
                        onClick={handleClockOut}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#f43f5e] hover:bg-[#8E3B3B] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-warm-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <LogOut size={15} />
                        Clock Out
                    </button>
                )}

                {/* Start / Stop Tracker (Screen Share + Recording) */}
                {!isAgentActive ? (
                    <button
                        onClick={handleStartTracker}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#10b981] hover:bg-[#4A6B53] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-warm-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <MonitorCheck size={15} />
                        Start Tracker
                        <span className="ml-1 text-[9px] bg-white/20 rounded-md px-1.5 py-0.5 font-bold uppercase tracking-wider">+ Recording</span>
                    </button>
                ) : (
                    <button
                        onClick={handleStopTracker}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#f43f5e] hover:bg-[#8E3B3B] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-warm-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <MonitorOff size={15} />
                        Stop Tracker
                    </button>
                )}
            </div>

        </div>
    );
}
