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

    const addNotification = useCallback((title, type = 'info') => {
        const n = { id: Date.now(), title, time: 'Just now', type, unread: true };
        setState(prev => ({ ...prev, notifications: [n, ...prev.notifications].slice(0, 50) }));

        // Route to global toast system
        if (type === 'alert' || type === 'error') toast.error(title);
        else if (type === 'success') toast.success(title);
        else if (type === 'warning') toast.warning(title);
        else toast.info(title);
    }, [toast]);

    // Initial Load — merge saved session data (timer, notifications, user-added records)
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setState(prev => ({
                    ...prev,
                    // Only restore user-added / ephemeral data — NOT the seed data
                    employees: parsed.employees || prev.employees,
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
    }, []);

    // Restore active task timer for the authenticated employee
    useEffect(() => {
        const empId = user?.employeeId || user?.id;
        if (empId) {
            useTaskStore.getState().restoreActiveTask(empId);
        }
    }, [user?.employeeId, user?.id]);

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
                        const name = emp.fullName || emp.name || 'Unknown User';
                        const st = emp.status?.toLowerCase() || 'offline';
                        return {
                            ...emp,
                            name: name,
                            initials: name.split(' ').map(n => n[0]).join('').toUpperCase(),
                            team: emp.team?.name || emp.team || 'General',
                            accountStatus: st,
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
                    notifications: res.notifications
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

        const handleEmployeeStatus = ({ employeeId, status }) => {
            setState(prev => ({
                ...prev,
                employees: prev.employees.map(e =>
                    e.id === employeeId ? { ...e, status: status.toLowerCase() === 'active' ? 'online' : status.toLowerCase() } : e
                )
            }));
        };

        const handleActivityUpdate = (data) => {
            console.log('RealTimeContext: Activity update received:', data);
            setState(prev => ({
                ...prev,
                employees: prev.employees.map(e => {
                    if (e.id === data.employeeId) {
                        return {
                            ...e,
                            activeApp: data.activeApp,
                            activeWindow: data.activeWindow,
                            idleTime: data.idleTime,
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
            if (currentRole === 'ADMIN' || currentRole === 'MANAGER') {
                addNotification(`New screenshot from ${data.employeeName || 'employee'}`, 'info');
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
            if (currentRole === 'ADMIN' || currentRole === 'MANAGER') {
                const currentEmps = employeesRef.current || [];
                const emp = currentEmps.find(e => String(e.id) === String(data.employeeId));
                const empName = emp ? (emp.fullName || emp.name) : 'An employee';
                if (data.type === 'clock-in') {
                    addNotification(`${empName} checked in`, 'info');
                } else if (data.type === 'clock-out') {
                    addNotification(`${empName} clocked out`, 'info');
                } else if (data.type === 'break-start') {
                    addNotification(`${empName} went on break`, 'info');
                } else if (data.type === 'break-end') {
                    addNotification(`${empName} returned from break`, 'info');
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

        // ─── DEVELOPER 4 REAL-TIME LISTENERS ─────────────────────────────────
        const handleAlertNew = (alertData) => {
            console.log('RealTimeContext: Real-time alert received:', alertData);
            playAlertChime();
            setState(prev => ({
                ...prev,
                alerts: [alertData, ...prev.alerts.filter(a => a.id !== alertData.id)]
            }));
            if (alertData.severity === 'critical') {
                toast.error(alertData.message);
            } else {
                toast.warning(alertData.message);
            }
        };

        const handleNotificationNew = (notifData) => {
            console.log('RealTimeContext: Real-time notification received:', notifData);
            setState(prev => ({
                ...prev,
                notifications: [notifData, ...prev.notifications.filter(n => n.id !== notifData.id)]
            }));
        };

        const handleScreenshotViolation = (violationData) => {
            console.log('RealTimeContext: Real-time violation screenshot:', violationData);
            playAlertChime();
            toast.error(`Security Violation: Prohibited app "${violationData.appName}" accessed by ${violationData.employeeName}!`);
            if (violationData.imageUrl) {
                setState(prev => ({
                    ...prev,
                    screenshots: [{
                        employeeId: violationData.employeeId,
                        employeeName: violationData.employeeName,
                        imageUrl: violationData.imageUrl,
                        capturedAt: violationData.capturedAt || new Date(),
                        productivity: 'UNPRODUCTIVE',
                        isViolation: true
                    }, ...prev.screenshots].slice(0, 50)
                }));
            }
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
                if (currentStatus === 'online') {
                    addNotification(`${emp.fullName || emp.name} went online`, 'info');
                } else if (currentStatus === 'offline') {
                    addNotification(`${emp.fullName || emp.name} went offline`, 'info');
                }
            }
            prevStatuses.current[emp.id] = currentStatus;
        });
    }, [state.employees, role, isLoading, isAuthenticated, addNotification]);

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
        const todayLogs = activityLogs.filter(l => l.date === selectedDate);
        const empMetrics = employees.map(emp => {
            const log = todayLogs.find(l => String(l.employeeId) === String(emp.id));
            const fullName = emp.fullName || emp.name || 'Unknown User';

            // Determine status based on real-time heartbeat (lastSeen)
            let status = 'offline';
            const isOnline = emp.lastSeen ? (new Date() - new Date(emp.lastSeen)) < 10 * 60 * 1000 : false;

            if (isOnline) {
                status = 'online';
                // Refine based on currentActivity or log if needed
                if (emp.currentActivity?.toLowerCase() === 'idle' || (log && log.idleHours > 0 && log.activeHours === 0)) {
                    status = 'idle';
                }
                if (emp.currentActivity?.toLowerCase() === 'break') {
                    status = 'break';
                }
            }

            // Find latest break start time if on break
            let breakStartedAt = log?.breakStartedAt || null;
            let breakHours = log?.breakHours || 0;
            const manualHours = log?.manualHours || 0;
            const activeHours = log?.activeHours || 0;
            const idleHours = log?.idleHours || 0;

            return {
                ...emp,
                name: fullName,
                initials: fullName.split(' ').map(n => n[0]).join('').toUpperCase(),
                team: emp.team?.name || emp.team || 'General',
                status,
                breakStartedAt,
                breakHours,
                manualHours,
                activeHours,
                idleHours,
                totalWorkHours: activeHours + idleHours + manualHours,
                computerActivityHours: activeHours + idleHours,
                productive: log ? `${String(Math.floor(log.productiveHours)).padStart(2, '0')}:${String(Math.round((log.productiveHours % 1) * 60)).padStart(2, '0')}` : '00:00',
                unproductive: log ? `${String(Math.floor(log.unproductiveHours)).padStart(2, '0')}:${String(Math.round((log.unproductiveHours % 1) * 60)).padStart(2, '0')}` : '00:00',
                utilization: log ? log.utilizationPct : (emp.utilizationScore || 0),
                productivity: log ? log.productivityPct : (emp.productivityScore || 0),
                productivityScore: log ? log.productivityPct : (emp.productivityScore || 0),
                utilizationScore: log ? log.utilizationPct : (emp.utilizationScore || 0),
                productiveHours: log?.productiveHours || 0,
                unproductiveHours: log?.unproductiveHours || 0,
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
        setState(prev => ({ ...prev, notifications: prev.notifications.map(n => ({ ...n, unread: false })) }));
        try {
            await notificationService.markAllAsRead();
        } catch (e) {
            console.error('Failed to mark all notifications read:', e);
        }
    }, []);

    const markNotificationAsRead = useCallback(async (id) => {
        setState(prev => ({ ...prev, notifications: prev.notifications.map(n => n.id === id ? { ...n, unread: false } : n) }));
        try {
            await notificationService.markAsRead(id);
        } catch (e) {
            console.error('Failed to mark notification read:', e);
        }
    }, []);

    const deleteNotification = useCallback(async (id) => {
        setState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) }));
        try {
            await notificationService.deleteNotification(id);
        } catch (e) {
            console.error('Failed to delete notification:', e);
        }
    }, []);

    const deleteAllNotifications = useCallback(async () => {
        setState(prev => ({ ...prev, notifications: [] }));
        try {
            await notificationService.deleteAllNotifications();
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

        if (!isAuthenticated || role === 'ADMIN' || role === 'MANAGER') {
            return {
                employees: currentEmployees,
                tasks: state.tasks,
                projects: state.projects,
                goals: state.goals,
                teams: state.teams,
                activityLogs: state.activityLogs,
            };
        }

        if (role === 'EMPLOYEE') {
            const targetEmail = user?.email;
            const filteredEmployees = currentEmployees.filter(e => e.email === targetEmail);
            return {
                employees: filteredEmployees,
                tasks: state.tasks, // Server already filters tasks for employees, don't double-filter here
                projects: state.projects.filter(p => p.memberIds?.includes(filteredEmployees[0]?.id)),
                goals: state.goals.filter(g => g.stakeholders?.some(s => s.employeeId === filteredEmployees[0]?.id)),
                teams: [],
                activityLogs: state.activityLogs.filter(l => l.employeeId === filteredEmployees[0]?.id),
            };
        }

        return { ...state, employees: currentEmployees };
    }, [state, role, isAuthenticated, stats.empMetrics, user]);

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
    ]);

    return (
        <RealTimeContext.Provider value={contextValue}>
            {children}
        </RealTimeContext.Provider>
    );
}

export const useRealTime = () => useContext(RealTimeContext);
