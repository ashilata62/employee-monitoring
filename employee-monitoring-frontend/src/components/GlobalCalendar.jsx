import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { useFilterStore } from '../store/filterStore';

const PRESETS = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last_7' },
    { label: 'Last 30 Days', value: 'last_30' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Custom', value: 'custom' },
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toYMD(d) {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function CalendarGrid({ viewDate, setViewDate, rangeStart, rangeEnd, onPickDate }) {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const days = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={() => {
                        const d = new Date(viewDate);
                        d.setMonth(d.getMonth() - 1);
                        setViewDate(d);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <ChevronLeft size={16} className="text-slate-500" />
                </button>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                    {MONTHS[month]} {year}
                </span>
                <button
                    type="button"
                    onClick={() => {
                        const d = new Date(viewDate);
                        d.setMonth(d.getMonth() + 1);
                        setViewDate(d);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <ChevronRight size={16} className="text-slate-500" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] font-black text-slate-400 py-1 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
                {days.map((d, i) => {
                    if (!d) return <div key={`pad-${i}`} />;
                    const ymd = toYMD(d);
                    const isStart = ymd === rangeStart;
                    const isEnd = ymd === rangeEnd;
                    const inRange = rangeStart && rangeEnd && ymd > rangeStart && ymd < rangeEnd;
                    const isToday = ymd === toYMD(new Date());
                    return (
                        <button
                            key={ymd}
                            type="button"
                            onClick={() => onPickDate(ymd)}
                            className={clsx(
                                'h-8 w-full text-[11px] font-bold rounded-lg transition-all',
                                isStart || isEnd
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : inRange
                                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-none'
                                      : isToday
                                        ? 'border border-primary-300 text-primary-600 dark:border-primary-700 dark:text-primary-400'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            )}
                        >
                            {d.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function GlobalCalendar({ label, className }) {
    const { quickFilter, dateRange, setQuickFilter, setDateRange, resetFilters } = useFilterStore();
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [pickerStep, setPickerStep] = useState('start');
    const [popoverStyle, setPopoverStyle] = useState({});
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => {
            if (
                ref.current && 
                !ref.current.contains(e.target) && 
                !e.target.closest('.global-calendar-popover')
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    useEffect(() => {
        if (!open) {
            setPickerStep('start');
        }
    }, [open]);

    useEffect(() => {
        if (!open || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = 288;
        let left = rect.left;
        if (left + width > window.innerWidth - 12) {
            left = window.innerWidth - width - 12;
        }
        left = Math.max(12, left);
        setPopoverStyle({
            position: 'fixed',
            top: rect.bottom + 8,
            left,
            width,
            zIndex: 9999,
        });
    }, [open, quickFilter]);

    const handlePreset = (preset) => {
        if (preset !== 'custom') {
            setQuickFilter(preset);
            setOpen(false);
        } else {
            setQuickFilter('custom');
            setPickerStep('start');
        }
    };

    const handlePickDate = (ymd) => {
        if (pickerStep === 'start') {
            setDateRange(ymd, ymd);
            setPickerStep('end');
        } else {
            const { start } = dateRange;
            if (ymd < start) setDateRange(ymd, start);
            else setDateRange(start, ymd);
            setOpen(false);
            setPickerStep('start');
        }
    };

    const displayLabel =
        label ??
        (() => {
            if (quickFilter === 'today') return 'Today';
            if (quickFilter === 'yesterday') return 'Yesterday';
            if (quickFilter === 'last_7') return 'Last 7 Days';
            if (quickFilter === 'last_30') return 'Last 30 Days';
            if (quickFilter === 'this_month') return 'This Month';
            if (dateRange.start === dateRange.end) return dateRange.start;
            return `${dateRange.start} → ${dateRange.end}`;
        })();

    const isModified = quickFilter !== 'today';

    const popover = open ? (
        <div
            style={popoverStyle}
            className="global-calendar-popover rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto"
        >
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Quick Select</p>
                <div className="grid grid-cols-3 gap-1">
                    {PRESETS.map((p) => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => handlePreset(p.value)}
                            className={clsx(
                                'px-2 py-1.5 text-[10px] font-black rounded-lg transition-all',
                                quickFilter === p.value
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600'
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-3">
                {quickFilter === 'custom' && (
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                        {pickerStep === 'start' ? 'Select start date' : 'Select end date'}
                    </p>
                )}
                <CalendarGrid
                    viewDate={viewDate}
                    setViewDate={setViewDate}
                    rangeStart={dateRange.start}
                    rangeEnd={dateRange.end}
                    onPickDate={handlePickDate}
                />
            </div>

            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-800">
                <button
                    type="button"
                    onClick={() => {
                        resetFilters();
                        setOpen(false);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                    <RotateCcw size={11} /> Reset
                </button>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-[10px] font-black text-primary-600 hover:text-primary-700"
                >
                    Done
                </button>
            </div>
        </div>
    ) : null;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={clsx(
                    'flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl border transition-all shadow-warm-xs cursor-pointer',
                    open || isModified
                        ? 'bg-[#EEE8DD] border-[#B9955B] text-[#B9955B]'
                        : 'bg-[#FBF9F5] dark:bg-[#252B20] border-[#E5DED2] dark:border-[#384232] text-[#29291F] dark:text-[#F5F1E9] hover:border-[#B9955B]',
                    className
                )}
            >
                <Calendar size={14} strokeWidth={2.2} className={isModified ? 'text-[#B9955B]' : 'text-[#777367]'} />
                <span>{displayLabel}</span>
                {isModified && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation();
                            resetFilters();
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && resetFilters()}
                        className="ml-1 flex items-center justify-center h-4 w-4 rounded-full hover:bg-[#E5DED2] dark:hover:bg-[#384232]"
                    >
                        <X size={10} />
                    </span>
                )}
            </button>
            {typeof document !== 'undefined' && popover && createPortal(popover, document.body)}
        </div>
    );
}
