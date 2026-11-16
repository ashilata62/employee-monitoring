import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '../utils/cn'; // Assuming this utility exists, otherwise I'll use twMerge

const presets = [
    "Today", "Yesterday", "Last 7 Days",
    "Last 30 Days", "This Month", "Custom"
];

export function ReportsCalendar({ 
    selectedPreset, 
    setSelectedPreset, 
    selectedDate, 
    setSelectedDate, 
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isRange = false,
    onApply, 
    onCancel 
}) {
    const [viewDate, setViewDate] = useState(new Date((isRange ? startDate : selectedDate) || new Date()));
    const [selectingEnd, setSelectingEnd] = useState(false);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    }, [viewDate]);

    const changeMonth = (offset) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const isInRange = (date) => {
        if (!isRange || !startDate || !endDate || !date) return false;
        // Normalize for comparison
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const s = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
        const e = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
        return d > s && d < e;
    };

    const handleDateClick = (date) => {
        setSelectedPreset('Custom');
        if (!isRange) {
            setSelectedDate(date);
            return;
        }

        if (!selectingEnd) {
            setStartDate(date);
            setEndDate(null);
            setSelectingEnd(true);
        } else {
            if (date >= startDate) {
                setEndDate(date);
            } else {
                setEndDate(startDate);
                setStartDate(date);
            }
            setSelectingEnd(false);
        }
    };

    return (
        <div className="w-[280px] sm:w-[320px] bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Quick Selection Grid */}
            <div>
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">Quick Select</h3>
                <div className="grid grid-cols-2 gap-1.5">
                    {presets.map(preset => (
                        <button
                            key={preset}
                            onClick={() => setSelectedPreset(preset)}
                            className={cn(
                                "py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                selectedPreset === preset 
                                    ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200 dark:shadow-none" 
                                    : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                            )}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            </div>

            {/* Separator */}
            <div className="h-px w-full bg-slate-50 dark:bg-slate-800" />

            {/* Calendar Section */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-4 px-1">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-0.5 text-center">
                    {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(day => (
                        <div key={day} className="text-[9px] font-black text-slate-300 uppercase py-1 tracking-widest">{day}</div>
                    ))}
                    {calendarDays.map((date, idx) => {
                        const isSelected = !isRange 
                            ? isSameDay(date, selectedDate)
                            : (isSameDay(date, startDate) || isSameDay(date, endDate));
                        const inRange = isInRange(date);
                        
                        return (
                            <div key={idx} className={cn(
                                "h-8 flex items-center justify-center relative",
                                inRange && "bg-primary-50 dark:bg-primary-900/10"
                            )}>
                                {date ? (
                                    <button
                                        onClick={() => handleDateClick(date)}
                                        className={cn(
                                            "h-7 w-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center relative z-10",
                                            isSelected 
                                                ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
                                                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                                        )}
                                    >
                                        {date.getDate()}
                                    </button>
                                ) : <div className="h-7 w-7" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <button
                    onClick={() => {
                        setSelectedPreset('Today');
                        const today = new Date();
                        if (isRange) {
                            setStartDate(today);
                            setEndDate(today);
                        } else {
                            setSelectedDate(today);
                        }
                        setViewDate(today);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <RotateCcw size={12} />
                    Reset
                </button>
                <button
                    onClick={onApply}
                    className="px-4 py-1.5 rounded-lg bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest shadow-md shadow-primary-200 hover:brightness-95 transition-all"
                >
                    Done
                </button>
            </div>
        </div>
    );
}
