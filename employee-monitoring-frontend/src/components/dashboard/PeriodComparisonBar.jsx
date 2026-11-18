import React, { useState, useRef, useEffect } from 'react';
import {
    Calendar,
    ArrowRightLeft,
    Plus,
    Filter,
    Download,
    Bell,
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
                        Overview
                    </h1>
                    <p className="text-xs font-medium text-[#777367] dark:text-[#B8B3A7] mt-0.5">
                        Workforce performance & productivity intelligence
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`${rolePrefix}/alerts`)}
                        className="relative w-10 h-10 rounded-xl bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] flex items-center justify-center text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DED2] transition-colors cursor-pointer"
                        title="Alerts & Notifications"
                    >
                        <Bell size={17} className="text-[#777367]" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#A84B4B] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#F5F1E9] dark:border-[#1A1F18]">
                            2
                        </span>
                    </button>
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
                            <div className="absolute top-full left-0 mt-2 w-64 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl shadow-xl border border-[#D6CDBC] dark:border-[#384232] p-2 z-50 animate-in fade-in duration-150">
                                <p className="px-3 py-1.5 text-[9px] font-bold text-[#777367] uppercase tracking-[0.15em]">Select Range</p>
                                {[
                                    { label: 'Today', start: new Date().toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
                                    { label: 'Last 7 Days', start: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
                                    { label: 'This Month', start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
                                    { label: 'Last 30 Days', start: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) }
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
                            className="flex items-center gap-2.5 px-4 py-2 bg-[#EEE8DD] dark:bg-[#252B20] rounded-xl border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#777367] dark:text-[#B8B3A7] hover:border-[#B9955B] transition-all shadow-warm-xs cursor-pointer"
                        >
                            <Calendar size={13} className="text-[#777367]" />
                            <span>{compStartStr} → {compEndStr}</span>
                        </button>

                        {showCompDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl shadow-xl border border-[#D6CDBC] dark:border-[#384232] p-2 z-50 animate-in fade-in duration-150">
                                <p className="px-3 py-1.5 text-[9px] font-bold text-[#777367] uppercase tracking-[0.15em]">Select Comparison Range</p>
                                {[
                                    { label: 'Prior Period (Equal Duration)', start: null, end: null },
                                    { label: 'Yesterday', start: new Date(Date.now() - 86400000).toISOString().slice(0, 10), end: new Date(Date.now() - 86400000).toISOString().slice(0, 10) },
                                    { label: 'Previous Month', start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 10), end: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().slice(0, 10) }
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
                            <div className="absolute top-full left-0 mt-2 w-72 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl shadow-2xl border border-[#D6CDBC] dark:border-[#384232] p-4 z-50 animate-in fade-in duration-150 space-y-3">
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
                </div>

                {/* 4. Export Button */}
                <div className="relative self-end mt-2 sm:mt-0" ref={exportRef}>
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="p-2.5 bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] rounded-xl transition-all shadow-warm-xs active:scale-95 cursor-pointer"
                        title="Download / Export Report"
                    >
                        <Download size={15} />
                    </button>

                    {showExportMenu && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl shadow-xl border border-[#D6CDBC] dark:border-[#384232] p-2 z-50 animate-in fade-in duration-150">
                            <button
                                onClick={() => {
                                    if (onExport) onExport('csv');
                                    setShowExportMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#29291F] dark:text-[#E2E8DE] hover:bg-[#EEE8DD] dark:hover:bg-[#2E362A] rounded-xl cursor-pointer"
                            >
                                <FileSpreadsheet size={14} className="text-[#5E7D64]" />
                                <span>Export as CSV</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (onExport) onExport('pdf');
                                    setShowExportMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#29291F] dark:text-[#E2E8DE] hover:bg-[#EEE8DD] dark:hover:bg-[#2E362A] rounded-xl cursor-pointer"
                            >
                                <FileText size={14} className="text-[#A84B4B]" />
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
