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
                    <h1 className="font-sans text-3xl sm:text-4xl font-normal text-[#0f172a] dark:text-[#f8fafc] tracking-tight">
                        Overview
                    </h1>
                    <p className="text-xs font-medium text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                        Workforce performance & productivity intelligence
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`${rolePrefix}/employees`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1e293b] hover:bg-[#334155] text-[#FDFBF7] rounded-xl text-xs font-semibold shadow-warm-sm active:scale-95 transition-all cursor-pointer"
                    >
                        <Plus size={14} className="text-[#818cf8]" />
                        <span>Add New Employee</span>
                    </button>

                    <button
                        onClick={() => navigate(`${rolePrefix}/alerts`)}
                        className="relative w-10 h-10 rounded-xl bg-[#f1f5f9] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] flex items-center justify-center text-[#0f172a] dark:text-[#f8fafc] hover:bg-[#e2e8f0] transition-colors cursor-pointer"
                        title="Alerts & Notifications"
                    >
                        <Bell size={17} className="text-[#64748b]" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#f43f5e] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#f8fafc] dark:border-[#1A1F18]">
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
                        <p className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.14em] mb-1">
                            Reference Period
                        </p>
                        <button
                            onClick={() => setShowRefDropdown(!showRefDropdown)}
                            className="flex items-center gap-2.5 px-4 py-2 bg-[#ffffff] dark:bg-[#0f172a] rounded-xl border border-[#e2e8f0] dark:border-[#1e293b] text-xs font-semibold text-[#0f172a] dark:text-[#f8fafc] hover:border-[#6366f1] transition-all shadow-warm-xs cursor-pointer"
                        >
                            <Calendar size={13} className="text-[#6366f1]" />
                            <span>{refStartStr} → {refEndStr}</span>
                        </button>

                        {showRefDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-[#ffffff] dark:bg-[#0f172a] rounded-2xl shadow-xl border border-[#e2e8f0] dark:border-[#1e293b] p-2 z-50 animate-in fade-in duration-150">
                                <p className="px-3 py-1.5 text-[9px] font-bold text-[#64748b] uppercase tracking-[0.15em]">Select Range</p>
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
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#0f172a] dark:text-[#E2E8DE] hover:bg-[#f1f5f9] dark:hover:bg-[#2E362A] transition-colors"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Swap / Compare Icon ⇄ */}
                    <div className="mt-5 text-[#6366f1] px-1">
                        <ArrowRightLeft size={15} />
                    </div>

                    {/* 2. Compared Period Selector */}
                    <div className="relative" ref={compRef}>
                        <p className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.14em] mb-1">
                            Compared Period
                        </p>
                        <button
                            onClick={() => setShowCompDropdown(!showCompDropdown)}
                            className="flex items-center gap-2.5 px-4 py-2 bg-[#ffffff] dark:bg-[#0f172a] rounded-xl border border-[#e2e8f0] dark:border-[#1e293b] text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] hover:border-[#6366f1] transition-all shadow-warm-xs cursor-pointer"
                        >
                            <Calendar size={13} className="text-[#64748b]" />
                            <span>{compStartStr} → {compEndStr}</span>
                        </button>

                        {showCompDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-[#ffffff] dark:bg-[#0f172a] rounded-2xl shadow-xl border border-[#e2e8f0] dark:border-[#1e293b] p-2 z-50 animate-in fade-in duration-150">
                                <p className="px-3 py-1.5 text-[9px] font-bold text-[#64748b] uppercase tracking-[0.15em]">Select Comparison Range</p>
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
                                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#0f172a] dark:text-[#E2E8DE] hover:bg-[#f1f5f9] dark:hover:bg-[#2E362A] transition-colors"
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
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-warm-xs cursor-pointer ${
                                isFilterActive
                                    ? 'bg-[#6366f1] text-white shadow-sm'
                                    : 'bg-[#ffffff] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] text-[#0f172a] dark:text-[#f8fafc] hover:bg-[#f1f5f9]'
                            }`}
                        >
                            <Plus size={13} strokeWidth={2.5} className={isFilterActive ? 'text-white' : 'text-[#6366f1]'} />
                            <span>Filters</span>
                            {isFilterActive && <span className="w-1.5 h-1.5 rounded-full bg-white ml-1" />}
                        </button>

                        {showFilterPopover && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-[#ffffff] dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-[#e2e8f0] dark:border-[#1e293b] p-4 z-50 animate-in fade-in duration-150 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0] dark:border-[#1e293b]">
                                    <span className="text-xs font-bold text-[#0f172a] dark:text-[#f8fafc] flex items-center gap-1.5">
                                        <Filter size={13} className="text-[#6366f1]" /> Filter Analytics
                                    </span>
                                    {isFilterActive && (
                                        <button onClick={handleClearFilter} className="text-[10px] font-bold text-[#f43f5e] hover:underline">
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Department / Team</label>
                                    <select
                                        value={selectedTeam}
                                        onChange={(e) => setSelectedTeam(e.target.value)}
                                        className="w-full mt-1 p-2 rounded-xl bg-[#f1f5f9]/60 dark:bg-[#1E2419] border border-[#e2e8f0] dark:border-[#1e293b] text-xs font-semibold text-[#0f172a] dark:text-[#f8fafc]"
                                    >
                                        <option value="">All Departments</option>
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Employee</label>
                                    <select
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                        className="w-full mt-1 p-2 rounded-xl bg-[#f1f5f9]/60 dark:bg-[#1E2419] border border-[#e2e8f0] dark:border-[#1e293b] text-xs font-semibold text-[#0f172a] dark:text-[#f8fafc]"
                                    >
                                        <option value="">All Employees</option>
                                        {employees.map(e => (
                                            <option key={e.id} value={e.id}>{e.fullName || e.name || e.email}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Role</label>
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="w-full mt-1 p-2 rounded-xl bg-[#f1f5f9]/60 dark:bg-[#1E2419] border border-[#e2e8f0] dark:border-[#1e293b] text-xs font-semibold text-[#0f172a] dark:text-[#f8fafc]"
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
                                        className="px-3 py-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0f172a]"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={handleApplyFilter}
                                        className="px-4 py-1.5 bg-[#6366f1] text-white rounded-xl text-xs font-semibold hover:bg-[#A17D45] shadow-xs cursor-pointer"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Export Button */}
                <div className="relative mt-5" ref={exportRef}>
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="p-2.5 bg-[#ffffff] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] text-[#64748b] hover:text-[#0f172a] dark:hover:text-[#f8fafc] rounded-xl transition-all shadow-warm-xs active:scale-95 cursor-pointer"
                        title="Download / Export Report"
                    >
                        <Download size={15} />
                    </button>

                    {showExportMenu && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#ffffff] dark:bg-[#0f172a] rounded-2xl shadow-xl border border-[#e2e8f0] dark:border-[#1e293b] p-2 z-50 animate-in fade-in duration-150">
                            <button
                                onClick={() => {
                                    if (onExport) onExport('csv');
                                    setShowExportMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#0f172a] dark:text-[#E2E8DE] hover:bg-[#f1f5f9] dark:hover:bg-[#2E362A] rounded-xl cursor-pointer"
                            >
                                <FileSpreadsheet size={14} className="text-[#10b981]" />
                                <span>Export as CSV</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (onExport) onExport('pdf');
                                    setShowExportMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#0f172a] dark:text-[#E2E8DE] hover:bg-[#f1f5f9] dark:hover:bg-[#2E362A] rounded-xl cursor-pointer"
                            >
                                <FileText size={14} className="text-[#f43f5e]" />
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
