import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Download,
  Columns,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Pause,
  Briefcase,
  DollarSign,
  TrendingUp,
  User,
  Users,
  Eye,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Check,
  ChevronDown,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import activityService from '../services/activityService';
import taskService from '../services/taskService';
import productivityService from '../services/productivityService';
import { useAuthStore } from '../store/authStore';
import { InsightfulModuleSwitcher } from '../components/common/InsightfulModuleSwitcher';

const cn = (...inputs) => twMerge(clsx(inputs));

export function ActivitiesTimeline() {
  const { role, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Timeline'); // 'Timeline' | 'Logs'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hoveredEmployee, setHoveredEmployee] = useState(null);
  const [hoveredHour, setHoveredHour] = useState(null);
  const [showProjectsCard, setShowProjectsCard] = useState(true);
  const [showMiniTracker, setShowMiniTracker] = useState(true);

  // Dropdown & Modal States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Filter States
  const [filterTeam, setFilterTeam] = useState('');
  const [filterShiftStatus, setFilterShiftStatus] = useState('ALL'); // ALL, LATE, ON_TIME

  // Columns visibility state
  const [columns, setColumns] = useState({
    employeeName: true,
    activeTime: true,
    scheduledShift: true,
    activityBar: true
  });

  // Productivity Review Apps state (dynamically loaded from database)
  const [unreviewedApps, setUnreviewedApps] = useState([]);

  // Mini live tracker state (dynamically calculated from real session)
  const [trackerSeconds, setTrackerSeconds] = useState(0);
  const [isTrackerRunning, setIsTrackerRunning] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);

  // Tasks play/pause states (dynamically loaded from database)
  const [tasksList, setTasksList] = useState([]);

  const datePickerRef = useRef(null);
  const exportRef = useRef(null);
  const columnsRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) setShowDatePicker(false);
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false);
      if (columnsRef.current && !columnsRef.current.contains(e.target)) setShowColumnsMenu(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterPopover(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let timer;
    if (isTrackerRunning && !isOnBreak) {
      timer = setInterval(() => setTrackerSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isTrackerRunning, isOnBreak]);

  const formatTrackerTime = (totalSecs) => {
    const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const s = String(totalSecs % 60).padStart(2, '0');
    return `${h}:${m}:${s} h`;
  };

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await activityService.getTimelineReport({ date: selectedDate });
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load timeline report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [selectedDate]);

  // Load real tasks from backend database
  useEffect(() => {
    taskService.getTasks().then(res => {
      const list = res?.data || res || [];
      if (Array.isArray(list) && list.length > 0) {
        setTasksList(list.slice(0, 5).map(t => ({
          id: t.id,
          name: t.name,
          time: t.estimatedHours ? `${t.estimatedHours}h est` : 'Active',
          isRunning: t.status === 'IN_PROGRESS'
        })));
      } else {
        setTasksList([]);
      }
    }).catch(err => console.error('Failed to load tasks:', err));
  }, []);

  // Load real apps from backend database for review
  useEffect(() => {
    productivityService.getApps().then(apps => {
      if (Array.isArray(apps) && apps.length > 0) {
        setUnreviewedApps(apps.slice(0, 10).map((a, i) => ({
          id: a.id || a.appName || i,
          name: a.appName || a.name || a.domain,
          category: a.category || 'Uncategorized',
          current: a.productivity === 'PRODUCTIVE' ? 'Productive' : a.productivity === 'UNPRODUCTIVE' ? 'Unproductive' : 'Neutral'
        })));
      } else {
        setUnreviewedApps([]);
      }
    }).catch(err => console.error('Failed to load productivity apps:', err));
  }, []);

  // Sync mini tracker with real user session if active today
  useEffect(() => {
    if (data?.employeeTimelines?.length) {
      const myEmp = data.employeeTimelines.find(e => e.id === user?.employeeId || e.email === user?.email);
      if (myEmp) {
        setTrackerSeconds(myEmp.activeSeconds || 0);
        setIsTrackerRunning(myEmp.isOnline || false);
      }
    }
  }, [data, user]);

  const filteredEmployees = useMemo(() => {
    if (!data?.employeeTimelines) return [];
    return data.employeeTimelines.filter(emp => {
      const matchesSearch = !searchQuery.trim() ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.team.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTeam = !filterTeam || emp.team === filterTeam;
      const matchesLate = filterShiftStatus === 'ALL' || (filterShiftStatus === 'LATE' && emp.isLate) || (filterShiftStatus === 'ON_TIME' && !emp.isLate);

      return matchesSearch && matchesTeam && matchesLate;
    });
  }, [data, searchQuery, filterTeam, filterShiftStatus]);

  // Derived logs data for 'Logs' tab
  const activityLogs = useMemo(() => {
    const logs = [];
    (data?.employeeTimelines || []).forEach(emp => {
      (emp.segments || []).forEach(seg => {
        logs.push({
          id: seg.id || `${emp.id}-${Math.random()}`,
          time: seg.timeFormatted || '09:00',
          employeeName: emp.name,
          employeeInitials: emp.initials,
          team: emp.team,
          app: seg.appWebsite || 'System',
          classification: seg.type === 'ACTIVE' ? 'Productive' : seg.type.includes('BREAK') ? 'Neutral' : 'Unproductive',
          durationMinutes: seg.durationMinutes || 30
        });
      });
    });
    return logs;
  }, [data]);

  const handleExport = (type = 'csv') => {
    const headers = ['Employee Name', 'Team', 'Active Time', 'Late for Work', 'Scheduled Start', 'Scheduled End'];
    const rows = filteredEmployees.map(e => [
      e.name,
      e.team,
      e.activeHoursFormatted,
      e.isLate ? 'Yes' : 'No',
      e.startShift,
      e.endShift
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `activities-timeline-${selectedDate}.${type === 'csv' ? 'csv' : 'txt'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const toggleTaskTimer = (taskId) => {
    setTasksList(prev => prev.map(t => t.id === taskId ? { ...t, isRunning: !t.isRunning } : t));
  };

  const handleSaveClassifications = async () => {
    try {
      for (const app of unreviewedApps) {
        await productivityService.updateRule({
          domain: app.name.toLowerCase().replace(/\s+/g, '-'),
          appName: app.name,
          category: app.category,
          productivity: app.current.toUpperCase()
        });
      }
      setShowReviewModal(false);
      fetchTimeline();
    } catch (e) {
      console.error('Failed to save classifications:', e);
      setShowReviewModal(false);
    }
  };

  const timeMarkers = [
    { label: '00:00', percent: 0 },
    { label: '03:00', percent: 12.5 },
    { label: '06:00', percent: 25.0 },
    { label: '09:00', percent: 37.5 },
    { label: '12:00', percent: 50.0 },
    { label: '15:00', percent: 62.5 },
    { label: '18:00', percent: 75.0 },
    { label: '21:00', percent: 87.5 }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/60 dark:bg-slate-950/20 min-h-screen">
      {/* ── Top Insightful Module Switcher ──────────────────────────────────── */}
      <InsightfulModuleSwitcher activeTab="activities" />

      {/* ── 1. Page Header (Matching Image 1) ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Activities
          </h1>
          {/* Subheader Navigation Tabs */}
          <div className="flex items-center gap-6 mt-3 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('Timeline')}
              className={cn(
                "pb-2.5 text-xs font-black uppercase tracking-wider transition-all relative",
                activeTab === 'Timeline'
                  ? "text-primary-600 dark:text-primary-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 dark:after:bg-primary-400 rounded-t"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('Logs')}
              className={cn(
                "pb-2.5 text-xs font-black uppercase tracking-wider transition-all relative flex items-center gap-1.5",
                activeTab === 'Logs'
                  ? "text-primary-600 dark:text-primary-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 dark:after:bg-primary-400 rounded-t"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              <span>Logs</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </button>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Review Productivity Button */}
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <ShieldCheck size={14} className="text-primary-600" />
            <span>Review Productivity</span>
          </button>

          {/* Interactive Date Picker Dropdown */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-400 transition-all shadow-sm"
            >
              <Calendar size={14} className="text-primary-600" />
              <span>{selectedDate}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in duration-200 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">Select Activity Date</p>
                {[
                  { label: 'Today (Nov 17, 2026)', date: '2026-11-17' },
                  { label: 'Yesterday (Nov 16, 2026)', date: '2026-11-16' },
                  { label: 'Nov 15, 2026', date: '2026-11-15' },
                  { label: 'Nov 14, 2026', date: '2026-11-14' }
                ].map(p => (
                  <button
                    key={p.date}
                    onClick={() => {
                      setSelectedDate(p.date);
                      setShowDatePicker(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between",
                      selectedDate === p.date
                        ? "bg-primary-50 text-primary-600 dark:bg-primary-950/40"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>{p.label}</span>
                    {selectedDate === p.date && <Check size={13} className="text-primary-600" />}
                  </button>
                ))}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 px-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Custom Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(e.target.value);
                        setShowDatePicker(false);
                      }
                    }}
                    className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in duration-200">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <FileSpreadsheet size={14} className="text-emerald-600" />
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <FileText size={14} className="text-rose-600" />
                  <span>Export as Text Report</span>
                </button>
              </div>
            )}
          </div>

          {/* Columns Toggle Dropdown */}
          <div className="relative" ref={columnsRef}>
            <button
              onClick={() => setShowColumnsMenu(!showColumnsMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Columns size={14} />
              <span>Columns</span>
            </button>

            {showColumnsMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in duration-200 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Visible Columns</p>
                {Object.entries({
                  employeeName: 'Employee Name & Team',
                  activeTime: 'Active Working Hours',
                  scheduledShift: 'Scheduled Shift Bracket',
                  activityBar: 'Activity Gantt Track'
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                    <input
                      type="checkbox"
                      checked={columns[key]}
                      onChange={(e) => setColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Top Filter & Search Controls Bar ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search employee or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Working + Add Filter Popover */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-sm",
                filterTeam || filterShiftStatus !== 'ALL'
                  ? "bg-primary-600 text-white shadow-primary-600/20"
                  : "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/60 hover:bg-primary-100"
              )}
            >
              <span>+ Add Filter</span>
              {(filterTeam || filterShiftStatus !== 'ALL') && (
                <span className="w-1.5 h-1.5 rounded-full bg-white ml-1" />
              )}
            </button>

            {showFilterPopover && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in duration-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black text-slate-800 dark:text-white">Filter Timeline</span>
                  {(filterTeam || filterShiftStatus !== 'ALL') && (
                    <button
                      onClick={() => {
                        setFilterTeam('');
                        setFilterShiftStatus('ALL');
                      }}
                      className="text-[10px] font-black text-rose-500 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Team / Department</label>
                  <select
                    value={filterTeam}
                    onChange={(e) => setFilterTeam(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    <option value="">All Teams</option>
                    <option value="General Team">General Team</option>
                    <option value="Development Team">Development Team</option>
                    <option value="Design Team">Design Team</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Shift Punctuality</label>
                  <select
                    value={filterShiftStatus}
                    onChange={(e) => setFilterShiftStatus(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    <option value="ALL">All Employees</option>
                    <option value="LATE">Late for Work Only</option>
                    <option value="ON_TIME">On Time Only</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowFilterPopover(false)}
                  className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Legend (Exact match to Insightful Reference Image 4) */}
        <div className="flex items-center flex-wrap gap-4 text-[11px] font-bold text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Active Time</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Allowed Break Time</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Break Time Overages</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Manual Time</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
            <span>Idle Time</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-purple-600 rounded-full" />
            <span>Scheduled Time</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Late for Work</span>
          </span>
        </div>
      </div>

      {/* ── 3. Main Body: Timeline vs Logs ─────────────────────────────────── */}
      {activeTab === 'Timeline' ? (
        <div className="bg-white dark:bg-slate-900 rounded-[1.75rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
          {/* Top Hourly Workforce Activity Density Histogram */}
          <div className="pt-4 px-6 pb-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/40">
            <div className="flex items-end h-10 w-full pl-[260px] pr-6 gap-1 relative">
              {data?.hourlyDistribution?.map((bucket, idx) => {
                const maxEmployees = Math.max(1, bucket.totalEmployees || 4);
                const heightPct = Math.min(100, Math.max(8, (bucket.activeCount / maxEmployees) * 100));
                const isHovered = hoveredHour?.hour === bucket.hour;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredHour(bucket)}
                    onMouseLeave={() => setHoveredHour(null)}
                    className="flex-1 h-full flex items-end justify-center group cursor-pointer relative"
                  >
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={cn(
                        "w-full rounded-t-sm transition-all duration-300",
                        bucket.activeCount > 0
                          ? "bg-purple-300 dark:bg-purple-600/60 group-hover:bg-purple-500"
                          : "bg-slate-200/50 dark:bg-slate-800/40"
                      )}
                    />

                    {/* Hourly Popover on Hover */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 z-50 animate-in fade-in zoom-in duration-200 pointer-events-none">
                        <div className="flex items-center justify-between text-xs font-black pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400">Total Count</span>
                          <span className="text-slate-700 dark:text-slate-200">{bucket.hourLabel} → {String((bucket.hour + 1) % 24).padStart(2, '0')}:00</span>
                        </div>
                        <div className="space-y-1.5 pt-2 text-[11px] font-bold">
                          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <Users size={12} className="text-primary-600" /> Active Employees
                            </span>
                            <span className="font-black text-slate-900 dark:text-white">{bucket.activeCount} of {bucket.totalEmployees}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500">
                            <span>☕ on break: {bucket.onBreakCount}</span>
                            <span>⏱️ overages: {bucket.breakOverageCount}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Header Row */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900/80 px-6 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {columns.employeeName && (
              <div className="w-[180px] flex items-center gap-1 cursor-pointer hover:text-slate-800">
                <span>↑ Employee Name</span>
              </div>
            )}
            {columns.activeTime && (
              <div className="w-[80px] text-left">
                <span>Active Time</span>
              </div>
            )}
            {columns.activityBar && (
              <div className="flex-1 relative flex justify-between pr-4 pl-2 text-[10px] font-bold text-slate-400">
                <span className="text-slate-300">‹</span>
                {timeMarkers.map(m => (
                  <span key={m.label} className="w-10 text-center">{m.label}</span>
                ))}
                <span className="text-slate-300">›</span>
              </div>
            )}
          </div>

          {/* Table Employee Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 relative">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="animate-spin text-primary-600" size={28} />
                <span className="text-xs font-bold tracking-wide">Loading timeline data...</span>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs font-bold">
                No employee activities recorded for this date.
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onMouseEnter={() => setHoveredEmployee(emp)}
                  className="flex items-center px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors relative group"
                >
                  {/* Employee Name & Team */}
                  {columns.employeeName && (
                    <div className="w-[180px] flex items-center gap-3 pr-2">
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 font-black text-xs flex items-center justify-center">
                          {emp.initials}
                        </div>
                        {emp.isLate && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" title="Late for shift" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">{emp.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate">{emp.team}</p>
                      </div>
                    </div>
                  )}

                  {/* Active Time */}
                  {columns.activeTime && (
                    <div className="w-[80px] text-xs font-black text-slate-700 dark:text-slate-300">
                      {emp.activeHoursFormatted}
                    </div>
                  )}

                  {/* Horizontal Gantt Bar Track */}
                  {columns.activityBar && (
                    <div className="flex-1 h-9 bg-slate-50 dark:bg-slate-800/30 rounded-xl relative overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center mx-2">
                      {timeMarkers.map(m => (
                        <div
                          key={m.label}
                          style={{ left: `${m.percent}%` }}
                          className="absolute top-0 bottom-0 w-[1px] bg-slate-200/50 dark:bg-slate-800/60 pointer-events-none"
                        />
                      ))}

                      {columns.scheduledShift && (
                        <div
                          style={{
                            left: `${emp.scheduledStartPercent}%`,
                            width: `${emp.scheduledEndPercent - emp.scheduledStartPercent}%`
                          }}
                          className="absolute h-0.5 bg-purple-400/40 dark:bg-purple-500/30 pointer-events-none flex items-center justify-between"
                        >
                          <div className="h-2.5 w-[2px] bg-purple-500 rounded" />
                          <div className="h-2.5 w-[2px] bg-purple-500 rounded" />
                        </div>
                      )}

                      {/* Segmented activity blocks */}
                      {emp.segments.map(seg => {
                        const colorClass =
                          seg.type === 'ACTIVE'
                            ? 'bg-indigo-500 hover:bg-indigo-600 shadow-sm shadow-indigo-500/20'
                            : seg.type === 'BREAK'
                            ? 'bg-sky-400 hover:bg-sky-500'
                            : seg.type === 'BREAK_OVERAGE'
                            ? 'bg-cyan-400 hover:bg-cyan-500'
                            : seg.type === 'MANUAL'
                            ? 'bg-amber-400 hover:bg-amber-500'
                            : 'bg-[repeating-linear-gradient(45deg,#cbd5e1,#cbd5e1_4px,#e2e8f0_4px,#e2e8f0_8px)] opacity-60';

                        return (
                          <div
                            key={seg.id}
                            style={{
                              left: `${seg.startPercent}%`,
                              width: `${seg.widthPercent}%`
                            }}
                            className={cn(
                              "absolute h-6 rounded-md transition-all cursor-pointer z-10",
                              colorClass
                            )}
                            title={`${seg.type}: ${seg.appWebsite || 'App'} (${seg.timeFormatted}, ${seg.durationMinutes}m)`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Interactive Employee Profile Hover Card */}
          {hoveredEmployee && (
            <div className="absolute right-8 top-28 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 z-40 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-black text-xs flex items-center justify-center">
                    {hoveredEmployee.initials}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{hoveredEmployee.name}</p>
                    <p className="text-[10px] font-bold text-slate-400">{hoveredEmployee.team}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {hoveredEmployee.productivityPct}% productivity
                </span>
              </div>

              {/* Active Time */}
              <div className="py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={11} className="text-primary-500" /> Active Time
                </p>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="text-xl font-black text-slate-900 dark:text-white">{hoveredEmployee.activeHoursFormatted}</p>
                  <p className="text-xs font-bold text-slate-400">{hoveredEmployee.startShift} → {hoveredEmployee.endShift}</p>
                </div>
              </div>

              {/* Top 3 Apps */}
              <div className="py-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Top 3 most used apps
                </p>
                <div className="space-y-1.5">
                  {hoveredEmployee.topApps?.map((app, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] font-bold p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                      <span className="truncate max-w-[110px] text-slate-700 dark:text-slate-200">{app.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                          app.productivity === 'Productive'
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300"
                        )}>
                          {app.productivity}
                        </span>
                        <span className="text-slate-500 font-bold text-[10px]">{app.durationFormatted}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Logs Button -> Switches to Logs View filtered by this employee */}
              <button
                onClick={() => {
                  setSearchQuery(hoveredEmployee.name);
                  setActiveTab('Logs');
                }}
                className="w-full mt-2 py-2 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-black transition-colors"
              >
                View Logs
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Logs Tab View (Working Detailed Table) ── */
        <div className="bg-white dark:bg-slate-900 rounded-[1.75rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Activity Logs ({activityLogs.length} Records)
            </h3>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1"
              >
                <X size={12} /> Clear Filter ({searchQuery})
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Application / Website</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-500">{log.time}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-black text-[10px] flex items-center justify-center">
                          {log.employeeInitials}
                        </span>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">{log.employeeName}</p>
                          <p className="text-[10px] text-slate-400">{log.team}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {log.app}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                        log.classification === 'Productive'
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                          : log.classification === 'Neutral'
                          ? "bg-slate-100 text-slate-600 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800"
                      )}>
                        {log.classification}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-700 dark:text-slate-300">
                      {log.durationMinutes} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. Floating Widgets Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Floating Mini Tracker Card */}
        {showMiniTracker && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Insightful Tracker</span>
              <button onClick={() => setShowMiniTracker(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            </div>
            <div className="py-6 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shift Session Time</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                {formatTrackerTime(trackerSeconds)}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTrackerRunning(!isTrackerRunning)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-xs font-black shadow-lg transition-all active:scale-95 text-white",
                  isTrackerRunning ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                )}
              >
                {isTrackerRunning ? "Clock Out" : "Clock In"}
              </button>
              <button
                onClick={() => setIsOnBreak(!isOnBreak)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-xs font-black transition-all active:scale-95 text-white shadow-lg",
                  isOnBreak
                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                )}
              >
                {isOnBreak ? "Resume Work" : "Take a Break"}
              </button>
            </div>
            <p className="text-center text-[10px] font-bold text-slate-400 mt-3">
              Status: <span className={cn("font-black", isOnBreak ? "text-amber-500" : isTrackerRunning ? "text-emerald-500" : "text-slate-400")}>{isOnBreak ? "On Break" : isTrackerRunning ? "Active Working" : "Clocked Out"}</span>
            </p>
          </div>
        )}

        {/* Floating Projects & Billable Costs Card */}
        {showProjectsCard && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-primary-600" />
                <span className="text-xs font-black tracking-widest text-slate-700 dark:text-slate-200 uppercase">Projects & Tasks</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/60 font-black text-xs">
                <span>Billable Costs:</span>
                <span className="text-amber-900 dark:text-amber-300">{data?.projectsSummary?.totalBillableCost || '$0.00'}</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 my-2">
              {(data?.projectsSummary?.projectsList || []).map((p, idx) => (
                <div key={p.id || idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-400 font-black text-[10px] flex items-center justify-center">
                      P{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100">{p.name}</p>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                        {p.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span>{p.employeesCount} Employees</span>
                    <span>{p.tasksCount} Tasks</span>
                    <span className="text-slate-800 dark:text-slate-200 font-black">{p.hoursFormatted}</span>
                    <span className="text-primary-600 dark:text-primary-400 font-black">{p.costFormatted}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtasks with interactive timers */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {tasksList.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/40 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{task.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 dark:text-white text-[11px]">{task.time}</span>
                    <button
                      onClick={() => toggleTaskTimer(task.id)}
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-white transition-all active:scale-90",
                        task.isRunning ? "bg-rose-500 hover:bg-rose-600" : "bg-primary-600 hover:bg-primary-700"
                      )}
                      title={task.isRunning ? "Pause Task" : "Start Task"}
                    >
                      {task.isRunning ? <Pause size={10} /> : <Play size={10} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Review Productivity Modal ───────────────────────────────────── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Review App Productivity</h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Classify software and websites as Productive, Unproductive, or Neutral to calculate team productivity score.
            </p>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {unreviewedApps.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100">{app.name}</p>
                    <span className="text-[10px] font-bold text-slate-400">{app.category}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {['Productive', 'Neutral', 'Unproductive'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setUnreviewedApps(prev => prev.map(a => a.id === app.id ? { ...a, current: cat } : a));
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all",
                          app.current === cat
                            ? cat === 'Productive'
                              ? "bg-emerald-600 text-white shadow-sm"
                              : cat === 'Neutral'
                              ? "bg-slate-600 text-white shadow-sm"
                              : "bg-rose-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={handleSaveClassifications}
                className="px-5 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md shadow-primary-500/20"
              >
                Save Classifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivitiesTimeline;