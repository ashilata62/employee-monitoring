import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import taskService from '../services/taskService';
import activityService from '../services/activityService';
import { toast } from '../utils/toastManager';
import { useAuthStore } from './authStore';

// Module-level interval holders (singleton across app)
let tickerInterval = null;
let heartbeatInterval = null;

export function formatDuration(totalSeconds) {
    const sec = Math.max(0, Number(totalSeconds) || 0);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatFriendlyDuration(totalSeconds) {
    const sec = Math.max(0, Number(totalSeconds) || 0);
    if (sec === 0) return '0h';
    if (sec < 60) return `${sec}s`;
    const mins = Math.floor(sec / 60);
    if (sec < 3600) return `${mins}m`;
    const hrs = Math.floor(sec / 3600);
    const remainMins = Math.floor((sec % 3600) / 60);
    return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
}

function startInternalTicker(set, get) {
    if (tickerInterval) clearInterval(tickerInterval);

    // Immediate initial sync
    const initialElapsed = get().getElapsedSeconds();
    set({ seconds: initialElapsed });

    tickerInterval = setInterval(() => {
        const state = get();
        if (state.isRunning && state.startTime) {
            set({ seconds: state.getElapsedSeconds() });
        } else {
            clearInterval(tickerInterval);
            tickerInterval = null;
        }
    }, 1000);
}

function startHeartbeat(set, get) {
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    heartbeatInterval = setInterval(async () => {
        const state = get();
        if (!state.isRunning || !state.activeTask) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
            return;
        }

        try {
            const authUser = useAuthStore.getState().user;
            const employeeId = authUser?.employeeId || authUser?.id || state.assignedEmployeeId;
            const organizationId = authUser?.organizationId || 'default-org-id';

            const currentElapsed = state.getElapsedSeconds();
            const unloggedSeconds = Math.max(0, currentElapsed - (state.lastLoggedSeconds || 0));

            // Behavior A: Heartbeat logs only incremental unlogged seconds (at least 60s)
            if (unloggedSeconds >= 60 && employeeId && state.activeTask?.id) {
                await activityService.logActivity({
                    employeeId,
                    organizationId,
                    activityType: 'ACTIVE',
                    duration: unloggedSeconds,
                    taskId: state.activeTask.id,
                    appWebsite: 'Web Dashboard (Task Heartbeat)'
                });
                // Update lastLoggedSeconds upon successful log so time is never double-counted
                set({ lastLoggedSeconds: (state.lastLoggedSeconds || 0) + unloggedSeconds });
            }
        } catch (err) {
            console.warn('[TaskTimer] Periodic heartbeat failed (will retry next interval without data loss):', err.message);
        }
    }, 60000);
}

