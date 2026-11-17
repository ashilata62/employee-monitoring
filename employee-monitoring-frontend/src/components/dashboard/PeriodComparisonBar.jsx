import React, { useState, useRef, useEffect } from 'react';
import {
    Calendar,
    ArrowRightLeft,
    Plus,
    Check,
    Filter,
    Download,
    Bell,
    UserPlus,
    X,
    ChevronDown,
    FileSpreadsheet,
    FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    role = 'admin'
}) {
    const navigate = useNavigate();
    const rolePrefix = role ? `/${role.toLowerCase()}` : '/admin';
    const [showRefDropdown, setShowRefDropdown] = useState(false);
    const [showCompDropdown, setShowCompDropdown] = useState(false);
    const [showFilterPopover, setShowFilterPopover] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Filter states
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedRole, setSelectedRole] = useState('');

    const refRef = useRef(null);
    const compRef = useRef(null);
    const filterRef = useRef(null);
    const exportRef = useRef(null);

    // Close dropdowns on outside click
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
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return dStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    const refStartStr = formatDate(startDate) || 'Mar 01, 2026';
    const refEndStr = formatDate(endDate) || 'Mar 31, 2026';
    const compStartStr = formatDate(compareStartDate) || 'Feb 01, 2026';
    const compEndStr = formatDate(compareEndDate) || 'Feb 28, 2026';

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
        <div className="space-y-4 mb-8">
            {/* ── Top Header Row (Matching Insightful Reference Image 2) ────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Productivity Trends
                </h1>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`${rolePrefix}/employees`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                        <span>Add New Employee</span>
                    </button>

                    {/* Bell Notification with active red count matching Image 2 */}
                    <button
                        onClick={() => navigate(`${rolePrefix}/alerts`)}
                        className="relative w-10 h-10 rounded-xl bg-[#e0e7ff] dark:bg-slate-800 flex items-center justify-center text-[#4f46e5] dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-slate-700 transition-colors"
                        title="Alerts & Notifications"
                    >
                        <Bell size={18} />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                            2
                        </span>
                    </button>
                </div>
            </div>

            {/* ── Period Selectors & Filters Row (Exact Layout of Image 2) ─────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                    {/* 1. Reference Period Selector - Soft Purple Tint Matching Image 2 */}
                    <div className="relative" ref={refRef}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Reference Period
                        </p>
                        <button
                            onClick={() => setShowRefDropdown(!showRefDropdown)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#ede9fe] dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-[#4338ca] dark:text-indigo-300 hover:border-indigo-400 transition-all shadow-sm"
                        >
                            <Calendar size={13} className="text-[#4f46e5]" />
                            <span>{refStartStr} → {refEndStr}</span>
                        </button>

                        {/* Reference Period Dropdown */}
                        {showRefDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in duration-200">
                                <p className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Reference Range</p>
                                {[
                                    { label: 'Today (Nov 17, 2026)', start: '2026-11-17', end: '2026-11-17' },
                                    { label: 'Yesterday (Nov 16, 2026)', start: '2026-11-16', end: '2026-11-16' },
                                    { label: 'Last 7 Days', start: '2026-11-11', end: '2026-11-17' },
                                    { label: 'This Month (Nov 2026)', start: '2026-11-01', end: '2026-11-17' },
                                    { label: 'Mar 01, 2026 → Mar 31, 2026', start: '2026-03-01', end: '2026-03-31' }
                                ].map(p => (
                                    <button
                                        key={p.label}
                                        onClick={() => {
                                            if (onDateRangeChange) onDateRangeChange(p.start, p.end);
                                            setShowRefDropdown(false);
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Swap / Compare Icon ⇄ */}
                    <div className="mt-5 text-[#4f46e5] dark:text-indigo-400 px-1">
                        <ArrowRightLeft size={16} />
                    </div>

                    {/* 2. Compared Period Selector */}
                    <div className="relative" ref={compRef}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Compared Period
                        </p>
                        <button
                            onClick={() => setShowCompDropdown(!showCompDropdown)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 transition-all shadow-sm"
                        >
                            <Calendar size={13} className="text-slate-400" />
                            <span>{compStartStr} → {compEndStr}</span>
                        </button>

                        {/* Compared Period Dropdown */}
                        {showCompDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in duration-200">
                                <p className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Comparison Range</p>
                                {[
                                    { label: 'Feb 01, 2026 → Feb 28, 2026', start: '2026-02-01', end: '2026-02-28' },
                                    { label: 'Prior Period (Equal Duration)', start: null, end: null },
                                    { label: 'Yesterday (Nov 15, 2026)', start: '2026-11-15', end: '2026-11-15' },
                                    { label: 'Previous Month (October 2026)', start: '2026-10-01', end: '2026-10-31' }
                                ].map(p => (
                                    <button
                                        key={p.label}
                                        onClick={() => {
                                            if (onCompareRangeChange) onCompareRangeChange(p.start, p.end);
                                            setShowCompDropdown(false);
                                        }}
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. + Add Filter Button with Popover */}
                    <div className="relative mt-5" ref={filterRef}>
                        <button
                            onClick={() => setShowFilterPopover(!showFilterPopover)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                isFilterActive
                                    ? 'bg-[#4f46e5] text-white shadow-indigo-600/20'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#4f46e5] dark:text-indigo-400 hover:bg-indigo-50'
                            }`}
                        >
                            <Plus size={13} strokeWidth={2.5} />
                            <span>Add Filter</span>
                            {isFilterActive && <span className="w-2 h-2 rounded-full bg-white ml-1" />}
                        </button>

                        {/* Filter Popover */}
                        {showFilterPopover && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in duration-200 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                        <Filter size={13} className="text-[#4f46e5]" /> Filter Analytics
                                    </span>
                                    {isFilterActive && (
                                        <button onClick={handleClearFilter} className="text-[10px] font-black text-rose-500 hover:underline">
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                {/* Filter by Department / Team */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Department / Team</label>
                                    <select
                                        value={selectedTeam}
                                        onChange={(e) => setSelectedTeam(e.target.value)}
                                        className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
                                    >
                                        <option value="">All Departments</option>
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filter by Employee */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Employee</label>
                                    <select
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                        className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
                                    >
                                        <option value="">All Employees</option>
                                        {employees.map(e => (
                                            <option key={e.id} value={e.id}>{e.fullName || e.name || e.email}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filter by Role */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Role</label>
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
                                    >
                                        <option value="">All Roles</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="EMPLOYEE">Employee</option>
                                    </select>
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2">
                                    <button
                                        onClick={handleClearFilter}
                                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={handleApplyFilter}
                                        className="px-4 py-1.5 bg-[#4f46e5] text-white rounded-xl text-xs font-bold hover:bg-[#4338ca] shadow-sm"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Export Button (Exact Icon Button Matching Image 2 Right Side) */}
                <div className="relative mt-5" ref={exportRef}>
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-all shadow-sm active:scale-95"
                        title="Download / Export Report"
                    >
                        <Download size={16} />
                    </button>

                    {showExportMenu && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in duration-200">
                            <button
                                onClick={() => {
                                    if (onExport) onExport('csv');
                                    setShowExportMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                            >
                                <FileSpreadsheet size={14} className="text-emerald-600" />
                                <span>Export as CSV</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (onExport) onExport('pdf');
                                    setShowExportMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                            >
                                <FileText size={14} className="text-rose-600" />
                                <span>Export as PDF</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PeriodComparisonBar;
