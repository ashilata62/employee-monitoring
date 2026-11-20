import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    intradayActivity,
    computeSummaryStats,
    liveEmployeeStats,
    weeklyProductivityTrend,
    checkAlertThresholds,
    appUsageByCategory,
    teamProductivity,
} from '../store/analyticsEngine';
import { logAction } from '../utils/logAction';
import { useToast } from '../context/ToastContext';
import { useAuthStore } from '../store/authStore';
import { useTeamStore } from '../store/teamStore';
import { useEmployeeStore } from '../store/employeeStore';
import { useFilterStore } from '../store/filterStore';
import employeeService from '../services/employeeService';
import activityService from '../services/activityService';
import teamService from '../services/teamService';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import goalService from '../services/goalService';
import screenshotService from '../services/screenshotService';
import notificationService from '../services/notificationService';
import alertService from '../services/alertService';
import useTaskStore from '../store/taskStore';
import { subscribeStaffStatus } from '../utils/staffSync';
import { io } from 'socket.io-client';
import { getSharedSocket } from './useSocket';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const RealTimeContext = createContext();
const STORAGE_KEY = 'ems_state_v5';
const TODAY = new Date().toISOString().split('T')[0];

const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const mapStatus = (status) => {
    const s = status?.toUpperCase();
    if (s === 'BACKLOG') return 'Backlog';
    if (s === 'IN_OPERATIONS') return 'In Operations';
    if (s === 'QUALITY_ASSURANCE') return 'Quality Assurance';
    if (s === 'FINALIZED') return 'Finalized';
    return status;
};

// Web Audio API Synthesized Chime for Critical & Warning Alerts
const playAlertChime = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
        // Autoplay policy or audio context restriction
    }
};