function stopInternalTimers() {
    if (tickerInterval) {
        clearInterval(tickerInterval);
        tickerInterval = null;
    }
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

export const useTaskStore = create(
    persist(
        (set, get) => ({
            // --- Task Data State ---
            tasks: [],
            board: {
                BACKLOG: [],
                IN_PROGRESS: [],
                QA: [],
                COMPLETED: []
            },
            loading: false,
            error: null,
            timerActionLoading: false,

            // --- Centralized Timer State ---
            activeTask: null, // { id, title, projectId, projectName }
            isRunning: false,
            startTime: null, // timestamp (epoch ms)
            accumulatedElapsedSeconds: 0,
            lastLoggedSeconds: 0, // Behavior A: tracks seconds already sent to backend to prevent double-counting
            assignedEmployeeId: null,
            seconds: 0, // Current reactive seconds for UI rendering
            taskDurations: {}, // { [taskId]: totalSecondsTracked }

            // --- Accurate Duration Calculation ---
            getElapsedSeconds: () => {
                const state = get();
                if (!state.isRunning || !state.startTime) {
                    return state.accumulatedElapsedSeconds || 0;
                }
                const currentDelta = Math.max(0, Math.floor((Date.now() - state.startTime) / 1000));
                return (state.accumulatedElapsedSeconds || 0) + currentDelta;
            },

            // --- Start Task Action ---
            startTask: (task, customEmployeeId = null) => {
                const state = get();
                const authUser = useAuthStore.getState().user;
                const employeeId = customEmployeeId || authUser?.employeeId || authUser?.id;

                if (!task || !task.id) {
                    toast.error('Invalid task selected');
                    return false;
                }

                if (task.status === 'FINALIZED' || task.status === 'Finalized') {
                    toast.info('Completed tasks cannot be tracked.');
                    return false;
                }

                // Guard against concurrent running tasks
                if (state.isRunning) {
                    if (state.activeTask?.id === task.id) {
                        toast.info(`Task "${state.activeTask.title}" is already tracking.`);
                        return false;
                    }
                    toast.warning(
                        `Task "${state.activeTask?.title || 'Another task'}" is currently running. Please stop it first before starting another task.`
                    );
                    return false;
                }

                const now = Date.now();
                const taskPayload = {
                    id: task.id,
                    title: task.title || task.name || 'Untitled Task',
                    projectId: task.projectId || task.project?.id || null,
                    projectName: task.project || task.project?.name || ''
                };

                set({
                    activeTask: taskPayload,
                    isRunning: true,
                    startTime: now,
                    accumulatedElapsedSeconds: 0,
                    lastLoggedSeconds: 0,
                    assignedEmployeeId: employeeId,
                    seconds: 0
                });

                startInternalTicker(set, get);
                startHeartbeat(set, get);

                toast.success(`Started tracking: ${taskPayload.title}`);
                return true;
            },

            // --- Stop Task Action ---
            stopTask: async () => {
                const state = get();
                if (!state.isRunning && !state.activeTask) {
                    return null;
                }

                const finalSeconds = get().getElapsedSeconds();
                const stoppedTask = state.activeTask;
                // Behavior A: Stop task logs ONLY the remaining unlogged delta seconds
                const unloggedSeconds = Math.max(0, finalSeconds - (state.lastLoggedSeconds || 0));

                stopInternalTimers();

                const prevDuration = (stoppedTask?.id && state.taskDurations?.[stoppedTask.id]) || 0;
                const updatedDurations = stoppedTask?.id ? {
                    ...(state.taskDurations || {}),
                    [stoppedTask.id]: prevDuration + finalSeconds
                } : (state.taskDurations || {});

                // Optimistically stop the timer immediately so the UI responds instantly
                set({
                    activeTask: null,
                    isRunning: false,
                    startTime: null,
                    accumulatedElapsedSeconds: 0,
                    lastLoggedSeconds: 0,
                    seconds: 0,
                    assignedEmployeeId: null,
                    taskDurations: updatedDurations,
                    timerActionLoading: true
                });

                try {
                    // Only log unlogged delta seconds if > 0 (prevents double-counting with heartbeats)
                    if (stoppedTask?.id && unloggedSeconds > 0) {
                        const authUser = useAuthStore.getState().user;
                        const employeeId = authUser?.employeeId || authUser?.id || state.assignedEmployeeId;
                        const organizationId = authUser?.organizationId || 'default-org-id';

                        if (employeeId) {
                            await activityService.logActivity({
                                employeeId,
                                organizationId,
                                activityType: 'ACTIVE',
                                duration: unloggedSeconds,
                                taskId: stoppedTask.id,
                                appWebsite: 'Web Dashboard (Task Complete)'
                            });
                        }
                    }
                    try {
                        await get().fetchBoardTasks();
                    } catch (_) {}
                    toast.success(`Stopped tracking "${stoppedTask?.title || 'Task'}" (${formatDuration(finalSeconds)})`);
                } catch (err) {
                    console.error('[TaskTimer] Failed to log final task duration:', err);
                    toast.error('Task stopped, but activity log failed to sync to server');
                } finally {
                    set({ timerActionLoading: false });
                }

                return { task: stoppedTask, durationSeconds: finalSeconds };
            },

            // --- Restore Active Task on Auth/Refresh ---
            restoreActiveTask: (currentEmployeeId) => {
                const state = get();
                if (!state.activeTask) return;

                // Guard: Do not restore task belonging to a different employee
                if (currentEmployeeId && state.assignedEmployeeId && state.assignedEmployeeId !== currentEmployeeId) {
                    console.log('[TaskTimer] Discarding timer: belongs to different employee');
                    stopInternalTimers();
                    set({
                        activeTask: null,
                        isRunning: false,
                        startTime: null,
                        accumulatedElapsedSeconds: 0,
                        lastLoggedSeconds: 0,
                        seconds: 0,
                        assignedEmployeeId: null
                    });
                    return;
                }

                // If running, compute true elapsed from timestamp and restart tickers
                if (state.isRunning && state.startTime) {
                    const trueElapsed = get().getElapsedSeconds();
                    set({ seconds: trueElapsed });
                    startInternalTicker(set, get);
                    startHeartbeat(set, get);
                    console.log(`[TaskTimer] Restored active task "${state.activeTask.title}" (${trueElapsed}s elapsed)`);
                }
            },

            // --- Existing CRUD Actions (Preserved & Role-Scoped) ---
            fetchTasks: async (employeeId = null) => {
                set({ loading: true, error: null });
                try {
                    const authState = useAuthStore.getState();
                    const targetEmpId = employeeId !== null 
                        ? employeeId 
                        : (authState.role === 'EMPLOYEE' ? (authState.user?.employeeId || authState.user?.id) : null);
                    const response = await taskService.getTasks(targetEmpId);
                    set({ tasks: response.data || [], loading: false });
                } catch (error) {
                    set({ error: error.message, loading: false });
                }
            },

            fetchBoardTasks: async (employeeId = null) => {
                set({ loading: true, error: null });
                try {
                    const authState = useAuthStore.getState();
                    const targetEmpId = employeeId !== null 
                        ? employeeId 
                        : (authState.role === 'EMPLOYEE' ? (authState.user?.employeeId || authState.user?.id) : null);
                    const response = await taskService.getBoardTasks(targetEmpId);
                    set({ board: response.data || {}, loading: false });
                } catch (error) {
                    set({ error: error.message, loading: false });
                }
            },

            createTask: async (taskData) => {
                set({ loading: true, error: null });
                try {
                    const response = await taskService.createTask(taskData);
                    await get().fetchBoardTasks();
                    set({ loading: false });
                    toast.success('Task created successfully');
                    return response.data;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            updateTaskStatus: async (taskId, status) => {
                try {
                    const state = get();
                    const isFinalized = status === 'FINALIZED' || status === 'Finalized';
                    if (isFinalized && state.isRunning && state.activeTask?.id === taskId) {
                        await get().stopTask();
                    }
                    await taskService.updateTaskStatus(taskId, status);
                    await get().fetchBoardTasks();
                    toast.success(isFinalized ? 'Task marked as Completed' : 'Task status updated');
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            },

            deleteTask: async (taskId) => {
                try {
                    await taskService.deleteTask(taskId);
                    await get().fetchBoardTasks();
                    toast.success('Task deleted successfully');
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            },

            updateTask: async (taskId, taskData) => {
                try {
                    await taskService.updateTask(taskId, taskData);
                    await get().fetchBoardTasks();
                    toast.success('Task updated successfully');
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            }
        }),
        {
            name: 'dsp-task-timer-v1',
            partialize: (state) => ({
                activeTask: state.activeTask,
                isRunning: state.isRunning,
                startTime: state.startTime,
                accumulatedElapsedSeconds: state.accumulatedElapsedSeconds,
                lastLoggedSeconds: state.lastLoggedSeconds || 0,
                assignedEmployeeId: state.assignedEmployeeId,
                taskDurations: state.taskDurations
            }),
            onRehydrateStorage: () => (state) => {
                if (state && state.isRunning && state.startTime) {
                    const currentDelta = Math.max(0, Math.floor((Date.now() - state.startTime) / 1000));
                    state.seconds = (state.accumulatedElapsedSeconds || 0) + currentDelta;
                    // Auto-start ticker on rehydrate in browser
                    if (typeof window !== 'undefined') {
                        startInternalTicker(useTaskStore.setState, useTaskStore.getState);
                        startHeartbeat(useTaskStore.setState, useTaskStore.getState);
                    }
                }
            }
        }
    )
);

export default useTaskStore;
