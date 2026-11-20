import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';
import { toast } from '../utils/toastManager';
import { broadcastStaffStatus } from '../utils/staffSync';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            role: null, // "ADMIN" | "MANAGER" | "EMPLOYEE"
            isAuthenticated: false,
            token: null,
            activeAttendance: null, // Track active work session
            isClockedIn: false,
            isOnBreak: false,
            isTrackerActive: false,
            isIdlePaused: false,
            frozenIdleSeconds: null,
            idlePauseStartTime: null,

            setSession: (userData) => {
                const user = userData.user || userData;
                const empStatus = user.status || user.employee?.status;
                const activeAtt = user.activeAttendance !== undefined ? user.activeAttendance : get().activeAttendance;
                const hasOpenSession = !!activeAtt && !activeAtt.clockOut;
                set({
                    user: user,
                    role: user.role?.toUpperCase(),
                    isAuthenticated: true,
                    token: localStorage.getItem('token'),
                    agentStatus: user.agentStatus,
                    activeAttendance: hasOpenSession ? activeAtt : null,
                    isClockedIn: hasOpenSession,
                    isOnBreak: empStatus === 'BREAK' || (hasOpenSession && !!activeAtt.openBreak),
                    isIdlePaused: false,
                    frozenIdleSeconds: null,
                    idlePauseStartTime: null
                });
            },

            login: async (email, password) => {
                try {
                    const response = await authService.login(email, password);
                    if (response.success) {
                        const userData = response.data.user;
                        const activeAtt = userData.activeAttendance;
                        const hasOpenSession = !!activeAtt && !activeAtt.clockOut;
                        set({
                            user: userData,
                            role: userData.role?.toUpperCase(),
                            isAuthenticated: true,
                            token: response.data.token,
                            agentStatus: userData.agentStatus,
                            activeAttendance: hasOpenSession ? activeAtt : null,
                            isClockedIn: hasOpenSession,
                            isOnBreak: userData.status === 'BREAK' || (hasOpenSession && !!activeAtt.openBreak),
                            isTrackerActive: false,
                            isIdlePaused: false,
                            frozenIdleSeconds: null,
                            idlePauseStartTime: null
                        });
                        toast.success('Login successful');
                        return response.data;
                    }
                    throw new Error(response.message);
                } catch (error) {
                    throw error;
                }
            },

            logout: async () => {
                await authService.logout();
                set({
                    user: null,
                    role: null,
                    isAuthenticated: false,
                    token: null,
                    activeAttendance: null,
                    isClockedIn: false,
                    isOnBreak: false,
                    isTrackerActive: false,
                    isIdlePaused: false,
                    frozenIdleSeconds: null,
                    idlePauseStartTime: null
                });
            },

            switchRole: (newRole) => {
                set((state) => ({
                    role: newRole,
                    user: state.user ? { ...state.user, role: newRole } : null
                }));
            },

            // Attendance Actions
            clockIn: async () => {
                const { default: attendanceService } = await import('../services/attendanceService');
                const empId = get().user?.employeeId || get().user?.employee?.id || get().user?.id;
                try {
                    const response = await attendanceService.clockIn();
                    if (response.success && response.data) {
                        set({
                            activeAttendance: response.data,
                            isClockedIn: true,
                            isOnBreak: false,
                            isIdlePaused: false,
                            frozenIdleSeconds: null,
                            idlePauseStartTime: null
                        });
                        if (empId) {
                            broadcastStaffStatus({
                                employeeId: empId,
                                status: 'online',
                                isIdle: false,
                                isOnBreak: false,
                                activeApp: 'Active Work',
                                currentActivity: 'Active / Logged In'
                            });
                            import('../hooks/useSocket').then(({ getSharedSocket }) => {
                                const s = getSharedSocket(get().token || localStorage.getItem('token'));
                                if (s) s.emit('employee:status_override', { status: 'ONLINE' });
                            }).catch(() => {});
                        }
                        toast.success('Work session started');
                    }
                    return response;
                } catch (error) {
                    const errMsg = error.response?.data?.message || error.message || '';
                    if (errMsg.toLowerCase().includes('already clocked in')) {
                        // User has an existing active session in DB: seamlessly sync to clocked in!
                        const nowIso = new Date().toISOString();
                        const existingAttendance = get().activeAttendance?.clockIn ? get().activeAttendance : {
                            clockIn: nowIso,
                            openBreak: null,
                            totalBreakSeconds: 0
                        };
                        set({
                            activeAttendance: existingAttendance,
                            isClockedIn: true,
                            isOnBreak: false,
                            isIdlePaused: false,
                            frozenIdleSeconds: null,
                            idlePauseStartTime: null
                        });
                        if (empId) {
                            broadcastStaffStatus({
                                employeeId: empId,
                                status: 'online',
                                isIdle: false,
                                isOnBreak: false,
                                activeApp: 'Active Work',
                                currentActivity: 'Active / Logged In'
                            });
                            import('../hooks/useSocket').then(({ getSharedSocket }) => {
                                const s = getSharedSocket(get().token || localStorage.getItem('token'));
                                if (s) s.emit('employee:status_override', { status: 'ONLINE' });
                            }).catch(() => {});
                        }
                        toast.success('Work session resumed');
                        return { success: true, data: existingAttendance };
                    }
                    toast.error(errMsg || 'Failed to clock in');
                    throw error;
                }
            },

            clockOut: async () => {
                const { default: attendanceService } = await import('../services/attendanceService');
                const empId = get().user?.employeeId || get().user?.employee?.id || get().user?.id;
                // Immediate synchronous reset so UI cards & buttons reset with 0 latency
                set({
                    activeAttendance: null,
                    isClockedIn: false,
                    isOnBreak: false,
                    isTrackerActive: false,
                    isIdlePaused: false,
                    frozenIdleSeconds: null,
                    idlePauseStartTime: null
                });
                if (empId) {
                    broadcastStaffStatus({
                        employeeId: empId,
                        status: 'offline',
                        isIdle: false,
                        isOnBreak: false,
                        activeApp: 'Offline',
                        currentActivity: 'Offline'
                    });
                    import('../hooks/useSocket').then(({ getSharedSocket }) => {
                        const s = getSharedSocket(get().token || localStorage.getItem('token'));
                        if (s) s.emit('employee:status_override', { status: 'OFFLINE' });
                    }).catch(() => {});
                }
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('stop-web-tracker'));
                }
                try {
                    const response = await attendanceService.clockOut();
                    toast.success('Work session ended');
                    return response;
                } catch (error) {
                    // Gracefully handled - local session already reset
                    toast.success('Work session ended');
                    return { success: true };
                }
            },

            toggleBreak: async () => {
                const { default: attendanceService } = await import('../services/attendanceService');
                const empId = get().user?.employeeId || get().user?.employee?.id || get().user?.id;
                const isOnBreak = get().isOnBreak;
                const activeAttendance = get().activeAttendance;
                try {
                    let response;
                    if (!isOnBreak) {
                        response = await attendanceService.startBreak();
                        const breakStart = response.data?.openBreak || response.data?.timestamp || new Date().toISOString();
                        set({
                            isOnBreak: true,
                            activeAttendance: activeAttendance ? {
                                ...activeAttendance,
                                openBreak: breakStart
                            } : {
                                clockIn: new Date().toISOString(),
                                openBreak: breakStart,
                                totalBreakSeconds: 0
                            }
                        });
                        if (empId) {
                            broadcastStaffStatus({
                                employeeId: empId,
                                status: 'break',
                                isIdle: false,
                                isOnBreak: true,
                                activeApp: 'On Break',
                                currentActivity: 'On Break'
                            });
                            import('../hooks/useSocket').then(({ getSharedSocket }) => {
                                const s = getSharedSocket(get().token || localStorage.getItem('token'));
                                if (s) s.emit('employee:status_override', { status: 'BREAK' });
                            }).catch(() => {});
                        }
                        toast.success('Break started');
                    } else {
                        response = await attendanceService.endBreak();
                        const breakDuration = response.data?.duration || 0;
                        const prevBreakSec = activeAttendance?.totalBreakSeconds || 0;
                        set({
                            isOnBreak: false,
                            activeAttendance: activeAttendance ? {
                                ...activeAttendance,
                                openBreak: null,
                                totalBreakSeconds: prevBreakSec + breakDuration
                            } : null
                        });
                        if (empId) {
                            broadcastStaffStatus({
                                employeeId: empId,
                                status: 'online',
                                isIdle: false,
                                isOnBreak: false,
                                activeApp: 'Active Work',
                                currentActivity: 'Active / Logged In'
                            });
                            import('../hooks/useSocket').then(({ getSharedSocket }) => {
                                const s = getSharedSocket(get().token || localStorage.getItem('token'));
                                if (s) s.emit('employee:status_override', { status: 'ONLINE' });
                            }).catch(() => {});
                        }
                        toast.success('Break ended');
                    }
                    return response;
                } catch (error) {
                    // Fallback local toggle in case backend throws so the user is never stuck
                    const nowIso = new Date().toISOString();
                    if (!isOnBreak) {
                        set({
                            isOnBreak: true,
                            activeAttendance: activeAttendance ? {
                                ...activeAttendance,
                                openBreak: nowIso
                            } : {
                                clockIn: nowIso,
                                openBreak: nowIso,
                                totalBreakSeconds: 0
                            }
                        });
                        if (empId) {
                            broadcastStaffStatus({
                                employeeId: empId,
                                status: 'break',
                                isIdle: false,
                                isOnBreak: true,
                                activeApp: 'On Break',
                                currentActivity: 'On Break'
                            });
                            import('../hooks/useSocket').then(({ getSharedSocket }) => {
                                const s = getSharedSocket(get().token || localStorage.getItem('token'));
                                if (s) s.emit('employee:status_override', { status: 'BREAK' });
                            }).catch(() => {});
                        }
                        toast.success('Break started');
                    } else {
                        set({
                            isOnBreak: false,
                            activeAttendance: activeAttendance ? {
                                ...activeAttendance,
                                openBreak: null
                            } : null
                        });
                        if (empId) {
                            broadcastStaffStatus({
                                employeeId: empId,
                                status: 'online',
                                isIdle: false,
                                isOnBreak: false,
                                activeApp: 'Active Work',
                                currentActivity: 'Active / Logged In'
                            });
                            import('../hooks/useSocket').then(({ getSharedSocket }) => {
                                const s = getSharedSocket(get().token || localStorage.getItem('token'));
                                if (s) s.emit('employee:status_override', { status: 'ONLINE' });
                            }).catch(() => {});
                        }
                        toast.success('Break ended');
                    }
                    return { success: true };
                }
            },
            pauseSessionForIdle: (currentSeconds) => {
                set({
                    isIdlePaused: true,
                    frozenIdleSeconds: currentSeconds,
                    idlePauseStartTime: Date.now()
                });
            },

            resumeSessionFromIdle: () => {
                const { idlePauseStartTime, activeAttendance } = get();
                let pauseDuration = 0;
                if (idlePauseStartTime) {
                    pauseDuration = Math.max(0, Math.floor((Date.now() - idlePauseStartTime) / 1000));
                }
                const prevDeduction = Number(activeAttendance?.totalIdleDeductionSeconds) || 0;
                set({
                    isIdlePaused: false,
                    frozenIdleSeconds: null,
                    idlePauseStartTime: null,
                    activeAttendance: activeAttendance ? {
                        ...activeAttendance,
                        totalIdleDeductionSeconds: prevDeduction + pauseDuration
                    } : null
                });
            },
            setTrackerActive: (status) => set({ isTrackerActive: status }),

            hasAccess: (moduleKey) => {
                const role = get().role?.toUpperCase();
                const roleModules = {
                    ADMIN: [
                        "dashboard", "realtime", "alerts", "employees", "teams",
                        "screenshots", "timeAttendance", "activity", "projects",
                        "tasks", "agents", "payroll", "compliance", "reports", "settings"
                    ],
                    MANAGER: [
                        "dashboard", "realtime", "alerts", "employees", "teams",
                        "screenshots", "timeAttendance", "activity", "projects",
                        "tasks", "reports"
                    ],
                    EMPLOYEE: [
                        "dashboard", "timeAttendance", "tasks", "projects", "activity"
                    ]
                };
                if (!role) return false;
                return roleModules[role]?.includes(moduleKey) || false;
            }
        }),
        {
            name: 'ems-auth-storage',
        }
    )
);