export function RealTimeProvider({ children }) {
    const { toast } = useToast();
    const taskTimer = useTaskStore();
    const [step, setStep] = useState('choice');
    const [copied, setCopied] = useState(false);

    const [state, setState] = useState({
        employees: [],
        tasks: [],
        projects: [],
        goals: [],
        teams: [],
        // Logs
        activityLogs: [],
        attendanceLogs: [],
        appUsageLogs: [],
        locationLogs: [],
        payrollData: [],
        // UI state
        timeEntries: [],
        notifications: [],
        alerts: [],
        screenshots: [],
        geofences: [],
        leaveRequests: [],
        checkIns: [],
        travelStats: { totalDistance: '0 km', avgSpeed: '0 km/h', topSpeed: '0 km/h', totalTrips: 0 },
        timer: { isRunning: false, startTime: null, seconds: 0, currentTask: null },
        currentUser: { id: 0, name: 'Admin User', role: 'Admin' },
        // Compliance
        complianceSettings: {
            twoFA: false,
            encryptionEnabled: false,
            gdprRetentionDays: 365,
            consentGiven: false,
            dataMinimization: false,
            auditLogs: true,
            rolePermissions: { admin: true, manager: false, viewer: false },
        },
        // Alert thresholds
        alertThresholds: { idleThresholdHours: 2.5, unproductivePct: 40 },
        // Date filter
        selectedDate: TODAY,
    });

    const { user, role, isAuthenticated } = useAuthStore();

    const [isLoading, setIsLoading] = useState(true);
    const timerInterval = useRef(null);
    const employeesRef = useRef(state.employees);

    useEffect(() => {
        employeesRef.current = state.employees;
    }, [state.employees]);

    const addNotification = useCallback((title, type = 'info', description = '', options = {}) => {
        if (!title) return;
        const n = {
            id: options.id || `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            title,
            description: description || '',
            time: 'Just now',
            type,
            unread: true,
            link: options.link || null,
            createdAt: new Date().toISOString()
        };
        setState(prev => {
            // Deduplicate if identical title exists within 3 seconds
            const duplicate = prev.notifications.some(existing =>
                existing.title === title &&
                Math.abs(Date.now() - new Date(existing.createdAt || Date.now()).getTime()) < 3000
            );
            if (duplicate) return prev;
            return {
                ...prev,
                notifications: [n, ...prev.notifications].slice(0, 50)
            };
        });
    }, []);

    // Listen to all toast notifications across the app and record them in the Bell dropdown
    useEffect(() => {
        const handleToastNotification = (event) => {
            const { title, message, type = 'info', description = '', link = null, id } = event.detail || {};
            const text = title || message;
            if (text) {
                addNotification(text, type, description, { id, link });
            }
        };

        window.addEventListener('app:toast_notification', handleToastNotification);
        return () => window.removeEventListener('app:toast_notification', handleToastNotification);
    }, [addNotification]);

    // Initial Load — merge saved session data (timer, notifications, user-added records)
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const currentEmpId = user?.employeeId || user?.employee?.id || user?.id;
                const { isClockedIn, isOnBreak } = useAuthStore.getState();

                const sanitizedEmployees = (parsed.employees || []).map(emp => {
                    const match = currentEmpId && (
                        String(emp.id) === String(currentEmpId) || 
                        String(emp.userId) === String(currentEmpId) || 
                        String(emp.employeeId) === String(currentEmpId)
                    );
                    if (match && isClockedIn && !isOnBreak) {
                        return {
                            ...emp,
                            status: 'online',
                            accountStatus: 'active',
                            isIdle: false,
                            isOnBreak: false,
                            activeApp: 'Active Work',
                            currentActivity: 'Active / Logged In'
                        };
                    }
                    return emp;
                });

                setState(prev => ({
                    ...prev,
                    // Only restore user-added / ephemeral data — NOT the seed data
                    employees: sanitizedEmployees.length > 0 ? sanitizedEmployees : prev.employees,
                    timeEntries: parsed.timeEntries || prev.timeEntries,
                    notifications: parsed.notifications || prev.notifications,
                    leaveRequests: parsed.leaveRequests || prev.leaveRequests,
                    timer: { ...prev.timer, ...(parsed.timer || {}), isRunning: false },
                    complianceSettings: parsed.complianceSettings || prev.complianceSettings,
                    alertThresholds: parsed.alertThresholds || prev.alertThresholds,
                    selectedDate: parsed.selectedDate || prev.selectedDate,
                }));
            }
        } catch (e) { /* ignore corrupt cache */ }
        setIsLoading(false);
    }, [user?.id, user?.employeeId]);

    // Restore active task timer for the authenticated employee
    useEffect(() => {
        const empId = user?.employeeId || user?.id;
        if (empId) {
            useTaskStore.getState().restoreActiveTask(empId);
        }
    }, [user?.employeeId, user?.id]);

    // Cross-tab and instantaneous staff status synchronization
    useEffect(() => {
        const unsubscribe = subscribeStaffStatus((msg) => {
            const { employeeId, status, isIdle, isOnBreak, activeApp, currentActivity } = msg;
            setState(prev => ({
                ...prev,
                employees: prev.employees.map(e => {
                    const match = String(e.id) === String(employeeId) || 
                                  String(e.userId) === String(employeeId) || 
                                  String(e.employeeId) === String(employeeId);
                    if (match) {
                        return {
                            ...e,
                            status: status === 'online' ? 'online' : status,
                            accountStatus: status === 'online' ? 'active' : status,
                            isIdle: !!isIdle,
                            isOnBreak: !!isOnBreak,
                            idleTime: isIdle ? (e.idleTime || 60) : 0,
                            idleMinutes: isIdle ? (e.idleMinutes || 1) : 0,
                            activeApp: activeApp || (isIdle ? 'Away from Computer (Idle)' : 'Active Work'),
                            activeWindow: activeApp || (isIdle ? 'Away from Computer (Idle)' : 'Active Work'),
                            currentActivity: currentActivity || (isIdle ? 'Away from Computer (Idle)' : 'Active / Logged In'),
                            lastSeen: new Date().toISOString()
                        };
                    }
                    return e;
                })
            }));
            if (employeeId && status) {
                useEmployeeStore.getState().updateEmployeeStatus(employeeId, status === 'online' ? 'ACTIVE' : status.toUpperCase());
            }
        });
        return unsubscribe;
    }, []);

    // Persistence — only save ephemeral user-interactive data (not seed logs which are huge)
    useEffect(() => {
        if (!isLoading) {
            const toSave = {
                employees: state.employees,
                timeEntries: state.timeEntries,
                notifications: state.notifications,
                leaveRequests: state.leaveRequests,
                timer: state.timer,
                complianceSettings: state.complianceSettings,
                alertThresholds: state.alertThresholds,
                selectedDate: state.selectedDate,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        }
    }, [state.employees, state.timeEntries, state.notifications, state.leaveRequests, state.timer, state.complianceSettings, state.alertThresholds, state.selectedDate, isLoading]);

    // Timer
    useEffect(() => {
        if (state.timer.isRunning) {
            timerInterval.current = setInterval(() => {
                setState(prev => ({ ...prev, timer: { ...prev.timer, seconds: prev.timer.seconds + 1 } }));
            }, 1000);
        } else {
            clearInterval(timerInterval.current);
        }
        return () => clearInterval(timerInterval.current);
    }, [state.timer.isRunning]);

    // ─── SYNC FUNCTIONS ─────────────────────────────────────────────────────
    const syncEmployees = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await employeeService.getEmployees();
            if (res.success && res.data) {
                setState(prev => {
                    const backendEmployees = res.data.map(emp => {
                        const existing = prev.employees.find(e => 
                            String(e.id) === String(emp.id) || 
                            String(e.userId) === String(emp.id) || 
                            String(e.employeeId) === String(emp.id)
                        );

                        const name = emp.fullName || emp.name || 'Unknown User';
                        const st = (emp.status || 'offline').toLowerCase();
                        const isBreakFromApi = st === 'break';

                        // Live active state preservation with correct precedence
                        const isLiveWorking = existing && existing.status === 'online' && !existing.isIdle && !existing.isOnBreak;
                        const isLiveBreak = existing && existing.isOnBreak && existing.status === 'break';
                        const isLiveIdle = existing && existing.isIdle && existing.status === 'idle';

                        let normalizedStatus = 'offline';
                        if (isLiveWorking) {
                            normalizedStatus = 'online';
                        } else if (isLiveBreak || isBreakFromApi) {
                            normalizedStatus = 'break';
                        } else if (isLiveIdle) {
                            normalizedStatus = 'idle';
                        } else if (st === 'active' || st === 'online') {
                            normalizedStatus = 'online';
                        } else if (st === 'idle' || st === 'afk') {
                            normalizedStatus = 'idle';
                        } else {
                            normalizedStatus = st;
                        }

                        const isNowIdle = normalizedStatus === 'idle';
                        const isNowBreak = normalizedStatus === 'break';
                        const isNowOnline = normalizedStatus === 'online';

                        return {
                            ...emp,
                            name: name,
                            initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                            team: emp.team?.name || emp.team || 'General',
                            status: normalizedStatus,
                            accountStatus: st,
                            isIdle: isNowIdle,
                            isOnBreak: isNowBreak,
                            idleTime: isNowIdle ? (existing?.idleTime || 60) : 0,
                            idleMinutes: isNowIdle ? (existing?.idleMinutes || 1) : 0,
                            productivityScore: emp.productivityScore || (isNowOnline ? 92 : 82),
                            utilizationScore: emp.utilizationScore || (isNowOnline ? 86 : 76),
                            totalWorkHours: emp.totalWorkHours || 0,
                            manualHours: emp.manualHours || 0,
                            computerActivityHours: emp.computerActivityHours || 0,
                            activeApp: isNowIdle ? 'Away from Computer (Idle)' : (existing?.activeApp || (isNowOnline ? 'Active Work' : 'Offline')),
                            activeWindow: isNowIdle ? 'Away from Computer (Idle)' : (existing?.activeWindow || (isNowOnline ? 'Active Work' : 'No recent activity')),
                            currentActivity: isNowBreak ? 'On Break' : (isNowIdle ? 'Away from Computer (Idle)' : (isNowOnline ? 'Active / Logged In' : 'Offline')),
                            location: emp.location || 'Remote'
                        };
                    });
                    return { ...prev, employees: backendEmployees };
                });
            }
        } catch (err) {
            console.error('Failed to sync employees:', err);
        }
    }, [isAuthenticated, role]);

    const syncTeams = useCallback(async () => {
        if (!isAuthenticated || (role !== 'ADMIN' && role !== 'MANAGER')) return;
        try {
            const res = await teamService.getTeams();
            if (res.success && res.data) {
                const teams = res.data.map(t => ({ ...t, isSeed: false }));
                setState(prev => ({ ...prev, teams }));
                useTeamStore.setState({ teams, isLoading: false, error: null });
            }
        } catch (err) {
            console.error('Failed to sync teams:', err);
        }
    }, [isAuthenticated, role]);

    const { dateRange, selectedTeam, selectedEmployee } = useFilterStore();
    const syncLogs = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const params = {
                startDate: dateRange.start,
                endDate: dateRange.end,
                teamId: selectedTeam,
                employeeId: selectedEmployee
            };

            let res;
            if (role === 'ADMIN' || role === 'MANAGER') {
                res = await activityService.getOrganizationSummary(params);
            } else if (role === 'EMPLOYEE' && user?.employeeId) {
                res = await activityService.getEmployeeSummary(user.employeeId, params);
            } else {
                return;
            }

            if (res && res.success && res.data) {
                const logs = Array.isArray(res.data) ? res.data : (res.data.logs || []);
                setState(prev => ({ ...prev, activityLogs: logs }));
            }
        } catch (err) {
            if (err.response?.status !== 403) {
                console.error('Failed to sync activity logs:', err);
            }
        }
    }, [isAuthenticated, role, user, dateRange, selectedTeam, selectedEmployee]);

    const syncTasks = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const currentEmpId = user?.employeeId || employeesRef.current.find(e => e.email === user?.email)?.id || user?.id;
            const res = await taskService.getTasks(role === 'EMPLOYEE' ? currentEmpId : null);
            if (res.success && res.data) {
                setState(prev => ({
                    ...prev,
                    tasks: res.data.map(task => ({
                        id: task.id,
                        title: task.name,
                        project: task.project?.name || 'No Project',
                        projectId: task.projectId,
                        priority: task.priority || 'Medium',
                        assignee: task.employee ? task.employee.fullName : 'Unassigned',
                        assigneeId: task.employeeId,
                        assigneeStatus: task.employee?.status?.toLowerCase() || 'offline',
                        status: mapStatus(task.status),
                        progress: task.status === 'FINALIZED' ? 100 : (task.status === 'QUALITY_ASSURANCE' ? 80 : (task.status === 'IN_OPERATIONS' ? 40 : 0)),
                        dueDate: task.dueDate ? task.dueDate.split('T')[0] : 'No Date',
                        estimatedHours: task.estimatedHours !== undefined && task.estimatedHours !== null ? Number(task.estimatedHours) : null,
                        actualHours: task.actualHours !== undefined && task.actualHours !== null ? Number(task.actualHours) : null,
                        actualSeconds: task.actualSeconds !== undefined ? Number(task.actualSeconds) : (task.totalSeconds !== undefined ? Number(task.totalSeconds) : null),
                        timeSpent: (() => {
                            if (task.actualHours !== undefined && task.actualHours !== null) {
                                return `${task.actualHours}h`;
                            }
                            if (task.actualSeconds !== undefined && task.actualSeconds !== null) {
                                return `${Math.round((task.actualSeconds / 3600) * 10) / 10}h`;
                            }
                            let totalHrs = 0;
                            state.activityLogs.forEach(log => {
                                if (log.taskHours && log.taskHours[task.id]) {
                                    totalHrs += log.taskHours[task.id];
                                }
                            });
                            return Math.round(totalHrs * 10) / 10 + 'h';
                        })(),
                        description: task.description || ''
                    }))
                }));
            }
        } catch (err) {
            console.error('Failed to sync tasks:', err);
        }
    }, [isAuthenticated, role, user?.employeeId, user?.id, user?.email]);

    const syncProjects = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await projectService.getProjects();
            if (res.success && res.data) {
                const projectsData = Array.isArray(res.data) ? res.data : (res.data.projects || []);
                setState(prev => ({
                    ...prev,
                    projects: projectsData.map(p => ({
                        id: p.id,
                        name: p.projectName || p.name,
                        client: p.client || 'Internal',
                        progress: p.progress !== undefined ? parseInt(p.progress) : 0,
                        status: p.status || 'Active',
                        color: p.color || 'bg-indigo-500',
                        taskCount: p.tasks || 0,
                        tasks: p.tasks || 0,
                        completedTasks: p.completedTasks || 0,
                        inProgressTasks: p.inProgressTasks || 0,
                        efficiency: p.efficiency !== undefined ? p.efficiency : 100,
                        leadStakeholder: p.leadStakeholder || (p.assignedEmployees && p.assignedEmployees[0]) || 'Lead',
                        assignedEmployees: p.assignedEmployees || [],
                        assignedEmployeeIds: p.assignedEmployeeIds || [],
                        totalSeconds: p.totalSeconds || 0,
                        totalTime: p.totalTime || '00:00',
                        billableRate: p.billableRate || p.billRate || 120,
                        memberIds: p.assignedEmployeeIds || p.assignments?.map(a => a.employeeId) || [],
                        isSeed: false
                    }))
                }));
            }
        } catch (err) {
            console.error('Failed to sync projects:', err);
        }
    }, [isAuthenticated]);

    const syncGoals = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await goalService.getGoals();
            if (res.success && res.data) {
                setState(prev => ({ ...prev, goals: res.data }));
            }
        } catch (err) {
            console.error('Failed to sync goals:', err);
        }
    }, [isAuthenticated]);

    const syncNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await notificationService.getNotifications({ limit: 50 });
            if (res && res.notifications) {
                setState(prev => ({
                    ...prev,
                    notifications: res.notifications.slice(0, 50)
                }));
            }
        } catch (err) {
            console.error('Failed to sync notifications:', err);
        }
    }, [isAuthenticated]);

    const syncAlerts = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await alertService.getAlertHistory({ limit: 50 });
            const alertList = res?.alerts || res?.data?.alerts || (Array.isArray(res) ? res : []);
            if (alertList) {
                setState(prev => ({
                    ...prev,
                    alerts: alertList
                }));
            }
        } catch (err) {
            console.error('Failed to sync alerts:', err);
        }
    }, [isAuthenticated]);

    // ─── POLLING INTERVALS ──────────────────────────────────────────────────
    useEffect(() => {
        if (isLoading || !isAuthenticated) return;
        syncEmployees();
        syncTeams();
        syncTasks();
        syncProjects();
        syncGoals();
        syncLogs();
        syncNotifications();
        syncAlerts();

        const empInt = setInterval(syncEmployees, 15000);
        const teamInt = setInterval(syncTeams, 30000);
        const logInt = setInterval(syncLogs, 15000);
        const taskInt = setInterval(syncTasks, 15000);
        const projInt = setInterval(syncProjects, 30000);
        const goalInt = setInterval(syncGoals, 30000);
        const notifInt = setInterval(syncNotifications, 15000);
        const alertInt = setInterval(syncAlerts, 15000);

        return () => {
            clearInterval(empInt);
            clearInterval(teamInt);
            clearInterval(logInt);
            clearInterval(taskInt);
            clearInterval(projInt);
            clearInterval(goalInt);
            clearInterval(notifInt);
            clearInterval(alertInt);
        };
    }, [isLoading, isAuthenticated, role, user?.id, user?.employeeId]);

    const [socketInstance, setSocketInstance] = useState(null);

    // WebSocket Integration (Singleton connection, resilient to StrictMode remounts)
    useEffect(() => {
        if (isLoading || !isAuthenticated || !user) {
            setSocketInstance(null);
            return;
        }

        const token = useAuthStore.getState().token;
        const socket = getSharedSocket(token);
        if (!socket) return;
        setSocketInstance(socket);

        const handleConnect = () => {
            console.log('RealTimeContext: Connected to socket');
            syncEmployees();
            syncTeams();
            syncLogs();
            syncTasks();
            syncProjects();
            syncGoals();
            syncNotifications();
            syncAlerts();
        };

        if (socket.connected) {
            handleConnect();
        }
        socket.on('connect', handleConnect);

        const handleEmployeeStatus = ({ employeeId, status, idleStartTime, idleDuration, lastActiveAt }) => {
            const raw = (status || 'offline').toLowerCase();
            const normalized = (raw === 'active' || raw === 'online') ? 'online' : raw;
            setState(prev => ({
                ...prev,
                employees: prev.employees.map(e =>
                    String(e.id) === String(employeeId) || String(e.userId) === String(employeeId) || String(e.employeeId) === String(employeeId)
                        ? {
                            ...e,
                            status: normalized,
                            accountStatus: raw,
                            isIdle: normalized === 'idle' || normalized === 'afk',
                            ...(normalized === 'online' ? { lastSeen: new Date().toISOString(), idleTime: 0, isIdle: false } : {}),
                            ...(idleStartTime ? { idleStartTime } : {}),
                            ...(idleDuration !== undefined ? { idleTime: idleDuration, idleMinutes: Math.floor(idleDuration / 60) } : {}),
                            ...(lastActiveAt ? { lastActiveAt } : {})
                        }
                        : e
                )
            }));
            useEmployeeStore.getState().updateEmployeeStatus(employeeId, raw);
        };

        const handleAdminIdleAlert = (data) => {
            console.log('RealTimeContext: Admin Inactivity Alert:', data);
            // Ignore idle alerts for admin or manager accounts
            const name = (data.employeeName || '').toLowerCase();
            const alertRole = (data.employeeRole || data.role || '').toUpperCase();
            if (alertRole === 'ADMIN' || alertRole === 'MANAGER' || name.includes('admin')) {
                return;
            }
            playAlertChime();
            toast.warning(`Inactivity Alert: ${data.employeeName || 'Employee'} has been inactive for 10 minutes.`);
            setState(prev => ({
                ...prev,
                alerts: [
                    {
                        id: `alert-idle-${Date.now()}`,
                        employeeId: data.employeeId,
                        employeeName: data.employeeName,
                        title: 'Employee Inactivity Alert',
                        message: `Employee ${data.employeeName || 'Employee'} has been inactive for 10 minutes.`,
                        severity: 'warning',
                        createdAt: new Date().toISOString()
                    },
                    ...prev.alerts
                ].slice(0, 50)
            }));
        };

        const handleEmployeeIdleResumed = (data) => {
            console.log('RealTimeContext: Employee resumed activity:', data);
            setState(prev => ({
                ...prev,
                employees: prev.employees.map(e =>
                    String(e.id) === String(data.employeeId)
                        ? {
                            ...e,
                            status: 'online',
                            accountStatus: 'active',
                            idleTime: 0,
                            lastSeen: data.resumedAt || new Date().toISOString()
                        }
                        : e
                )
            }));
        };

        const handleActivityUpdate = (data) => {
            console.log('RealTimeContext: Activity update received:', data);
            const isIdleNow = (data.idleTime || 0) >= 60 || (data.activeApp || '').toLowerCase().includes('idle') || (data.activeApp || '').toLowerCase().includes('away');
            setState(prev => ({
                ...prev,
                employees: prev.employees.map(e => {
                    if (String(e.id) === String(data.employeeId) || String(e.userId) === String(data.employeeId) || String(e.employeeId) === String(data.employeeId)) {
                        return {
                            ...e,
                            activeApp: data.activeApp,
                            activeWindow: data.activeWindow,
                            idleTime: data.idleTime,
                            idleMinutes: Math.floor((data.idleTime || 0) / 60),
                            isIdle: isIdleNow,
                            status: isIdleNow ? 'idle' : (e.status === 'break' ? 'break' : 'online'),
                            location: data.location || e.location,
                            lastSeen: data.timestamp || new Date()
                        };
                    }
                    return e;
                })
            }));
        };

        const handleScreenshotNew = (data) => {
            console.log('RealTimeContext: New screenshot received:', data);
            setState(prev => ({
                ...prev,
                screenshots: [data, ...prev.screenshots].slice(0, 50),
                employees: prev.employees.map(e =>
                    e.id === data.employeeId ? { ...e, screenshotUrl: data.imageUrl } : e
                )
            }));
            const currentRole = useAuthStore.getState().role?.toUpperCase();
            if (currentRole === 'ADMIN') {
                addNotification(`New screenshot from ${data.employeeName || 'employee'}`, 'info');
            } else if (currentRole === 'MANAGER') {
                const currentEmps = employeesRef.current || [];
                const authUser = useAuthStore.getState().user;
                const myTeamIds = new Set(
                    currentEmps
                        .filter(e => (authUser?.teamId && e.teamId === authUser.teamId) || (authUser?.team && (e.team === authUser.team || e.teamName === authUser.team)))
                        .map(e => String(e.id))
                );
                if (myTeamIds.has(String(data.employeeId))) {
                    addNotification(`New screenshot from ${data.employeeName || 'employee'}`, 'info');
                }
            }
        };

        const handleGoalUpdate = (data) => {
            setState(prev => ({
                ...prev,
                goals: prev.goals.map(g => g.id === data.id ? data : g)
            }));
        };

        const handleAttendanceUpdate = (data) => {
            console.log('RealTimeContext: Attendance updated:', data);
            syncEmployees();
            syncLogs();

            const currentRole = useAuthStore.getState().role?.toUpperCase();
            const currentEmps = employeesRef.current || [];
            const emp = currentEmps.find(e => String(e.id) === String(data.employeeId));
            const empName = emp ? (emp.fullName || emp.name) : 'An employee';
            const normType = String(data.type || data.status || '').toLowerCase().replace(/_/g, '-');

            if (currentRole === 'ADMIN') {
                if (normType === 'clock-in') {
                    addNotification(`${empName} checked in`, 'info');
                } else if (normType === 'clock-out') {
                    addNotification(`${empName} clocked out`, 'info');
                } else if (normType === 'break-start') {
                    addNotification(`${empName} went on break`, 'info');
                } else if (normType === 'break-end') {
                    addNotification(`${empName} returned from break`, 'info');
                }
            } else if (currentRole === 'MANAGER') {
                const authUser = useAuthStore.getState().user;
                const myTeamIds = new Set(
                    currentEmps
                        .filter(e => (authUser?.teamId && e.teamId === authUser.teamId) || (authUser?.team && (e.team === authUser.team || e.teamName === authUser.team)))
                        .map(e => String(e.id))
                );
                if (myTeamIds.has(String(data.employeeId))) {
                    if (normType === 'clock-in') {
                        addNotification(`${empName} checked in`, 'info');
                    } else if (normType === 'clock-out') {
                        addNotification(`${empName} clocked out`, 'info');
                    } else if (normType === 'break-start') {
                        addNotification(`${empName} went on break`, 'info');
                    } else if (normType === 'break-end') {
                        addNotification(`${empName} returned from break`, 'info');
                    }
                }
            }
        };

        const handleTaskUpdate = (data) => {
            console.log('RealTimeContext: Task updated:', data);
            syncTasks();
        };

        const handleProjectUpdate = (data) => {
            console.log('RealTimeContext: Project updated:', data);
            syncProjects();
        };

        const handleTeamUpdate = (data) => {
            console.log('RealTimeContext: Team updated:', data);
            syncTeams();
            syncEmployees();
        };

        const handleGoalNew = (data) => {
            setState(prev => ({
                ...prev,
                goals: [data, ...prev.goals]
            }));
            addNotification(`New goal "${data.title}" defined`, 'success');
        };

        const handleEmployeeNotification = ({ title, type }) => {
            addNotification(title, type || 'info');
        };

        // ─── REAL-TIME NOTIFICATION & ALERT LISTENERS ─────────────────────────
        const handleAlertNew = (alertData) => {
            console.log('RealTimeContext: Real-time alert received:', alertData);
            playAlertChime();
            const alertNotif = {
                id: alertData.id || `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                title: alertData.title || (alertData.type === 'idle' ? 'Inactivity Alert' : 'System Alert'),
                description: alertData.message || (alertData.type === 'idle' ? `Employee ${alertData.employeeName || 'Staff'} has been inactive.` : 'Alert received'),
                type: alertData.severity === 'critical' ? 'alert' : 'warning',
                time: 'Just now',
                unread: true,
                link: '/alerts'
            };

            setState(prev => ({
                ...prev,
                alerts: [alertData, ...prev.alerts.filter(a => a.id !== alertData.id)],
                notifications: [alertNotif, ...prev.notifications.filter(n => n.id !== alertNotif.id)].slice(0, 50)
            }));
            // NOTE: Routed to Notification Bell icon dropdown — no screen-blocking popups!
        };

        const handleNotificationNew = (notifData) => {
            console.log('RealTimeContext: Real-time notification received:', notifData);
            const n = {
                id: notifData.id || `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                title: notifData.title || 'System Notification',
                description: notifData.description || notifData.message || '',
                type: notifData.type || 'info',
                time: notifData.time || 'Just now',
                unread: notifData.unread !== undefined ? notifData.unread : true,
                link: notifData.link || null
            };
            setState(prev => ({
                ...prev,
                notifications: [n, ...prev.notifications.filter(item => item.id !== n.id)].slice(0, 50)
            }));
        };

        const handleScreenshotViolation = (violationData) => {
            console.log('RealTimeContext: Real-time violation screenshot:', violationData);
            playAlertChime();
            const violationNotif = {
                id: `violation_${Date.now()}`,
                title: 'Security Violation',
                description: `Prohibited app "${violationData.appName}" accessed by ${violationData.employeeName}!`,
                type: 'alert',
                time: 'Just now',
                unread: true,
                link: '/screenshots'
            };
            setState(prev => ({
                ...prev,
                notifications: [violationNotif, ...prev.notifications.filter(n => n.id !== violationNotif.id)].slice(0, 50),
                ...(violationData.imageUrl ? {
                    screenshots: [{
                        employeeId: violationData.employeeId,
                        employeeName: violationData.employeeName,
                        imageUrl: violationData.imageUrl,
                        capturedAt: violationData.capturedAt || new Date(),
                        productivity: 'UNPRODUCTIVE',
                        isViolation: true
                    }, ...prev.screenshots].slice(0, 50)
                } : {})
            }));
        };

        socket.on('employee:status', handleEmployeeStatus);
        socket.on('activity:update', handleActivityUpdate);
        socket.on('screenshot:new', handleScreenshotNew);
        socket.on('goal:update', handleGoalUpdate);
        socket.on('attendance:update', handleAttendanceUpdate);
        socket.on('task:update', handleTaskUpdate);
        socket.on('project:update', handleProjectUpdate);
        socket.on('team:update', handleTeamUpdate);
        socket.on('goal:new', handleGoalNew);
        socket.on('employee:notification', handleEmployeeNotification);
        socket.on('alert:new', handleAlertNew);
        socket.on('notification:new', handleNotificationNew);
        socket.on('screenshot:violation', handleScreenshotViolation);
        socket.on('admin:idle_alert', handleAdminIdleAlert);
        socket.on('employee:idle_resumed', handleEmployeeIdleResumed);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('employee:status', handleEmployeeStatus);
            socket.off('activity:update', handleActivityUpdate);
            socket.off('screenshot:new', handleScreenshotNew);
            socket.off('goal:update', handleGoalUpdate);
            socket.off('attendance:update', handleAttendanceUpdate);
            socket.off('task:update', handleTaskUpdate);
            socket.off('project:update', handleProjectUpdate);
            socket.off('team:update', handleTeamUpdate);
            socket.off('goal:new', handleGoalNew);
            socket.off('employee:notification', handleEmployeeNotification);
            socket.off('alert:new', handleAlertNew);
            socket.off('notification:new', handleNotificationNew);
            socket.off('screenshot:violation', handleScreenshotViolation);
            socket.off('admin:idle_alert', handleAdminIdleAlert);
            socket.off('employee:idle_resumed', handleEmployeeIdleResumed);
        };
    }, [isLoading, isAuthenticated, user?.id, user?.role]);

    // ─── REAL-TIME NOTIFICATION TRIGGERS (CLIENT-SIDE) ───────────────────────

    // 1. Task changes comparison
    const prevTasksRef = useRef([]);
    useEffect(() => {
        if (isLoading || !isAuthenticated) return;
        const prevTasks = prevTasksRef.current;
        const currentTasks = state.tasks;

        if (prevTasks.length > 0 && currentTasks.length > 0) {
            currentTasks.forEach(task => {
                const oldTask = prevTasks.find(t => t.id === task.id);
                if (!oldTask) {
                    if (role === 'EMPLOYEE') {
                        const isAssignedToMe = String(task.assigneeId) === String(user?.employeeId) ||
                            String(task.assigneeId) === String(user?.id);
                        if (isAssignedToMe) {
                            addNotification(`New task assigned to you: "${task.title}"`, 'success');
                        }
                    } else if (role === 'ADMIN' || role === 'MANAGER') {
                        addNotification(`New task created: "${task.title}"`, 'success');
                    }
                } else {
                    if (oldTask.status !== task.status) {
                        if (role === 'EMPLOYEE') {
                            const isAssignedToMe = String(task.assigneeId) === String(user?.employeeId) ||
                                String(task.assigneeId) === String(user?.id);
                            if (isAssignedToMe) {
                                addNotification(`Task "${task.title}" status changed to ${task.status}`, 'info');
                            }
                        } else if (role === 'ADMIN' || role === 'MANAGER') {
                            addNotification(`Task "${task.title}" status updated to ${task.status} (assigned to ${task.assignee})`, 'info');
                        }
                    }
                    if (oldTask.assigneeId !== task.assigneeId) {
                        if (role === 'EMPLOYEE') {
                            const isAssignedToMeNow = String(task.assigneeId) === String(user?.employeeId) ||
                                String(task.assigneeId) === String(user?.id);
                            if (isAssignedToMeNow) {
                                addNotification(`Task "${task.title}" has been assigned to you`, 'success');
                            }
                        } else if (role === 'ADMIN' || role === 'MANAGER') {
                            addNotification(`Task "${task.title}" reassigned to ${task.assignee}`, 'info');
                        }
                    }
                }
            });
        }
        prevTasksRef.current = currentTasks;
    }, [state.tasks, role, user, isLoading, isAuthenticated, addNotification]);

    // 2. Employee status changes (Admin/Manager notifications)
    const prevStatuses = useRef({});
    useEffect(() => {
        if (isLoading || !isAuthenticated || (role !== 'ADMIN' && role !== 'MANAGER')) return;
        state.employees.forEach(emp => {
            const prevStatus = prevStatuses.current[emp.id];
            const currentStatus = emp.status;
            if (prevStatus && prevStatus !== currentStatus && currentStatus) {
                // If manager, only notify for their own team members
                const isTeamMember = role === 'ADMIN' || (
                    (user?.teamId && emp.teamId === user.teamId) ||
                    (user?.team && (emp.team === user.team || emp.teamName === user.team))
                );
                if (isTeamMember) {
                    if (currentStatus === 'online') {
                        addNotification(`${emp.fullName || emp.name} went online`, 'info');
                    } else if (currentStatus === 'offline') {
                        addNotification(`${emp.fullName || emp.name} went offline`, 'info');
                    }
                }
            }
            prevStatuses.current[emp.id] = currentStatus;
        });
    }, [state.employees, role, isLoading, isAuthenticated, addNotification, user?.teamId, user?.team]);

    // 3. Employee team changes (Employee notifications)
    const prevEmployeeTeamRef = useRef(null);
    useEffect(() => {
        if (isLoading || !isAuthenticated || role !== 'EMPLOYEE') return;
        const currentEmp = state.employees.find(e => e.email === user?.email);
        if (currentEmp && currentEmp.team) {
            if (prevEmployeeTeamRef.current && prevEmployeeTeamRef.current !== currentEmp.team) {
                addNotification(`Your team was changed to "${currentEmp.team}"`, 'info');
            }
            prevEmployeeTeamRef.current = currentEmp.team;
        }
    }, [state.employees, role, user, isLoading, isAuthenticated, addNotification]);

    // ─── COMPUTED ANALYTICS ──────────────────────────────────────────────────

    const stats = useMemo(() => {
        const { employees, activityLogs, selectedDate } = state;

        // 1. Calculate empMetrics FIRST (today's logs for each employee)
        const targetDate = selectedDate || TODAY;
        let todayLogs = activityLogs.filter(l => l.date === targetDate);
        if (todayLogs.length === 0 && activityLogs.length > 0) {
            todayLogs = activityLogs;
        }

        const empMetrics = employees.map(emp => {
            const log = todayLogs.find(l => String(l.employeeId) === String(emp.id)) ||
                        activityLogs.find(l => String(l.employeeId) === String(emp.id));
            const fullName = emp.fullName || emp.name || 'Unknown User';

            // Determine status from live DB/socket status + real-time heartbeat (lastSeen)
            const rawStatus = (emp.status || emp.accountStatus || '').toLowerCase();
            const hasRecentHeartbeat = emp.lastSeen ? (new Date() - new Date(emp.lastSeen)) < 10 * 60 * 1000 : false;

            let status = 'offline';
            if (rawStatus === 'break') {
                status = 'break';
            } else if (rawStatus === 'idle') {
                status = 'idle';
            } else if (rawStatus === 'online' || rawStatus === 'active') {
                status = 'online';
                if (emp.currentActivity?.toLowerCase() === 'break') {
                    status = 'break';
                } else if (hasRecentHeartbeat && (emp.currentActivity?.toLowerCase() === 'idle' || (log && log.idleHours > 0 && log.activeHours === 0))) {
                    status = 'idle';
                }
            } else if (rawStatus !== 'offline' && rawStatus !== 'deactivated' && hasRecentHeartbeat) {
                status = 'online';
            }

            // Find latest break start time if on break
            let breakStartedAt = log?.breakStartedAt || null;
            let breakHours = log?.breakHours || 0;
            const manualHours = log?.manualHours ?? (emp.manualHours || 0);
            const activeHours = log?.activeHours ?? (emp.computerActivityHours || 0);
            const idleHours = log?.idleHours || 0;
            const totalWorkHours = log?.workHours ?? (emp.totalWorkHours || (activeHours + idleHours + manualHours));

            let productivityScore = 0;
            if (log && log.productivityPct !== undefined && log.productivityPct > 0) {
                productivityScore = log.productivityPct;
            } else if (emp.productivityScore !== undefined && emp.productivityScore > 0) {
                productivityScore = emp.productivityScore;
            } else if (status === 'online') {
                productivityScore = 92;
            } else if (status === 'idle') {
                productivityScore = 70;
            } else {
                productivityScore = 80;
            }

            let utilizationScore = 0;
            if (log && log.utilizationPct !== undefined && log.utilizationPct > 0) {
                utilizationScore = log.utilizationPct;
            } else if (emp.utilizationScore !== undefined && emp.utilizationScore > 0) {
                utilizationScore = emp.utilizationScore;
            } else if (status === 'online') {
                utilizationScore = 88;
            } else if (status === 'idle') {
                utilizationScore = 65;
            } else {
                utilizationScore = 75;
            }

            const activeApp = emp.activeApp || log?.appWebsite || (status === 'online' ? 'Visual Studio Code' : 'Offline');
            const activeWindow = emp.activeWindow || (status === 'online' ? 'Working on Development Task' : 'No recent activity');
            const location = emp.location && emp.location !== '-' ? emp.location : (emp.workMode ? emp.workMode : 'Remote');

            return {
                ...emp,
                name: fullName,
                initials: fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                team: emp.team?.name || emp.team || 'General',
                status,
                breakStartedAt,
                breakHours,
                manualHours,
                activeHours,
                idleHours,
                totalWorkHours,
                computerActivityHours: activeHours,
                productive: log ? `${String(Math.floor(log.productiveHours)).padStart(2, '0')}:${String(Math.round((log.productiveHours % 1) * 60)).padStart(2, '0')}` : (activeHours > 0 ? `${String(Math.floor(activeHours)).padStart(2, '0')}:00` : '00:00'),
                unproductive: log ? `${String(Math.floor(log.unproductiveHours)).padStart(2, '0')}:${String(Math.round((log.unproductiveHours % 1) * 60)).padStart(2, '0')}` : '00:00',
                utilization: utilizationScore,
                productivity: productivityScore,
                productivityScore,
                utilizationScore,
                productiveHours: log?.productiveHours || (productivityScore * activeHours / 100),
                unproductiveHours: log?.unproductiveHours || 0,
                activeApp,
                activeWindow,
                location
            };
        });

        // 2. Base analytics on the enriched empMetrics
        const summary = computeSummaryStats(activityLogs, selectedDate);
        const trend = weeklyProductivityTrend(activityLogs);
        const intraday = intradayActivity(activityLogs, selectedDate);
        const appUsage = appUsageByCategory(state.appUsageLogs, 7);
        const live = liveEmployeeStats(empMetrics);

        // 3. Team breakdown using actual teams (Filter out seed data if real data exists)
        const realTeams = state.teams.filter(t => !t.isSeed);
        const activeRealEmps = empMetrics.filter(e => !e.isSeed);

        // If we have real teams or real employees, use ONLY those names.
        // Otherwise fallback to seed names (state.teams will have them if no real teams synced)
        const useRealOnly = realTeams.length > 0 || activeRealEmps.length > 0;

        let teamNames;
        if (useRealOnly) {
            // Get names from real teams OR teams mentioned by real employees
            teamNames = [...new Set([
                ...realTeams.map(t => t.name),
                ...activeRealEmps.map(e => e.team)
            ])].filter(name =>
                name &&
                name !== 'General' &&
                !['Engineering', 'Sales', 'HR', 'Operations'].includes(name)
            );

            // If we filtered EVERYTHING out but we have real data, at least show the real ones
            if (teamNames.length === 0 && useRealOnly) {
                teamNames = [...new Set([
                    ...realTeams.map(t => t.name),
                    ...activeRealEmps.map(e => e.team)
                ])].filter(name => name && name !== 'General');
            }
        } else {
            teamNames = [...new Set([
                ...state.teams.map(t => t.name),
                ...empMetrics.map(e => e.team)
            ])].filter(Boolean);
        }

        const teamBreakdown = teamNames.map(name => ({
            name,
            productivity: teamProductivity(empMetrics, name, activityLogs),
            active: empMetrics.filter(e => e.team === name && e.status === 'online').length,
            total: empMetrics.filter(e => e.team === name).length,
        }));

        const totalPayroll = (state.payrollData || []).reduce((s, p) => s + (p.grossPayValue || 0), 0);
        const avgHourlyRate = employees.length > 0 ? Math.round(employees.reduce((s, e) => s + (e.hourlyRate || 0), 0) / employees.length) : 0;

        return {
            ...live,
            totalHours: { today: summary.workTime, week: summary.workTime, month: summary.workTime },
            summary,
            productivityTrend: trend,
            intradayActivity: intraday,
            departmentStats: teamBreakdown,
            appUsage,
            empMetrics,
            topProductive: [...empMetrics].sort((a, b) => b.productivity - a.productivity).slice(0, 5),
            topUnproductive: [...empMetrics].sort((a, b) => a.productivity - b.productivity).slice(0, 5),
            payroll: { total: totalPayroll, avgHourlyRate, formatted: `$${totalPayroll.toLocaleString()}` },
        };
    }, [state.employees, state.activityLogs, state.appUsageLogs, state.payrollData, state.selectedDate]);

    // ─── ACTIONS ─────────────────────────────────────────────────────────────

    // Employee CRUD
    const addEmployee = useCallback((employee) => {
        const id = employee.id || Date.now();
        const baseEmp = {
            ...employee,
            id,
            status: employee.status || 'active',
            avatar: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || 'User')}&background=random`,
            hourlyRate: employee.hourlyRate || 0,
            productivityScore: employee.productivityScore || 0,
            utilizationScore: employee.utilizationScore || 0,
            team: employee.team || 'General',
            lat: employee.lat || null,
            lng: employee.lng || null,
        };

        setState(prev => ({
            ...prev,
            employees: [baseEmp, ...prev.employees],
        }));

        addNotification(`New employee ${employee.name || employee.fullName} added`, 'success');
        return baseEmp;
    }, [addNotification]);

    const updateEmployee = useCallback((id, updates) => {
        setState(prev => ({ ...prev, employees: prev.employees.map(e => e.id === id ? { ...e, ...updates } : e) }));
    }, []);

    const deleteEmployee = useCallback((id) => {
        setState(prev => ({ ...prev, employees: prev.employees.filter(e => e.id !== id) }));
        addNotification('Employee removed', 'info');
    }, [addNotification]);

    const mergeEmployees = useCallback((fromId, intoId) => {
        setState(prev => ({ ...prev, employees: prev.employees.filter(e => e.id !== parseInt(fromId)) }));
        addNotification('Employees merged successfully', 'success');
    }, [addNotification]);

    // Team CRUD
    const addTeam = useCallback((team) => {
        const newTeam = { ...team, id: Date.now(), members: 0, color: 'bg-violet-500', productivity: 80 };
        setState(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
        addNotification(`Team "${team.name}" created`, 'success');
    }, [addNotification]);

    const updateTeam = useCallback((id, updates) => {
        setState(prev => ({ ...prev, teams: prev.teams.map(t => t.id === id ? { ...t, ...updates } : t) }));
    }, []);

    const deleteTeam = useCallback((id) => {
        setState(prev => ({ ...prev, teams: prev.teams.filter(t => t.id !== id) }));
        addNotification('Team removed', 'info');
    }, [addNotification]);

    // Timer
    const startTimer = useCallback((taskName) => {
        setState(prev => ({ ...prev, timer: { ...prev.timer, isRunning: true, startTime: prev.timer.startTime || Date.now(), currentTask: taskName || 'General Work' } }));
    }, []);

    const pauseTimer = useCallback(() => setState(prev => ({ ...prev, timer: { ...prev.timer, isRunning: false } })), []);

    const stopTimer = useCallback(() => {
        setState(prev => {
            const { seconds, currentTask, startTime } = prev.timer;
            const now = Date.now();
            const fmt = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const newEntry = {
                id: now, date: new Date().toISOString().split('T')[0],
                day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                task: currentTask || 'General Work', project: 'General',
                duration: formatTime(seconds), time: `${fmt(startTime || now)} - ${fmt(now)}`, status: 'Verified',
            };
            return { ...prev, timeEntries: [newEntry, ...prev.timeEntries], timer: { isRunning: false, startTime: null, seconds: 0, currentTask: null } };
        });
        addNotification('Time entry saved', 'success');
    }, [addNotification]);

    const toggleTimer = useCallback((taskName = 'General Work') => {
        setState(prev => {
            if (prev.timer.isRunning) {
                const { seconds, currentTask, startTime } = prev.timer;
                const now = Date.now();
                const fmt = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const entry = { id: now, date: new Date().toISOString().split('T')[0], day: new Date().toLocaleDateString('en-US', { weekday: 'long' }), task: currentTask || 'Work', project: 'General', duration: formatTime(seconds), time: `${fmt(startTime || now)} - ${fmt(now)}`, status: 'Verified' };
                return { ...prev, timeEntries: [entry, ...prev.timeEntries], timer: { isRunning: false, startTime: null, seconds: 0, currentTask: null } };
            }
            return { ...prev, timer: { isRunning: true, startTime: Date.now(), seconds: 0, currentTask: taskName } };
        });
    }, []);

    const addTimeEntry = useCallback((entry) => {
        setState(prev => ({ ...prev, timeEntries: [{ ...entry, id: Date.now() }, ...prev.timeEntries] }));
        addNotification('Time entry saved', 'success');
    }, [addNotification]);

    const updateTimeEntry = useCallback((id, updates) => {
        setState(prev => ({ ...prev, timeEntries: prev.timeEntries.map(e => e.id === id ? { ...e, ...updates } : e) }));
    }, []);

    const deleteTimeEntry = useCallback((id) => {
        setState(prev => ({ ...prev, timeEntries: prev.timeEntries.filter(e => e.id !== id) }));
    }, []);

    // Task Timer Actions (Delegated to centralized useTaskStore)
    const startTask = useCallback((taskId) => {
        const targetTask = state.tasks?.find(t => t.id === taskId) || { id: taskId };
        return taskTimer.startTask(targetTask);
    }, [state.tasks, taskTimer]);

    const stopTask = useCallback(async () => {
        const result = await useTaskStore.getState().stopTask();
        if (result) {
            syncTasks();
        }
        return result;
    }, [syncTasks]);

    // Tasks
    // Tasks
    const addTask = useCallback(async (task) => {
        const tempId = `temp-${Date.now()}`;
        try {
            const statusMap = {
                'Backlog': 'BACKLOG',
                'In Operations': 'IN_OPERATIONS',
                'Quality Assurance': 'QUALITY_ASSURANCE',
                'Finalized': 'FINALIZED',
                'BACKLOG': 'BACKLOG',
                'IN_OPERATIONS': 'IN_OPERATIONS',
                'QUALITY_ASSURANCE': 'QUALITY_ASSURANCE',
                'FINALIZED': 'FINALIZED'
            };
            const backendTask = {
                name: task.title,
                projectId: task.projectId,
                employeeId: task.assigneeId,
                priority: task.priority?.toUpperCase() || 'MEDIUM',
                status: statusMap[task.status] || 'BACKLOG',
                dueDate: task.dueDate
            };

            // Optimistic Update
            const optimisticTask = {
                id: tempId,
                title: task.title,
                project: task.project || 'Internal',
                projectId: task.projectId,
                priority: task.priority || 'Medium',
                assignee: task.assignee || 'Unassigned',
                assigneeId: task.assigneeId,
                assigneeStatus: 'active', // New tasks are usually assigned to active users
                status: mapStatus(task.status || 'BACKLOG'),
                progress: task.status?.toUpperCase() === 'FINALIZED' ? 100 : (task.status?.toUpperCase() === 'QUALITY_ASSURANCE' ? 80 : (task.status?.toUpperCase() === 'IN_OPERATIONS' ? 40 : 0)),
                dueDate: task.dueDate ? task.dueDate.split('T')[0] : 'No Date',
                timeSpent: '0h',
                description: task.description || '',
                isOptimistic: true
            };

            setState(prev => ({ ...prev, tasks: [optimisticTask, ...prev.tasks] }));

            const res = await taskService.createTask(backendTask);
            if (res.success && res.data) {
                const b = res.data;
                const newTask = {
                    id: b.id,
                    title: b.name,
                    project: b.project?.name || task.project || 'Internal',
                    projectId: b.projectId,
                    priority: b.priority,
                    assignee: b.employee ? b.employee.fullName : (task.assignee || 'Unassigned'),
                    assigneeId: b.employeeId,
                    assigneeStatus: b.employee?.status?.toLowerCase() || 'offline',
                    status: mapStatus(b.status),
                    progress: b.status === 'FINALIZED' ? 100 : (b.status === 'QUALITY_ASSURANCE' ? 80 : (b.status === 'IN_OPERATIONS' ? 40 : 0)),
                    dueDate: b.dueDate ? b.dueDate.split('T')[0] : (task.dueDate || 'No Date'),
                    timeSpent: '0h',
                    description: b.description || ''
                };
                setState(prev => ({
                    ...prev,
                    tasks: prev.tasks.map(t => t.id === tempId ? newTask : t)
                }));
                addNotification(`Task "${newTask.title}" created`, 'success');
            } else {
                // Rollback
                setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== tempId) }));
                addNotification('Failed to create task', 'error');
            }
        } catch (error) {
            console.error('Failed to add task:', error);
            // Rollback
            setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== tempId) }));
        }
    }, [addNotification]);

    const updateTaskStatus = useCallback(async (taskId, status, progress) => {
        try {
            const statusMap = {
                'Backlog': 'BACKLOG',
                'In Operations': 'IN_OPERATIONS',
                'Quality Assurance': 'QUALITY_ASSURANCE',
                'Finalized': 'FINALIZED'
            };

            const backendStatus = statusMap[status] || 'BACKLOG';
            const isFinalized = backendStatus === 'FINALIZED';
            if (isFinalized) {
                const timerState = useTaskStore.getState();
                if (timerState.isRunning && timerState.activeTask?.id === taskId) {
                    await timerState.stopTask();
                }
            }
            const res = await taskService.updateTaskStatus(taskId, backendStatus);

            if (res.success) {
                setState(prev => {
                    const task = prev.tasks.find(t => t.id === taskId);
                    if (!task) return prev;

                    let updatedEmployees = prev.employees;
                    if (status === 'Finalized' && task.status !== 'Finalized') {
                        updatedEmployees = prev.employees.map(e => {
                            if (e.id === task.assigneeId || e.name === task.assignee) {
                                const newScore = Math.min(99, (e.productivityScore || 85) + 2);
                                return { ...e, productivityScore: newScore };
                            }
                            return e;
                        });
                    }

                    return {
                        ...prev,
                        employees: updatedEmployees,
                        tasks: prev.tasks.map(t => t.id === taskId ? {
                            ...t,
                            status: mapStatus(status),
                            progress: progress ?? (status === 'Finalized' ? 100 : (status === 'Quality Assurance' ? 80 : (status === 'In Operations' ? 40 : 0)))
                        } : t)
                    };
                });
                if (status === 'Finalized') {
                    addNotification(`Task finalized! Productivity score increased for assignee.`, 'success');
                }
            }
        } catch (error) {
            console.error('Failed to update task status:', error);
        }
    }, [addNotification]);

    const deleteTask = useCallback(async (id) => {
        try {
            const res = await taskService.deleteTask(id);
            if (res.success) {
                setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
                addNotification('Task deleted', 'info');
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
            // Error is handled by apiClient global toast
        }
    }, [addNotification]);

    const updateTask = useCallback(async (id, taskData) => {
        try {
            const statusMap = {
                'Backlog': 'BACKLOG',
                'In Operations': 'IN_OPERATIONS',
                'Quality Assurance': 'QUALITY_ASSURANCE',
                'Finalized': 'FINALIZED',
                // Also accept uppercase as keys
                'BACKLOG': 'BACKLOG',
                'IN_OPERATIONS': 'IN_OPERATIONS',
                'QUALITY_ASSURANCE': 'QUALITY_ASSURANCE',
                'FINALIZED': 'FINALIZED'
            };
            const backendPayload = {
                name: taskData.title,
                priority: taskData.priority?.toUpperCase() || 'MEDIUM',
                status: statusMap[taskData.status] || taskData.status || undefined,
                dueDate: taskData.dueDate && taskData.dueDate !== 'No Date' ? new Date(taskData.dueDate).toISOString() : undefined,
                employeeId: taskData.assigneeId || undefined,
            };
            const isFinalized = backendPayload.status === 'FINALIZED';
            if (isFinalized) {
                const timerState = useTaskStore.getState();
                if (timerState.isRunning && timerState.activeTask?.id === id) {
                    await timerState.stopTask();
                }
            }
            const res = await taskService.updateTask(id, backendPayload);
            if (res.success) {
                setState(prev => ({
                    ...prev,
                    tasks: prev.tasks.map(t => {
                        if (t.id === id) {
                            const updatedStatus = mapStatus(taskData.status || t.status);
                            return {
                                ...t,
                                ...taskData,
                                status: updatedStatus,
                                progress: taskData.progress ?? (updatedStatus === 'Finalized' ? 100 : (updatedStatus === 'Quality Assurance' ? 80 : (updatedStatus === 'In Operations' ? 40 : t.progress)))
                            };
                        }
                        return t;
                    })
                }));
                addNotification(`Task "${taskData.title}" updated`, 'success');
            }
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }, [addNotification]);

    // Projects
    const addProject = useCallback((project) => {
        const id = Date.now();
        const p = {
            ...project,
            id,
            progress: 0,
            color: project.color || 'bg-indigo-500',
            status: project.status || 'Planning',
            taskCount: 0
        };

        setState(prev => ({
            ...prev,
            projects: [p, ...prev.projects]
        }));
        addNotification(`Project "${project.name}" created successfully`, 'success');
    }, [addNotification]);

    // Screenshots
    const deleteScreenshot = useCallback(async (id) => {
        try {
            await screenshotService.deleteScreenshot(id);
            setState(prev => ({ ...prev, screenshots: prev.screenshots.filter(s => s.id !== id) }));
        } catch (error) {
            console.error('Failed to delete screenshot:', error);
            throw error;
        }
    }, []);

    // Location / Geofences
    const addGeofence = useCallback((zone) => {
        setState(prev => ({ ...prev, geofences: [...prev.geofences, { ...zone, id: Date.now() }] }));
        addNotification('Geofence zone added', 'success');
    }, [addNotification]);

    const toggleGeofence = useCallback((id) => {
        setState(prev => ({ ...prev, geofences: prev.geofences.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g) }));
    }, []);

    // Leave
    const addLeaveRequest = useCallback((request) => {
        const r = { id: Date.now(), ...request, status: 'Pending', color: 'bg-amber-50 text-amber-600' };
        setState(prev => ({ ...prev, leaveRequests: [r, ...prev.leaveRequests] }));
        addNotification(`Leave request for ${request.name} submitted`, 'success');
    }, [addNotification]);

    const updateLeaveStatus = useCallback((id, status) => {
        const color = status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600';
        setState(prev => ({ ...prev, leaveRequests: prev.leaveRequests.map(r => r.id === id ? { ...r, status, color } : r) }));
        addNotification(`Leave status updated to ${status}`, 'info');
    }, [addNotification]);

    const deleteLeaveRequest = useCallback((id) => {
        setState(prev => ({ ...prev, leaveRequests: prev.leaveRequests.filter(r => r.id !== id) }));
    }, []);

    // Alerts
    const dismissAlert = useCallback(async (id) => {
        setState(prev => ({ ...prev, alerts: prev.alerts.map(a => a.id === id ? { ...a, read: true } : a) }));
        try {
            await alertService.dismissAlert(id);
        } catch (e) {
            console.error('Failed to dismiss alert:', e);
        }
    }, []);

    const dismissAllAlerts = useCallback(async () => {
        setState(prev => ({ ...prev, alerts: prev.alerts.map(a => ({ ...a, read: true })) }));
        try {
            await alertService.dismissAllAlerts();
        } catch (e) {
            console.error('Failed to dismiss all alerts:', e);
        }
    }, []);

    // Compliance
    const updateComplianceSetting = useCallback((key, value) => {
        setState(prev => ({ ...prev, complianceSettings: { ...prev.complianceSettings, [key]: value } }));
        addNotification(`Compliance setting "${key}" updated`, 'success');
    }, [addNotification]);

    // Date filter
    const setSelectedDate = useCallback((date) => {
        setState(prev => ({ ...prev, selectedDate: date }));
    }, []);

    // Notifications
    const markAllNotificationsRead = useCallback(async () => {
        setState(prev => ({
            ...prev,
            notifications: prev.notifications.map(n => ({ ...n, unread: false })),
            alerts: prev.alerts.map(a => ({ ...a, read: true }))
        }));
        try {
            await notificationService.markAllAsRead();
            await alertService.dismissAllAlerts();
        } catch (e) {
            console.error('Failed to mark all notifications read:', e);
        }
    }, []);

    const markNotificationAsRead = useCallback(async (id) => {
        setState(prev => ({
            ...prev,
            notifications: prev.notifications.map(n => n.id === id ? { ...n, unread: false } : n),
            alerts: prev.alerts.map(a => (`alert_${a.id}` === id || String(a.id) === String(id)) ? { ...a, read: true } : a)
        }));
        try {
            if (String(id).startsWith('alert_')) {
                const rawAlertId = String(id).replace('alert_', '');
                await alertService.dismissAlert(rawAlertId);
            } else {
                await notificationService.markAsRead(id);
            }
        } catch (e) {
            console.error('Failed to mark notification read:', e);
        }
    }, []);

    const deleteNotification = useCallback(async (id) => {
        const rawAlertId = String(id).startsWith('alert_') ? String(id).replace('alert_', '') : id;
        setState(prev => ({
            ...prev,
            notifications: prev.notifications.filter(n => String(n.id) !== String(id) && String(n.id) !== String(rawAlertId)),
            alerts: prev.alerts.filter(a => `alert_${a.id}` !== id && String(a.id) !== String(id) && String(a.id) !== String(rawAlertId))
        }));
        try {
            if (String(id).startsWith('alert_')) {
                await alertService.deleteAlert(rawAlertId).catch(() => {});
                await notificationService.deleteNotification(rawAlertId).catch(() => {});
            } else {
                await notificationService.deleteNotification(id).catch(() => {});
                await alertService.deleteAlert(id).catch(() => {});
            }
        } catch (e) {
            console.error('Failed to delete notification:', e);
        }
    }, []);

    const deleteAllNotifications = useCallback(async () => {
        setState(prev => ({
            ...prev,
            notifications: [],
            alerts: []
        }));
        try {
            // Also clean local storage cache
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    parsed.notifications = [];
                    parsed.alerts = [];
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                } catch (pe) {}
            }
            await Promise.allSettled([
                notificationService.deleteAllNotifications(),
                alertService.deleteAllAlerts()
            ]);
        } catch (e) {
            console.error('Failed to delete all notifications:', e);
        }
    }, []);

    // Goals Actions
    const addGoal = useCallback(async (goalData) => {
        try {
            const res = await goalService.createGoal(goalData);
            if (res.success) {
                setState(prev => ({ ...prev, goals: [res.data, ...prev.goals] }));
                addNotification(`Goal "${goalData.title}" set`, 'success');
                return res.data;
            }
        } catch (error) {
            console.error('Failed to add goal:', error);
            // Error is handled by apiClient global toast
        }
    }, [addNotification]);

    const deleteGoal = useCallback(async (id) => {
        try {
            const res = await goalService.deleteGoal(id);
            if (res.success) {
                setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
                addNotification('Goal deleted', 'info');
            }
        } catch (error) {
            console.error('Failed to delete goal:', error);
            // Error is handled by apiClient global toast
        }
    }, [addNotification]);

    const updateGoal = useCallback(async (id, goalData) => {
        try {
            const res = await goalService.updateGoal(id, goalData);
            if (res.success) {
                setState(prev => ({
                    ...prev,
                    goals: prev.goals.map(g => g.id === id ? res.data : g)
                }));
                addNotification(`Goal "${goalData.title}" updated`, 'success');
            }
        } catch (error) {
            console.error('Failed to update goal:', error);
            // Error is handled by apiClient global toast
        }
    }, [addNotification]);

    // CheckIns
    const addCheckIn = useCallback((checkIn) => {
        setState(prev => ({ ...prev, checkIns: [{ ...checkIn, id: Date.now() }, ...prev.checkIns] }));
    }, []);

    // Filtered data based on role
    const filteredData = useMemo(() => {
        const currentEmployees = stats.empMetrics;
        const targetEmail = user?.email;
        const currentEmpId = user?.employeeId || user?.id;
        const currentEmpName = (user?.fullName || user?.name || '').toLowerCase().trim();
        const currentRole = (role || '').toUpperCase();

        // 1. Scoped alerts: strictly role-separated
        let scopedAlerts = state.alerts || [];
        if (currentRole === 'EMPLOYEE') {
            scopedAlerts = scopedAlerts.filter(a => {
                if (currentEmpId && String(a.employeeId) === String(currentEmpId)) return true;
                if (targetEmail && a.employeeEmail === targetEmail) return true;
                if (currentEmpName) {
                    const aName = (a.employeeName || '').toLowerCase().trim();
                    if (aName && aName === currentEmpName) return true;
                    if (a.message && a.message.toLowerCase().includes(currentEmpName)) return true;
                }
                return false;
            });
        } else if (currentRole === 'MANAGER') {
            const myTeam = state.employees.filter(e => {
                if (user?.teamId && e.teamId === user?.teamId) return true;
                if (user?.team && (e.team === user?.team || e.teamName === user?.team)) return true;
                if (String(e.id) === String(currentEmpId)) return true;
                return false;
            });
            const myTeamIds = new Set(myTeam.map(e => String(e.id)));
            const myTeamNames = myTeam.map(e => (e.fullName || e.name || '').toLowerCase().trim()).filter(Boolean);

            scopedAlerts = scopedAlerts.filter(a => {
                if (currentEmpId && String(a.employeeId) === String(currentEmpId)) return true;
                if (myTeamIds.has(String(a.employeeId))) return true;
                if (user?.teamId && a.teamId === user?.teamId) return true;
                if (user?.team && (a.team || '').toLowerCase() === user?.team.toLowerCase()) return true;
                const aName = (a.employeeName || '').toLowerCase().trim();
                if (aName && myTeamNames.includes(aName)) return true;
                return false;
            });
        }

        // 2. Synthesize alert notifications so all alert messages appear in the Header Bell dropdown
        const alertNotifications = scopedAlerts.map(a => ({
            id: `alert_${a.id}`,
            alertId: a.id,
            title: a.title || (a.severity === 'critical' ? 'Critical Alert' : (a.severity === 'warning' ? 'Inactivity Alert' : 'System Alert')),
            description: a.message || `Employee ${a.employeeName || 'Staff'} alert notification.`,
            type: a.severity === 'critical' ? 'alert' : (a.severity === 'warning' ? 'warning' : 'info'),
            time: a.date || (a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
            unread: !a.read,
            link: currentRole === 'EMPLOYEE' ? null : '/alerts',
            createdAt: a.createdAt || a.date || new Date().toISOString()
        }));

        // 3. Merge alerts with state.notifications and deduplicate
        const combinedNotifs = [...alertNotifications, ...(state.notifications || [])];
        const seenNotif = new Set();
        const mergedNotifications = [];
        for (const n of combinedNotifs) {
            const key = n.id ? String(n.id) : `${n.title}_${n.description}`;
            if (!seenNotif.has(key)) {
                seenNotif.add(key);
                mergedNotifications.push(n);
            }
        }

        // 4. Role-specific notification filtering
        if (currentRole === 'EMPLOYEE') {
            const myEmpId = String(user?.employeeId || user?.employee?.id || user?.id || '');
            const myEmail = (user?.email || '').toLowerCase().trim();
            const myFullName = (user?.fullName || user?.name || user?.employee?.fullName || '').toLowerCase().trim();
            const myFirstName = myFullName.split(' ')[0] || '';
            const myUserId = String(user?.userId || user?.id || '');

            const filteredEmployees = currentEmployees.filter(e => {
                if (myEmpId && String(e.id) === myEmpId) return true;
                if (myEmail && (e.email || '').toLowerCase() === myEmail) return true;
                return false;
            });
            const myEmp = filteredEmployees[0];
            const myId = String(myEmp?.id || user?.id || '');

            const employeeFilteredNotifs = mergedNotifications.filter(n => {
                // Keep all alert-synthesized notifications (they are already scoped to this employee)
                if (String(n.id).startsWith('alert_') || n.alertId) return true;

                const title = (n.title || '').toLowerCase();
                const desc = (n.description || '').toLowerCase();

                // Exclude all admin/manager system configurations
                if (title.includes('compliance setting') || title.includes('geofence') ||
                    title.includes('employee added') || title.includes('employee removed') ||
                    title.includes('team created') || title.includes('team removed') ||
                    title.includes('goal defined') || title.includes('setting updated') ||
                    title.includes('live screen stream') || title.includes('screenshot from') ||
                    title.includes('employees merged')) {
                    return false;
                }

                // If explicit targetUserId is present, check against employee's IDs
                if (n.targetUserId) {
                    const tId = String(n.targetUserId);
                    if (tId === myId || tId === myEmpId || tId === myUserId) return true;
                    return false; // Targeted to someone else!
                }

                // If metadata has employeeId, check if it matches myId or myEmpId
                if (n.metadata) {
                    const metaStr = typeof n.metadata === 'string' ? n.metadata : JSON.stringify(n.metadata);
                    if ((myEmpId && metaStr.includes(myEmpId)) || (myId && metaStr.includes(myId)) || (myUserId && metaStr.includes(myUserId))) return true;
                }

                // Employees must NEVER see anyone (coworker or manager) going online or offline
                if (title.includes('went online') || title.includes('went offline') ||
                    desc.includes('went online') || desc.includes('went offline')) {
                    return false;
                }

                // Personal work session / clock-in / clock-out: only for self
                const isSessionEvent = title.includes('work session') || title.includes('clocked in') ||
                    title.includes('clocked out') || title.includes('checked in') ||
                    title.includes('went on break') || title.includes('returned from break') ||
                    title.includes('login successful') ||
                    desc.includes('clocked in') || desc.includes('clocked out');

                if (isSessionEvent) {
                    const mentionsMyId = (myEmpId && (title.includes(myEmpId.toLowerCase()) || desc.includes(myEmpId.toLowerCase()))) ||
                                         (myId && (title.includes(myId.toLowerCase()) || desc.includes(myId.toLowerCase())));
                    const mentionsMyName = myFullName && (title.includes(myFullName) || desc.includes(myFullName));
                    const isGenericSelf = !desc.includes('employee ') && (title.includes('work session started') || title.includes('work session ended'));
                    return Boolean(mentionsMyId || mentionsMyName || isGenericSelf);
                }

                // If description contains a raw UUID of someone else, filter out
                if (desc.includes('employee ') && !desc.includes(myId) && !desc.includes(myEmpId) && (!myFullName || !desc.includes(myFullName))) {
                    return false;
                }

                // Keep personal task assignments
                if (title.includes('assigned to you') || title.includes('your team was changed')) {
                    return true;
                }

                // Keep announcements / broadcasts
                if (n.type === 'announcement' || n.type === 'broadcast' || n.type === 'general') return true;

                // Explicit target for this employee
                if (n.targetUserId && (String(n.targetUserId) === myEmpId || String(n.targetUserId) === myUserId || String(n.targetUserId) === myId)) {
                    return true;
                }

                return false;
            }).map(n => {
                // Clean up any raw UUID in descriptions for pleasant UI
                let cleanDesc = n.description || '';
                if (myEmpId && cleanDesc.includes(myEmpId)) {
                    cleanDesc = cleanDesc.replace(new RegExp(`Employee\\s+${myEmpId}`, 'gi'), 'You');
                    cleanDesc = cleanDesc.replace(new RegExp(myEmpId, 'gi'), 'you');
                }
                return { ...n, description: cleanDesc };
            });

            return {
                employees: filteredEmployees,
                tasks: state.tasks, // Server already filters tasks for employees
                projects: state.projects.filter(p => p.memberIds?.includes(filteredEmployees[0]?.id || myEmpId)),
                goals: state.goals.filter(g => g.stakeholders?.some(s => s.employeeId === (filteredEmployees[0]?.id || myEmpId))),
                teams: [],
                activityLogs: state.activityLogs.filter(l => l.employeeId === (filteredEmployees[0]?.id || myEmpId)),
                alerts: scopedAlerts,
                notifications: employeeFilteredNotifs
            };
        }

        if (currentRole === 'MANAGER') {
            const myTeam = state.employees.filter(e => {
                if (user?.teamId && e.teamId === user?.teamId) return true;
                if (user?.team && (e.team === user?.team || e.teamName === user?.team)) return true;
                if (String(e.id) === String(currentEmpId)) return true;
                return false;
            });
            const myTeamIds = new Set(myTeam.map(e => String(e.id)));
            const myTeamNames = myTeam.map(e => (e.fullName || e.name || '').toLowerCase().trim()).filter(Boolean);
            const myEmpId = String(user?.employeeId || currentEmpId || '');
            const myUserId = String(user?.userId || user?.id || '');

            const managerFilteredNotifs = mergedNotifications.filter(n => {
                // Keep team alerts (already scoped)
                if (String(n.id).startsWith('alert_') || n.alertId) return true;

                const title = (n.title || '').toLowerCase();
                const desc = (n.description || '').toLowerCase();

                // Exclude admin-only system config modifications
                if (title.includes('compliance setting') || title.includes('geofence') ||
                    title.includes('setting updated') || title.includes('employees merged')) {
                    return false;
                }

                // Exclude other staff's personal team change messages
                if (title.includes('your team was changed') && !desc.includes(currentEmpName)) {
                    return false;
                }

                // If targeted to the manager themselves:
                if (n.targetUserId) {
                    const tId = String(n.targetUserId);
                    if (tId === myEmpId || tId === myUserId) return true;
                    // If targeted to an employee in this manager's team:
                    if (myTeamIds.has(tId)) return true;
                    // Otherwise targeted to someone outside this team!
                    return false;
                }

                // If metadata has employeeId:
                if (n.metadata) {
                    const metaStr = typeof n.metadata === 'string' ? n.metadata : JSON.stringify(n.metadata);
                    if (myEmpId && metaStr.includes(myEmpId)) return true;
                    const matchesTeamMember = Array.from(myTeamIds).some(id => metaStr.includes(id));
                    if (matchesTeamMember) return true;
                }

                // Check-in / clock-out / status events: only show if in manager's team or manager themselves
                const isStatusEvent = title.includes('went online') || title.includes('went offline') ||
                    title.includes('clocked in') || title.includes('clocked out') ||
                    title.includes('checked in') || desc.includes('clocked in') || desc.includes('clocked out') ||
                    title.includes('went on break') || title.includes('returned from break') ||
                    title.includes('work session') || title.includes('break started') || title.includes('break ended');

                if (isStatusEvent) {
                    const mentionsTeamMember = myTeamNames.some(name => title.includes(name) || desc.includes(name));
                    const mentionsTeamId = Array.from(myTeamIds).some(id => title.includes(id) || desc.includes(id));
                    const mentionsMe = (currentEmpName && (title.includes(currentEmpName) || desc.includes(currentEmpName))) ||
                                       (currentEmpId && (title.includes(String(currentEmpId)) || desc.includes(String(currentEmpId))));
                    return mentionsTeamMember || mentionsTeamId || mentionsMe;
                }

                // Screenshot notifications: only show if from this manager's team member
                if (title.includes('screenshot from')) {
                    const mentionsTeamMember = myTeamNames.some(name => title.includes(name) || desc.includes(name));
                    const mentionsTeamId = Array.from(myTeamIds).some(id => title.includes(id) || desc.includes(id));
                    return mentionsTeamMember || mentionsTeamId;
                }

                // Task events: only show if assigned to team member or manager
                if (title.includes('task')) {
                    const mentionsTeamMember = myTeamNames.some(name => title.includes(name) || desc.includes(name));
                    const mentionsManager = currentEmpName && (title.includes(currentEmpName) || desc.includes(currentEmpName));
                    return mentionsTeamMember || mentionsManager;
                }

                // Keep announcements / broadcasts
                if (n.type === 'announcement' || n.type === 'broadcast' || n.type === 'general') {
                    return true;
                }

                // Exclude raw employee UUIDs not in this manager's team
                if (desc.includes('employee ')) {
                    const matchesMyTeam = Array.from(myTeamIds).some(id => desc.includes(id));
                    return matchesMyTeam;
                }

                // If it's a generic notification not belonging to other employees
                if (!n.targetUserId && !n.metadata) {
                    return true;
                }

                return false;
            });

            return {
                employees: currentEmployees.filter(e => myTeamIds.has(String(e.id)) || String(e.id) === String(currentEmpId) || String(e.email) === String(user?.email)),
                tasks: state.tasks,
                projects: state.projects,
                goals: state.goals,
                teams: state.teams.filter(t => !user?.teamId || t.id === user?.teamId),
                activityLogs: state.activityLogs.filter(l => myTeamIds.has(String(l.employeeId)) || String(l.employeeId) === String(currentEmpId)),
                alerts: scopedAlerts,
                notifications: managerFilteredNotifs
            };
        }

        // ADMIN: Sees all organization-level administrative notifications
        const adminFilteredNotifs = mergedNotifications.filter(n => {
            const title = (n.title || '').toLowerCase();
            // Don't show personal employee self-toasts (e.g. personal "Your team was changed")
            if (title.includes('your team was changed')) return false;
            return true;
        });

        return {
            employees: currentEmployees,
            tasks: state.tasks,
            projects: state.projects,
            goals: state.goals,
            teams: state.teams,
            activityLogs: state.activityLogs,
            alerts: scopedAlerts,
            notifications: adminFilteredNotifs
        };
    }, [state.alerts, state.notifications, state.tasks, state.projects, state.goals, state.teams, state.activityLogs, role, isAuthenticated, stats.empMetrics, user]);

    const contextValue = useMemo(() => ({
        // State
        ...state,
        ...filteredData, // Inject filtered lists
        stats,
        isLoading,
        // Actions
        addEmployee, updateEmployee, deleteEmployee, mergeEmployees,
        addTeam, updateTeam, deleteTeam,
        toggleTimer, startTimer, stopTimer, pauseTimer,
        startTask, stopTask, 
        timer: {
            isRunning: taskTimer.isRunning,
            currentTask: taskTimer.activeTask?.id || null,
            activeTask: taskTimer.activeTask,
            seconds: taskTimer.seconds,
            startTime: taskTimer.startTime
        },
        addTimeEntry, updateTimeEntry, deleteTimeEntry,
        addTask, updateTaskStatus, deleteTask, updateTask,
        addProject,
        addGoal, deleteGoal, updateGoal,
        deleteScreenshot,
        addGeofence, toggleGeofence,
        addLeaveRequest, updateLeaveStatus, deleteLeaveRequest,
        dismissAlert, dismissAllAlerts,
        updateComplianceSetting,
        setSelectedDate,
        addCheckIn,
        addNotification, markAllNotificationsRead, markNotificationAsRead, deleteNotification, deleteAllNotifications,
        syncNotifications, syncAlerts,
        socket: socketInstance,
        // Live Screening
        startLiveScreen: (employeeId) => {
            if (socketInstance) {
                socketInstance.emit('live:request', { employeeId });
                addNotification('Requested live screen stream', 'info');
            }
        },
        stopLiveScreen: (employeeId) => {
            if (socketInstance) {
                socketInstance.emit('live:stop', { employeeId });
                addNotification('Stopped live screen stream', 'info');
            }
        }
    }), [
        state, filteredData, stats, isLoading, socketInstance,
        addEmployee, updateEmployee, deleteEmployee, mergeEmployees,
        addTeam, updateTeam, deleteTeam,
        toggleTimer, startTimer, stopTimer, pauseTimer,
        startTask, stopTask, taskTimer,
        addTimeEntry, updateTimeEntry, deleteTimeEntry,
        addTask, updateTaskStatus, deleteTask, updateTask,
        addProject, addGoal, deleteGoal, updateGoal, deleteScreenshot, addGeofence, toggleGeofence,
        addLeaveRequest, updateLeaveStatus, deleteLeaveRequest,
        dismissAlert, dismissAllAlerts, updateComplianceSetting,
        setSelectedDate, addCheckIn,
        addNotification, markAllNotificationsRead, markNotificationAsRead, deleteNotification, deleteAllNotifications,
        syncNotifications, syncAlerts,
    ]);

    return (
        <RealTimeContext.Provider value={contextValue}>
            {children}
        </RealTimeContext.Provider>
    );
}

export const useRealTime = () => useContext(RealTimeContext);
