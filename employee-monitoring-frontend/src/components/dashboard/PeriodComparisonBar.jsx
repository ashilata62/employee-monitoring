import React, { useState, useRef, useEffect } from 'react';
import {
    Calendar,
    ArrowRightLeft,
    Plus,
    Filter,
    Download,
    Bell,
    FileSpreadsheet,
    FileText,
    LogIn,
    LogOut,
    Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSessionTimer } from '../../hooks/useLiveTime';
import { formatSecondsToHMS } from '../../utils/timeFormat';

export function PeriodComparisonBar({
    startDate,
    endDate,
    compareStartDate,
    compareEndDate,
    onDateRangeChange,
    onCompareRangeChange,
    onFilterChange,
    onExport,
    employees = [],
    teams = [],
    role = 'admin',
    unreadCount = 0
}) {
    const navigate = useNavigate();
    const rolePrefix = role ? `/${role.toLowerCase()}` : '/admin';
    const [showRefDropdown, setShowRefDropdown] = useState(false);
    const [showCompDropdown, setShowCompDropdown] = useState(false);
    const [showFilterPopover, setShowFilterPopover] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [menuAlignLeft, setMenuAlignLeft] = useState(false);

    // Filter states
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedRole, setSelectedRole] = useState('');

    // Attendance session for Manager / Admin
    const { isClockedIn, isOnBreak, clockIn, clockOut, toggleBreak } = useAuthStore();
    const sessionSeconds = useSessionTimer();
    const [isSessionLoading, setIsSessionLoading] = useState(false);

    const handleToggleExport = () => {
        if (!showExportMenu && exportRef.current) {
            const rect = exportRef.current.getBoundingClientRect();
            // If button is closer than 220px to left screen edge, anchor dropdown to left edge to prevent clipping off-screen
            setMenuAlignLeft(rect.left < 220);
        }
        setShowExportMenu(prev => !prev);
    };

    const renderExportButton = () => (
        <div className="relative self-end" ref={exportRef}>
            <button
                type="button"
                onClick={handleToggleExport}
                className={`p-2.5 rounded-xl border transition-all shadow-warm-xs active:scale-95 cursor-pointer ${
                    showExportMenu
                        ? 'bg-[#B9955B] text-white border-[#B9955B]'
                        : 'bg-[#EEE8DD] dark:bg-[#252B20] border-[#D6CDBC] dark:border-[#384232] text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9]'
                }`}
                title="Download / Export Report"
            >
                <Download size={15} />
            </button>

            {showExportMenu && (
                <div className={`absolute top-full ${menuAlignLeft ? 'left-0' : 'right-0'} mt-2 w-52 max-w-[calc(100vw-2rem)] bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl shadow-2xl border border-[#D6CDBC] dark:border-[#384232] p-2 z-[9999] animate-in fade-in duration-150`}>
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7] border-b border-[#D6CDBC]/50 dark:border-[#384232]/50 mb-1">
                        Export Report
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (onExport) onExport('csv');
                            setShowExportMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#29291F] dark:text-[#E2E8DE] hover:bg-[#EEE8DD] dark:hover:bg-[#2E362A] rounded-xl transition-colors cursor-pointer"
                    >
                        <FileSpreadsheet size={15} className="text-[#5E7D64]" />
                        <span>Export as CSV (.csv)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (onExport) onExport('pdf');
                            setShowExportMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#29291F] dark:text-[#E2E8DE] hover:bg-[#EEE8DD] dark:hover:bg-[#2E362A] rounded-xl transition-colors cursor-pointer"
                    >
                        <FileText size={15} className="text-[#A84B4B]" />
                        <span>Export as PDF (.pdf)</span>
                    </button>
                </div>
            )}
        </div>
    );

    const handleClockIn = async () => {
        setIsSessionLoading(true);
        try {
            await clockIn();
        } catch (e) {
            console.error('Clock in error', e);
        } finally {
            setIsSessionLoading(false);
        }
    };

    const handleClockOut = async () => {
        setIsSessionLoading(true);
        try {
            await clockOut();
        } catch (e) {
            console.error('Clock out error', e);
        } finally {
            setIsSessionLoading(false);
        }
    };

    const handleToggleBreak = async () => {
        setIsSessionLoading(true);
        try {
            await toggleBreak();
        } catch (e) {
            console.error('Toggle break error', e);
        } finally {
            setIsSessionLoading(false);
        }
    };

    const refRef = useRef(null);
    const compRef = useRef(null);
    const filterRef = useRef(null);
    const exportRef = useRef(null);

    const toLocalDateStr = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const todayStr = toLocalDateStr(new Date());
    const last7Str = toLocalDateStr(new Date(Date.now() - 6 * 86400000));
    const firstOfMonthStr = toLocalDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const last30Str = toLocalDateStr(new Date(Date.now() - 29 * 86400000));
    const yesterdayStr = toLocalDateStr(new Date(Date.now() - 86400000));
    const firstOfPrevMonthStr = toLocalDateStr(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
    const lastOfPrevMonthStr = toLocalDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 0));

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (refRef.current && !refRef.current.contains(e.target)) setShowRefDropdown(false);
            if (compRef.current && !compRef.current.contains(e.target)) setShowCompDropdown(false);
            if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterPopover(false);
            if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (dStr) => {
        if (!dStr) return '';
        if (typeof dStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
            const [y, m, day] = dStr.split('-');
            const d = new Date(Number(y), Number(m) - 1, Number(day));
            return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        }
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return dStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    const refStartStr = formatDate(startDate) || 'Today';
    const refEndStr = formatDate(endDate) || 'Today';
    const compStartStr = formatDate(compareStartDate) || 'Prior Period';
    const compEndStr = formatDate(compareEndDate) || 'Prior Period';

    const handleApplyFilter = () => {
        if (onFilterChange) {
            onFilterChange({
                employeeId: selectedEmployee || null,
                teamId: selectedTeam || null,
                role: selectedRole || null
            });
        }
        setShowFilterPopover(false);
    };

    const handleClearFilter = () => {
        setSelectedEmployee('');
        setSelectedTeam('');
        setSelectedRole('');
        if (onFilterChange) {
            onFilterChange({ employeeId: null, teamId: null, role: null });
        }
        setShowFilterPopover(false);
    };

    const isFilterActive = selectedEmployee || selectedTeam || selectedRole;

    return (
        <div className="space-y-4 mb-6 sm:mb-7">
            {/* Top Header Row with Serif Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#29291F] dark:text-[#F5F1E9] tracking-tight">
                        {role?.toUpperCase() === 'ADMIN' ? 'Productivity Trends' : 'Overview'}
                    </h1>
                    <p className="text-xs font-medium text-[#777367] dark:text-[#B8B3A7] mt-0.5">
                        {role?.toUpperCase() === 'ADMIN'
                            ? 'Workforce performance & productivity intelligence'
                            : role?.toUpperCase() === 'MANAGER'
                            ? 'Team performance & productivity intelligence'
                            : 'Your personal activity, attendance & productivity summary'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Add New Employee & Bell are strictly for Admin */}
                    {role?.toUpperCase() === 'ADMIN' && (
                        <>
                            <button
                                onClick={() => navigate(`${rolePrefix}/employees`)}
                                className="px-4 py-2 rounded-xl bg-[#5932EA] hover:bg-[#4A28C7] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Add New Employee</span>
                            </button>

                            <button
                                onClick={() => navigate(`${rolePrefix}/alerts`)}
                                className="relative w-10 h-10 rounded-xl bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] flex items-center justify-center text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DED2] transition-colors cursor-pointer"
                                title="Alerts & Notifications"
                            >
                                <Bell size={17} className="text-[#777367]" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#A84B4B] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#F5F1E9] dark:border-[#1A1F18]">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Period Selectors & Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                    {/* 1. Reference Period Selector */}
                    <div className="relative" ref={refRef}>
                        <p className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1">
                            Reference Period
                        </p>
                        <button
                            onClick={() => setShowRefDropdown(!showRefDropdown)}
                            className="flex items-center gap-2.5 px-4 py-2 bg-[#EEE8DD] dark:bg-[#252B20] rounded-xl border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] hover:border-[#B9955B] transition-all shadow-warm-xs cursor-pointer"
                        >
                            <Calendar size={13} className="text-[#B9955B]" />
                            <span>{refStartStr} → {refEndStr}</span>
                        </button>

                        {showRefDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl shadow-xl border border-[#D6CDBC] dark:border-[#384232] p-2 z-50 animate-in fade-in duration-150">
                                <p className="px-3 py-1.5 text-[9px] font-bold text-[#777367] uppercase tracking-[0.15em]">Select Range</p>
                                {[
                                    { label: 'Today', start: todayStr, end: todayStr },
                                    { label: 'Last 7 Days', start: last7Str, end: todayStr },
                                    { label: 'This Month', start: firstOfMonthStr, end: todayStr },
                                    { label: 'Last 30 Days', start: last30Str, end: todayStr }
                                ].map(p => (
                                    <button
                                        key={p.label}
                                        onClick={() => {
                                            if (onDateRangeChange) onDateRangeChange(p.start, p.end);
                                            setShowRefDropdown(false);
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#29291F] dark:text-[#E2E8DE] hover:bg-[#EEE8DD] dark:hover:bg-[#2E362A] transition-colors"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Swap / Compare Icon ⇄, Compared Period Selector & Filter Popover (Strictly for Admin & Manager) */}
                    {role?.toUpperCase() !== 'EMPLOYEE' && (
                        <>
                            {/* Swap / Compare Icon ⇄ */}
                            <div className="hidden sm:flex items-center self-end mb-2.5 text-[#B9955B] px-1">
                                <ArrowRightLeft size={15} />
                            </div>

                            {/* 2. Compared Period Selector */}
                            <div className="relative" ref={compRef}>
                                <p className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1">
                                    Compared Period
                                </p>
                                <button
                                    onClick={() => setShowCompDropdown(!showCompDropdown)}
                                    className="flex items-center gap-2.5 px-4 py-2 bg-[#EEE8DD] dark:bg-[#252B20] rounded-xl border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#777367] dark:text-[#B8B3A7] hover:border-[#B9955B] transition-all shadow-warm-xs cursor-pointer max-w-full"
                                >
                                    <Calendar size={13} className="text-[#777367] shrink-0" />
                                    <span className="truncate">{compStartStr} → {compEndStr}</span>
                                </button>

                                {showCompDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl shadow-xl border border-[#D6CDBC] dark:border-[#384232] p-2 z-50 animate-in fade-in duration-150">
                                        <p className="px-3 py-1.5 text-[9px] font-bold text-[#777367] uppercase tracking-[0.15em]">Select Comparison Range</p>
                                        {[
                                            { label: 'Prior Period (Equal Duration)', start: null, end: null },
                                            { label: 'Yesterday', start: yesterdayStr, end: yesterdayStr },
                                            { label: 'Previous Month', start: firstOfPrevMonthStr, end: lastOfPrevMonthStr }
                                        ].map(p => (
                                            <button
                                                key={p.label}
                                                onClick={() => {
                                                    if (onCompareRangeChange) onCompareRangeChange(p.start, p.end);
                                                    setShowCompDropdown(false);
                                                }}
                                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#29291F] dark:text-[#E2E8DE] hover:bg-[#EEE8DD] dark:hover:bg-[#2E362A] transition-colors"
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 3. + Add Filter Button with Popover */}
                            <div className="relative self-end" ref={filterRef}>
                                <button
                                    onClick={() => setShowFilterPopover(!showFilterPopover)}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-warm-xs cursor-pointer ${
                                        isFilterActive
                                            ? 'bg-[#B9955B] text-white shadow-sm'
                                            : 'bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#EEE8DD]'
                                    }`}
                                >
                                    <Plus size={13} strokeWidth={2.5} className={isFilterActive ? 'text-white' : 'text-[#B9955B]'} />
                                    <span>Filters</span>
                                    {isFilterActive && <span className="w-1.5 h-1.5 rounded-full bg-white ml-1" />}
                                </button>

                                {showFilterPopover && (
                                    <div className="absolute top-full left-0 sm:left-auto right-auto sm:right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl shadow-2xl border border-[#D6CDBC] dark:border-[#384232] p-4 z-50 animate-in fade-in duration-150 space-y-3">
                                        <div className="flex items-center justify-between pb-2 border-b border-[#D6CDBC] dark:border-[#384232]">
                                            <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] flex items-center gap-1.5">
                                                <Filter size={13} className="text-[#B9955B]" /> Filter Analytics
                                            </span>
                                            {isFilterActive && (
                                                <button onClick={handleClearFilter} className="text-[10px] font-bold text-[#A84B4B] hover:underline">
                                                    Clear All
                                                </button>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-[#777367] uppercase tracking-wider">Department / Team</label>
                                            <select
                                                value={selectedTeam}
                                                onChange={(e) => setSelectedTeam(e.target.value)}
                                                className="w-full mt-1 p-2 rounded-xl bg-[#EEE8DD]/60 dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9]"
                                            >
                                                <option value="">All Departments</option>
                                                {teams.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-[#777367] uppercase tracking-wider">Employee</label>
                                            <select
                                                value={selectedEmployee}
                                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                                className="w-full mt-1 p-2 rounded-xl bg-[#EEE8DD]/60 dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9]"
                                            >
                                                <option value="">All Employees</option>
                                                {employees.map(e => (
                                                    <option key={e.id} value={e.id}>{e.fullName || e.name || e.email}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {role?.toUpperCase() === 'ADMIN' && (
                                            <div>
                                                <label className="text-[10px] font-bold text-[#777367] uppercase tracking-wider">Role</label>
                                                <select
                                                    value={selectedRole}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                    className="w-full mt-1 p-2 rounded-xl bg-[#EEE8DD]/60 dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9]"
                                                >
                                                    <option value="">All Roles</option>
                                                    <option value="ADMIN">Admin</option>
                                                    <option value="MANAGER">Manager</option>
                                                    <option value="EMPLOYEE">Employee</option>
                                                </select>
                                            </div>
                                        )}

                                        <div className="pt-2 flex items-center justify-end gap-2">
                                            <button
                                                onClick={handleClearFilter}
                                                className="px-3 py-1.5 text-xs font-semibold text-[#777367] hover:text-[#29291F]"
                                            >
                                                Reset
                                            </button>
                                            <button
                                                onClick={handleApplyFilter}
                                                className="px-4 py-1.5 bg-[#B9955B] text-white rounded-xl text-xs font-semibold hover:bg-[#A17D45] shadow-xs cursor-pointer"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* 4. Session Controls (Clock In / Clock Out / Take Break) - Commented out for Admin Dashboard, active for Manager */}
                    {role?.toUpperCase() === 'MANAGER' && (
                        <div className="flex items-center gap-2 self-end">
                            {!isClockedIn ? (
                                <button
                                    onClick={handleClockIn}
                                    disabled={isSessionLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#30382B] hover:bg-[#3C4536] text-white rounded-xl text-xs font-bold shadow-warm-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                    <LogIn size={13} className="text-[#D3B98D]" />
                                    <span>Clock In</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Clock Out Button (Replaces Clock In) */}
                                    <button
                                        onClick={handleClockOut}
                                        disabled={isSessionLoading}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#A84B4B] hover:bg-[#8E3B3B] text-white rounded-xl text-xs font-bold shadow-warm-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                                    >
                                        <LogOut size={13} />
                                        <span>Clock Out</span>
                                    </button>

                                    {/* Take a Break / Resume Work Button */}
                                    <button
                                        onClick={handleToggleBreak}
                                        disabled={isSessionLoading}
                                        className={`flex items-center gap-1.5 px-3.5 py-2 ${
                                            isOnBreak
                                                ? 'bg-[#5E7D64] hover:bg-[#4A6B53]'
                                                : 'bg-[#B9955B] hover:bg-[#A17D45]'
                                        } text-white rounded-xl text-xs font-bold shadow-warm-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50`}
                                    >
                                        <Clock size={13} />
                                        <span>{isOnBreak ? 'Resume Work' : 'Take a Break'}</span>
                                    </button>

                                    {/* Persistent live session timer */}
                                    <div className="flex items-center gap-2 px-3.5 py-2 bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] rounded-xl text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] tabular-nums shadow-warm-xs">
                                        <Clock size={13} className={isOnBreak ? 'text-amber-500' : 'text-[#B9955B] animate-pulse'} />
                                        <span>{formatSecondsToHMS(sessionSeconds)}</span>
                                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold ${
                                            isOnBreak 
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' 
                                                : 'bg-[#5E7D64]/15 text-[#5E7D64] dark:text-[#A4C2A8]'
                                        }`}>
                                            {isOnBreak ? 'Paused' : 'Active'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* For Employee view, render the Export button alongside filters so it stays cleanly grouped and never gets orphaned */}
                    {role?.toUpperCase() === 'EMPLOYEE' && renderExportButton()}
                </div>

                {/* For Manager / Admin, render Export button on the right */}
                {role?.toUpperCase() !== 'EMPLOYEE' && renderExportButton()}
            </div>
        </div>
    );
}

export default PeriodComparisonBar;
