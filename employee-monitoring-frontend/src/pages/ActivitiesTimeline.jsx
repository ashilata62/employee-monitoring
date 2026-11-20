import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  X,
  Activity,
  ArrowRight
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
  const { role, user, isClockedIn, isOnBreak, activeAttendance, clockIn, clockOut, toggleBreak } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Timeline'); // 'Timeline' | 'Logs'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hoveredEmployee, setHoveredEmployee] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const dismissedEmployeeIdRef = useRef(null);

  const handleRowMouseEnter = (emp) => {
    if (dismissedEmployeeIdRef.current === emp.id) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredEmployee(emp);
  };

  const handleRowMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredEmployee(null);
      dismissedEmployeeIdRef.current = null;
    }, 200);
  };

  const handleCardMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleCardMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredEmployee(null);
      dismissedEmployeeIdRef.current = null;
    }, 150);
  };

  const handleCloseCard = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    dismissedEmployeeIdRef.current = hoveredEmployee?.id || true;
    setHoveredEmployee(null);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);
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

  // Mini live tracker state (dynamically synced from real persistent attendance API)
  const [trackerSeconds, setTrackerSeconds] = useState(0);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Sync elapsed seconds from real persistent attendance session
  useEffect(() => {
    let timer;
    if (isClockedIn && activeAttendance?.clockIn) {
      const clockInMs = new Date(activeAttendance.clockIn).getTime();
      const breakSec = activeAttendance.totalBreakSeconds || 0;

      const calculateWorkSeconds = () => {
        if (isOnBreak && activeAttendance.openBreak) {
          const breakStartMs = new Date(activeAttendance.openBreak).getTime();
          return Math.max(0, Math.floor((breakStartMs - clockInMs) / 1000) - breakSec);
        }
        return Math.max(0, Math.floor((Date.now() - clockInMs) / 1000) - breakSec);
      };

      setTrackerSeconds(calculateWorkSeconds());

      if (!isOnBreak) {
        timer = setInterval(() => {
          setTrackerSeconds(calculateWorkSeconds());
        }, 1000);
      }
    } else if (!isClockedIn) {
      setTrackerSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isClockedIn, activeAttendance?.clockIn, activeAttendance?.openBreak, activeAttendance?.totalBreakSeconds, isOnBreak]);

  const handleToggleClock = async () => {
    try {
      setIsActionLoading(true);
      if (isClockedIn) {
        window.dispatchEvent(new Event('stop-web-tracker'));
        await clockOut();
      } else {
        await clockIn();
        if (!useAuthStore.getState().isTrackerActive) {
          window.dispatchEvent(new Event('start-web-tracker'));
        }
      }
      fetchTimeline();
    } catch (err) {
      console.error('Attendance action failed:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleBreak = async () => {
    if (!isClockedIn) return;
    try {
      setIsActionLoading(true);
      await toggleBreak();
      fetchTimeline();
    } catch (err) {
      console.error('Break action failed:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Tasks play/pause states (dynamically loaded from database)
  const [tasksList, setTasksList] = useState([]);

  // Dropdown & Popover Refs
  const datePickerRef = useRef(null);
  const exportRef = useRef(null);
  const columnsRef = useRef(null);
  const filterRef = useRef(null);

  // Close popovers on click outside
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

  const fetchTasksList = () => {
    taskService.getTasks().then(res => {
      const list = res?.data || res || [];
      if (Array.isArray(list) && list.length > 0) {
        setTasksList(list.slice(0, 6).map(t => ({
          id: t.id,
          name: t.name,
          projectName: t.project?.name || 'General',
          assignedTo: t.employee?.fullName || t.employee?.name || 'Unassigned',
          status: t.status || 'ACTIVE',
          time: t.timeSpent || (t.estimatedHours ? `${t.estimatedHours}h est` : '0h')
        })));
      } else {
        setTasksList([]);
      }
    }).catch(err => console.error('Failed to load tasks:', err));
  };

  useEffect(() => {
    fetchTimeline();
    fetchTasksList();
    const interval = setInterval(() => {
      fetchTimeline();
      fetchTasksList();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

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

  // Sync mini tracker with real user session if active today and not clocked in
  useEffect(() => {
    if (data?.employeeTimelines?.length && !isClockedIn) {
      const myEmp = data.employeeTimelines.find(e => e.id === user?.employeeId || e.email === user?.email);
      if (myEmp && myEmp.activeSeconds) {
        setTrackerSeconds(myEmp.activeSeconds);
      }
    }
  }, [data, user, isClockedIn]);

  const filteredEmployees = useMemo(() => {
    if (!data?.employeeTimelines) return [];
    return data.employeeTimelines.filter(emp => {
      // Strict RBAC: Employee only sees their own timeline, never managers or admins
      if (role === 'EMPLOYEE') {
        const myEmpId = user?.employeeId || user?.id;
        const myEmail = user?.email;
        const isMe = (myEmpId && String(emp.id) === String(myEmpId)) || (myEmail && emp.email === myEmail);
        return Boolean(isMe);
      }

      // Exclude Admin from trackable activities timeline for manager or non-admin view
      if (role === 'MANAGER' && ((emp.role || '').toUpperCase() === 'ADMIN' || (emp.name || '').toLowerCase().includes('admin demo'))) {
        return false;
      }
      if ((emp.role || '').toUpperCase() === 'ADMIN' || (emp.name || '').toLowerCase().includes('admin demo')) {
        return false;
      }
      const matchesSearch = !searchQuery.trim() ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.team.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTeam = !filterTeam || emp.team === filterTeam;
      const matchesLate = filterShiftStatus === 'ALL' || (filterShiftStatus === 'LATE' && emp.isLate) || (filterShiftStatus === 'ON_TIME' && !emp.isLate);

      return matchesSearch && matchesTeam && matchesLate;
    });
  }, [data, searchQuery, filterTeam, filterShiftStatus, role, user]);

  // Derived logs data for 'Logs' tab (Scoped to filteredEmployees for RBAC security)
  const activityLogs = useMemo(() => {
    const logs = [];
    (filteredEmployees || []).forEach(emp => {
      (emp.segments || []).forEach((seg, sIdx) => {
        logs.push({
          id: seg.id || `${emp.id}-seg-${sIdx}`,
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
  }, [filteredEmployees]);

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
    <div className="space-y-6 w-full text-[#29291F] dark:text-[#F5F1E9]">
      {/* ── Top Insightful Module Switcher ──────────────────────────────────── */}
      <InsightfulModuleSwitcher activeTab="activities" />

      {/* ── 1. Page Header (Matching Image 1) ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#29291F] dark:text-[#F5F1E9] tracking-tight">
            Activities
          </h1>
          {/* Subheader Navigation Tabs */}
          <div className="flex items-center gap-6 mt-3 border-b border-[#E5DED2] dark:border-[#384232]">
            <button
              onClick={() => setActiveTab('Timeline')}
              className={cn(
                "pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer",
                activeTab === 'Timeline'
                  ? "text-[#B9955B] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#B9955B] rounded-t"
                  : "text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:text-[#F5F1E9]"
              )}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('Logs')}
              className={cn(
                "pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-1.5 cursor-pointer",
                activeTab === 'Logs'
                  ? "text-[#B9955B] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#B9955B] rounded-t"
                  : "text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:text-[#F5F1E9]"
              )}
            >
              <span>Logs</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </button>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Review Productivity Button (Admin / Manager only) */}
          {role !== 'EMPLOYEE' && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] hover:bg-[#E5DDCF] transition-all shadow-warm-xs active:scale-95 cursor-pointer"
            >
              <ShieldCheck size={14} className="text-[#5E7D64]" />
              <span>Review Productivity</span>
            </button>
          )}

          {/* Interactive Date Picker Dropdown */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] hover:bg-[#E5DDCF] transition-all shadow-warm-xs cursor-pointer"
            >
              <Calendar size={14} className="text-[#B9955B]" />
              <span>{selectedDate}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl shadow-warm-lg border border-[#D6CDBC] dark:border-[#384232] p-3 z-50 animate-in fade-in duration-200 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">Select Activity Date</p>
                {(() => {
                  const now = new Date();
                  const getPreset = (daysAgo, labelPrefix) => {
                    const d = new Date(now.getTime() - daysAgo * 86400000);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const dateStr = `${yyyy}-${mm}-${dd}`;
                    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                    const label = labelPrefix ? `${labelPrefix} (${monthName} ${dd}, ${yyyy})` : `${monthName} ${dd}, ${yyyy}`;
                    return { label, date: dateStr };
                  };
                  return [
                    getPreset(0, 'Today'),
                    getPreset(1, 'Yesterday'),
                    getPreset(2, null),
                    getPreset(3, null)
                  ];
                })().map(p => (
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] hover:bg-[#E5DDCF] transition-all shadow-warm-xs active:scale-95 cursor-pointer"
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl shadow-warm-lg border border-[#D6CDBC] dark:border-[#384232] p-2 z-50 animate-in fade-in duration-200">
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] hover:bg-[#E5DDCF] transition-all shadow-warm-xs active:scale-95 cursor-pointer"
            >
              <Columns size={14} />
              <span>Columns</span>
            </button>

            {showColumnsMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl shadow-warm-lg border border-[#D6CDBC] dark:border-[#384232] p-3 z-50 animate-in fade-in duration-200 space-y-2">
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
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#EEE8DD] dark:bg-[#252B20] p-4 rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search employee or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl text-xs font-medium text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] focus:outline-none focus:border-[#B9955B]"
            />
          </div>

          {/* Working + Add Filter Popover (Admin / Manager only) */}
          {role !== 'EMPLOYEE' && (
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilterPopover(!showFilterPopover)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-sm",
                  filterTeam || filterShiftStatus !== 'ALL'
                    ? "bg-primary-600 text-white shadow-primary-600/20"
                    : "text-[#29291F] dark:text-[#F5F1E9] bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] hover:bg-[#E5DDCF]"
                )}
              >
                <span>+ Add Filter</span>
                {(filterTeam || filterShiftStatus !== 'ALL') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white ml-1" />
                )}
              </button>

              {showFilterPopover && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl shadow-warm-lg border border-[#D6CDBC] dark:border-[#384232] p-4 z-50 animate-in fade-in duration-200 space-y-3">
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
                    className="w-full py-2 bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              )}
            </div>
          )}
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
        <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs overflow-hidden relative">
          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              {/* Top Hourly Workforce Activity Density Histogram */}
          <div className="pt-3.5 px-6 pb-2.5 border-b border-[#D6CDBC] dark:border-[#384232] bg-[#E5DDCF]/55 dark:bg-[#1E2419]">
            <div className="flex items-end h-11 w-full pl-[260px] pr-6 gap-1.5 relative">
              {/* Left Indicator Label in the 260px space */}
              <div className="absolute left-0 bottom-0.5 flex flex-col justify-end pointer-events-none">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#29291F] dark:text-[#F5F1E9] uppercase tracking-wider">
                  <Activity size={13} className="text-[#B9955B]" />
                  <span>Hourly Density</span>
                </div>
                <span className="text-[10px] font-medium text-[#777367] dark:text-[#9E988A] pl-[19px]">
                  24h Active Workforce
                </span>
              </div>

              {data?.hourlyDistribution?.map((bucket, idx) => {
                const maxEmployees = Math.max(1, bucket.totalEmployees || 4);
                const heightPct = bucket.activeCount > 0
                  ? Math.min(100, Math.max(30, (bucket.activeCount / maxEmployees) * 100))
                  : 22;
                const isHovered = hoveredHour?.hour === bucket.hour;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredHour(bucket)}
                    onMouseLeave={() => setHoveredHour(null)}
                    className={cn(
                      "flex-1 h-full flex items-end justify-center group cursor-pointer relative rounded-t-md transition-colors duration-200",
                      isHovered
                        ? "bg-[#B9955B]/20 dark:bg-[#B9955B]/20"
                        : "bg-[#DDD4C3]/55 dark:bg-[#2A3125]/60"
                    )}
                  >
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={cn(
                        "w-full rounded-t-sm transition-all duration-200",
                        bucket.activeCount > 0
                          ? "bg-indigo-500 dark:bg-indigo-400 group-hover:bg-indigo-600 shadow-xs"
                          : "bg-[#BFB5A0] dark:bg-[#495442] group-hover:bg-[#B9955B]"
                      )}
                    />

                    {/* Hourly Popover on Hover (opens downwards to avoid container overflow clipping) */}
                    {isHovered && (
                      <div className={cn(
                        "absolute top-full mt-2 w-64 bg-[#FBF9F5] dark:bg-[#1E2419] rounded-xl shadow-warm-lg border border-[#D6CDBC] dark:border-[#384232] p-3.5 z-[100] animate-in fade-in duration-150 pointer-events-none",
                        idx < 3 ? "left-0" : idx > 20 ? "right-0" : "left-1/2 -translate-x-1/2"
                      )}>
                        <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-[#D6CDBC] dark:border-[#384232]">
                          <span className="text-[#777367] dark:text-[#B8B3A7] uppercase tracking-wider text-[10px]">Hourly Distribution</span>
                          <span className="text-[#29291F] dark:text-[#F5F1E9]">{bucket.hourLabel} → {String((bucket.hour + 1) % 24).padStart(2, '0')}:00</span>
                        </div>
                        <div className="space-y-1.5 pt-2 text-[11px] font-medium">
                          <div className="flex items-center justify-between text-[#29291F] dark:text-[#F5F1E9]">
                            <span className="flex items-center gap-1.5">
                              <Users size={12} className="text-[#B9955B]" /> Active Employees
                            </span>
                            <span className="font-bold text-[#29291F] dark:text-[#F5F1E9]">{bucket.activeCount} of {bucket.totalEmployees}</span>
                          </div>
                          <div className="flex items-center justify-between text-[#777367] dark:text-[#9E988A] text-[10px]">
                            <span>☕ On break: {bucket.onBreakCount}</span>
                            <span>⏱️ Overages: {bucket.breakOverageCount}</span>
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
          <div className="flex items-center border-b border-[#D6CDBC] dark:border-[#384232] bg-[#E5DDCF]/70 dark:bg-[#1E2419] px-6 py-3.5 text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em]">
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
          <div 
            onMouseLeave={handleRowMouseLeave}
            className="divide-y divide-[#D6CDBC]/60 dark:divide-[#384232] relative"
          >
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
                  onMouseEnter={() => handleRowMouseEnter(emp)}
                  onMouseLeave={handleRowMouseLeave}
                  className="flex items-center px-6 py-4 bg-[#F5F1E9] dark:bg-[#1E2419] hover:bg-[#EAE2D3] dark:hover:bg-[#252B20] transition-colors relative group"
                >
                  {/* Employee Name & Team */}
                  {columns.employeeName && (
                    <div className="w-[180px] flex items-center gap-3 pr-2">
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-[#EEE8DD] text-[#30382B] border border-[#D6CDBC] font-bold text-xs flex items-center justify-center">
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
                    <div className="flex-1 h-9 bg-[#EEE8DD] dark:bg-[#252B20] rounded-xl relative overflow-hidden border border-[#D6CDBC] dark:border-[#384232] flex items-center mx-2">
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
                          className="absolute h-0.5 bg-[#30382B]/30 pointer-events-none flex items-center justify-between"
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
          </div>
          </div>

          {/* Interactive Employee Profile Hover Card (Portaled with maximum z-index) */}
          {hoveredEmployee && typeof document !== 'undefined' && createPortal(
            <div 
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              className="fixed right-8 top-32 w-80 bg-[#FAF8F5] dark:bg-[#1E2419] rounded-3xl shadow-2xl border border-[#D6CDBC] dark:border-[#384232] p-5 z-[9999] animate-in fade-in zoom-in-95 duration-200 space-y-4"
            >
              {/* Header: Avatar, Name, Role, Close Button */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5DED2] dark:border-[#384232]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EAE2D3] to-[#D8CEBC] dark:from-[#2A3324] dark:to-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] shadow-sm flex items-center justify-center font-serif font-bold text-sm text-[#30382B] dark:text-[#E8D4B8]">
                      {hoveredEmployee.initials}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#FAF8F5] dark:border-[#1E2419]" title="Active" />
                  </div>
                  <div className="truncate">
                    <h4 className="font-serif text-sm font-bold text-[#29291F] dark:text-[#F5F1E9] leading-tight truncate">
                      {hoveredEmployee.name}
                    </h4>
                    <p className="text-[11px] font-medium text-[#777367] dark:text-[#B8B3A7] truncate mt-0.5">
                      {hoveredEmployee.team || 'General Team'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseCard}
                    title="Close"
                    className="w-7 h-7 rounded-xl bg-[#F0EBE1] hover:bg-[#E5DDD0] dark:bg-[#2A3324] dark:hover:bg-[#343F2D] text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:text-[#F5F1E9] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Productivity Pill Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">
                  Productivity Score
                </span>
                <span className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5",
                  (hoveredEmployee.productivityPct || 0) >= 70
                    ? "text-[#4E7554] dark:text-[#8BB394] bg-[#EAEFEA] dark:bg-[#1E2B20] border-[#C5D7C7] dark:border-[#325238]"
                    : (hoveredEmployee.productivityPct || 0) >= 40
                    ? "text-[#C98A3C] dark:text-[#E5B56D] bg-[#FAF0E1] dark:bg-[#2C2415] border-[#E8D4B8] dark:border-[#5C4A28]"
                    : "text-[#A84B4B] dark:text-[#E07A7A] bg-[#FAF3F2] dark:bg-[#2E1E1E] border-[#F2D6D3] dark:border-[#572E2E]"
                )}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {hoveredEmployee.productivityPct || 0}% Productivity
                </span>
              </div>

              {/* Active Time Highlight Box */}
              <div className="bg-[#F5F1E9] dark:bg-[#252B20] rounded-2xl p-3.5 border border-[#E5DED2] dark:border-[#323A2C] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7] flex items-center gap-1.5">
                    <Clock size={12} className="text-[#B9955B]" /> Active Working Time
                  </span>
                  <span className="text-[10px] font-bold text-[#5E7D64] dark:text-[#8BB394] bg-[#EAEFEA] dark:bg-[#1E2B20] px-2 py-0.5 rounded-md border border-[#C5D7C7]/60">
                    {hoveredEmployee.startShift && hoveredEmployee.startShift !== '--:--'
                      ? `${hoveredEmployee.startShift} → ${hoveredEmployee.endShift}`
                      : 'Live Today'}
                  </span>
                </div>
                <div className="text-2xl font-serif font-bold text-[#29291F] dark:text-[#F5F1E9] tabular-nums tracking-tight">
                  {hoveredEmployee.activeHoursFormatted}
                </div>
              </div>

              {/* Top 3 Apps */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">
                  <span>Top Used Applications</span>
                  <span className="text-[9px] font-medium text-[#B9955B]">By Duration</span>
                </div>
                {hoveredEmployee.topApps && hoveredEmployee.topApps.length > 0 ? (
                  <div className="space-y-1.5">
                    {hoveredEmployee.topApps.map((app, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#F5F1E9] dark:bg-[#252B20] border border-[#E5DED2] dark:border-[#323A2C] text-xs transition hover:border-[#B9955B]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            app.productivity === 'Productive'
                              ? "bg-[#5E7D64]"
                              : app.productivity === 'Unproductive'
                              ? "bg-[#A84B4B]"
                              : "bg-[#B9955B]"
                          )} />
                          <span className="font-semibold text-[#29291F] dark:text-[#F5F1E9] truncate max-w-[110px]">
                            {app.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border",
                            app.productivity === 'Productive'
                              ? "bg-[#EAEFEA] text-[#5E7D64] border-[#C5D7C7]"
                              : app.productivity === 'Unproductive'
                              ? "bg-[#FAF3F2] text-[#A84B4B] border-[#F2D6D3]"
                              : "bg-[#FAF0E1] text-[#C98A3C] border-[#E8D4B8]"
                          )}>
                            {app.productivity}
                          </span>
                          <span className="font-bold text-[#29291F] dark:text-[#F5F1E9] text-[11px] tabular-nums">
                            {app.durationFormatted}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-center text-xs text-[#777367] dark:text-[#B8B3A7] bg-[#F5F1E9]/60 dark:bg-[#252B20]/60 rounded-xl border border-dashed border-[#D6CDBC] dark:border-[#384232]">
                    No app activity recorded yet
                  </div>
                )}
              </div>

              {/* View Logs Button */}
              <button
                onClick={() => {
                  setSearchQuery(hoveredEmployee.name);
                  setActiveTab('Logs');
                  setHoveredEmployee(null);
                }}
                className="w-full mt-2 py-2.5 px-4 bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] dark:bg-[#B9955B] dark:hover:bg-[#C9A86B] dark:text-[#1E2419] rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-warm-sm flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                <span>View Full Activity Logs</span>
                <ArrowRight size={13} className="text-[#D3B98D] dark:text-[#1E2419]" />
              </button>
            </div>,
            document.body
          )}
        </div>
      ) : (
        /* ── Logs Tab View (Working Detailed Table) ── */
        <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs overflow-hidden p-6 space-y-4">
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
        {/* Floating Mini Tracker Card - Only for tracking non-admin employees */}
        {showMiniTracker && role !== 'ADMIN' && (
          <div className="bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl p-5 border border-[#E5DED2] dark:border-[#384232] shadow-warm-md flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DED2] dark:border-[#384232]">
              <span className="text-xs font-bold tracking-widest text-[#777367] dark:text-[#B8B3A7] uppercase">Insightful Tracker</span>
              <button onClick={() => setShowMiniTracker(false)} className="text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] text-xs font-bold cursor-pointer">✕</button>
            </div>
            <div className="py-6 text-center">
              <p className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-widest">Shift Session Time</p>
              <h2 className="text-3xl font-bold font-serif text-[#29291F] dark:text-[#F5F1E9] tracking-tight mt-1">
                {formatTrackerTime(trackerSeconds)}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleClock}
                disabled={isActionLoading}
                className={cn(
                  "flex-1 py-3 rounded-xl text-xs font-bold shadow-warm-xs transition-all active:scale-95 text-[#FDFBF7] disabled:opacity-50 cursor-pointer uppercase tracking-wider",
                  isClockedIn ? "bg-[#A84B4B] hover:bg-[#8E3B3B]" : "bg-[#5E7D64] hover:bg-[#4A6B53]"
                )}
              >
                {isActionLoading ? "Processing..." : isClockedIn ? "Clock Out" : "Clock In"}
              </button>
              <button
                onClick={handleToggleBreak}
                disabled={!isClockedIn || isActionLoading}
                className={cn(
                  "flex-1 py-3 rounded-xl text-xs font-bold transition-all text-[#FDFBF7] shadow-warm-xs uppercase tracking-wider",
                  !isClockedIn
                    ? "bg-[#E5DED2] dark:bg-[#384232] text-[#777367] dark:text-[#B8B3A7] cursor-not-allowed shadow-none"
                    : isOnBreak
                      ? "bg-[#5E7D64] hover:bg-[#4A6B53] active:scale-95 cursor-pointer"
                      : "bg-[#B9955B] hover:bg-[#A17D45] active:scale-95 cursor-pointer"
                )}
                title={!isClockedIn ? "Clock in first to take a break" : isOnBreak ? "Resume Work" : "Take a Break"}
              >
                {!isClockedIn ? "Take a Break" : isOnBreak ? "Resume Work" : "Take a Break"}
              </button>
            </div>
            <p className="text-center text-[10px] font-medium text-[#777367] dark:text-[#B8B3A7] mt-3">
              Status:{" "}
              <span
                className={cn(
                  "font-bold",
                  !isClockedIn
                    ? "text-[#777367] dark:text-[#B8B3A7]"
                    : isOnBreak
                    ? "text-[#C98A3C]"
                    : "text-[#5E7D64]"
                )}
              >
                {!isClockedIn
                  ? "Clocked Out"
                  : isOnBreak
                  ? "On Break"
                  : "Active Working"}
              </span>
            </p>
          </div>
        )}

        {/* Floating Projects & Billable Costs Card (Admin / Manager only) */}
        {showProjectsCard && role !== 'EMPLOYEE' && (
          <div className="bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl p-5 border border-[#E5DED2] dark:border-[#384232] shadow-warm-md relative overflow-hidden group">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DED2] dark:border-[#384232]">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-[#B9955B]" />
                <span className="text-xs font-bold tracking-widest text-[#29291F] dark:text-[#F5F1E9] uppercase">Projects & Tasks</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FDF8F0] dark:bg-[#1E2419] text-[#C98A3C] rounded-xl border border-[#FAF0DE] dark:border-[#384232] font-bold text-xs">
                <span>Billable Costs:</span>
                <span className="text-[#A17D45] dark:text-[#D3B98D]">{data?.projectsSummary?.totalBillableCost || '$0.00'}</span>
              </div>
            </div>

            <div className="divide-y divide-[#E5DED2] dark:divide-[#384232] my-2">
              {(data?.projectsSummary?.projectsList || []).map((p, idx) => (
                <div key={p.id || idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#FAF0E1] dark:bg-[#2C2415] text-[#C98A3C] dark:text-[#E5B56D] font-black text-[10px] flex items-center justify-center border border-[#E8D4B8] dark:border-[#5C4A28]">
                      P{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">{p.name}</p>
                      <span className="text-[9px] font-bold text-[#5E7D64] dark:text-[#8BB394] bg-[#EAEFEA] dark:bg-[#1E2B20] px-1.5 py-0.5 rounded border border-[#C5D7C7] dark:border-[#325238]">
                        {p.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-[#777367] dark:text-[#B8B3A7]">
                    <span>{p.employeesCount} Employees</span>
                    <span>{p.tasksCount} Tasks</span>
                    <span className="text-[#29291F] dark:text-[#F5F1E9] font-bold">{p.hoursFormatted}</span>
                    <span className="text-[#B9955B] dark:text-[#D3B98D] font-bold">{p.costFormatted}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Team Tasks Overview (Admin / Manager Oversight) */}
            <div className="mt-4 pt-3 border-t border-[#E5DED2] dark:border-[#384232] space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">
                  Active Team Tasks ({tasksList.length})
                </span>
                <span className="text-[10px] text-[#777367] dark:text-[#B8B3A7]">
                  Assigned Team & Status
                </span>
              </div>
              {tasksList.length === 0 ? (
                <p className="text-xs text-[#777367] dark:text-[#B8B3A7] py-2 text-center">No tasks found</p>
              ) : (
                tasksList.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] text-xs transition hover:border-[#B9955B]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#B9955B] shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-[#29291F] dark:text-[#F5F1E9] block truncate">
                          {task.name}
                        </span>
                        <span className="text-[10px] text-[#777367] dark:text-[#B8B3A7]">
                          {task.projectName} · Assigned: <span className="font-semibold text-[#29291F] dark:text-[#F5F1E9]">{task.assignedTo}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-bold text-[#29291F] dark:text-[#F5F1E9] text-[11px] tabular-nums">
                        {task.time}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                        task.status === 'IN_PROGRESS' || task.status === 'ACTIVE'
                          ? "bg-[#EAEFEA] dark:bg-[#1E2B20] text-[#5E7D64] dark:text-[#8BB394] border-[#C5D7C7] dark:border-[#325238]"
                          : task.status === 'FINALIZED' || task.status === 'COMPLETED'
                          ? "bg-[#F0F4FA] dark:bg-[#1A2230] text-[#4A72B2] dark:text-[#7EA5E6] border-[#CBD8ED] dark:border-[#2C4166]"
                          : "bg-[#FAF0E1] dark:bg-[#2C2415] text-[#C98A3C] dark:text-[#E5B56D] border-[#E8D4B8] dark:border-[#5C4A28]"
                      )}>
                        {task.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
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