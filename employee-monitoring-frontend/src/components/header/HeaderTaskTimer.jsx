import React from 'react';
import { Clock, Square, Play, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore, formatDuration } from '../../store/taskStore';

export function HeaderTaskTimer() {
    const { role } = useAuthStore();
    const activeTask = useTaskStore((state) => state.activeTask);
    const isRunning = useTaskStore((state) => state.isRunning);
    const seconds = useTaskStore((state) => state.seconds);
    const timerActionLoading = useTaskStore((state) => state.timerActionLoading);
    const stopTask = useTaskStore((state) => state.stopTask);

    // Only render for authenticated EMPLOYEE role
    if (role !== 'EMPLOYEE') {
        return null;
    }

    // Neutral idle state when no task is running
    if (!isRunning || !activeTask) {
        return (
            <div 
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 text-xs select-none transition-colors"
                title="No active task running. Start a task from the Tasks & Projects board."
            >
                <Clock size={13} className="opacity-60 shrink-0" />
                <span className="text-[11px] font-medium tracking-tight">No Active Task</span>
            </div>
        );
    }

    const handleStop = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        await useTaskStore.getState().stopTask();
    };

    return (
        <div 
            className="flex items-center gap-2 sm:gap-3 bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-sm transition-all animate-in fade-in duration-200"
            role="status"
            aria-live="polite"
        >
            {/* Running Pulse Indicator */}
            <div className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>

            {/* Task Info */}
            <div className="flex flex-col min-w-0">
                <span className="hidden sm:inline text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 leading-none">
                    Currently Working On
                </span>
                <span 
                    className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[65px] xs:max-w-[100px] sm:max-w-[140px] md:max-w-[200px]"
                    title={activeTask.title}
                >
                    {activeTask.title}
                </span>
            </div>

            {/* Live Elapsed Duration Ticker */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50 shadow-inner shrink-0">
                <Clock size={12} strokeWidth={2.5} className="text-indigo-500 animate-spin-slow shrink-0" />
                <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                    {formatDuration(seconds)}
                </span>
            </div>

            {/* Stop Task Action */}
            <button
                onClick={handleStop}
                disabled={timerActionLoading}
                title="Stop current task"
                className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 hover:shadow-rose-500/20 shrink-0"
            >
                <Square size={11} fill="currentColor" />
                <span className="hidden sm:inline text-[11px]">Stop Task</span>
            </button>
        </div>
    );
}

export default HeaderTaskTimer;
