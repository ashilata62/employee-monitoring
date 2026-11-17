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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 mb-8 w-full">

            {/* ── Row 1: Timer + status ───────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-center gap-6 justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                {/* Timer */}
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                        {isOnBreak ? 'Session Paused' : 'Total Work Hours'}
                    </span>
                    <div className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                        {formatTime(elapsedSeconds)}
                    </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2">
                    {isAgentActive ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Tracker Active
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Tracker Inactive
                        </span>
                    )}
                    {isClockedIn && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                            <Clock size={11} />
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
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <LogIn size={16} />
                        Clock In
                    </button>
                ) : (
                    <button
                        onClick={handleClockOut}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <LogOut size={16} />
                        Clock Out
                    </button>
                )}

                {/* Start / Stop Tracker (Screen Share + Recording) */}
                {!isAgentActive ? (
                    <button
                        onClick={handleStartTracker}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <MonitorCheck size={16} />
                        Start Tracker
                        <span className="ml-1 text-[10px] bg-white/20 rounded-md px-1.5 py-0.5 font-black uppercase tracking-wider">+ Recording</span>
                    </button>
                ) : (
                    <button
                        onClick={handleStopTracker}
                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <MonitorOff size={16} />
                        Stop Tracker
                    </button>
                )}
            </div>

        </div>
    );
}
