const prisma = require('../../config/db');
const { getIO } = require('../../socket/server');

class TasksService {
    async createTask(data, organizationId) {
        const { name, projectId, employeeId, priority, dueDate, status } = data;

        if (!organizationId) {
            throw new Error('Organization ID is required to create a task');
        }

        if (employeeId) {
            const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { status: true } });
            if (!emp) throw new Error('Employee not found');
            if (emp.status === 'DEACTIVATED') {
                const err = new Error('Cannot assign task to a deactivated employee');
                err.code = 'ACCOUNT_DEACTIVATED';
                err.statusCode = 403;
                throw err;
            }
        }

        const task = await prisma.task.create({
            data: {
                name,
                priority: priority || 'MEDIUM',
                status: status || 'BACKLOG',
                dueDate: dueDate ? new Date(dueDate) : null,
                project: {
                    connect: { id: projectId }
                },
                organization: {
                    connect: { id: organizationId }
                },
                ...(employeeId && {
                    employee: {
                        connect: { id: employeeId }
                    }
                })
            },
            include: {
                project: true,
                employee: true,
            }
        });

        // Emit real-time event
        const io = getIO();
        if (io) {
            io.to(`org_${organizationId}`).emit('task:update', { taskId: task.id, type: 'new' });
        }

        return task;
    }

    async getTasks(organizationId, filter = {}) {
        return await prisma.task.findMany({
            where: { 
                organizationId,
                ...filter
            },
            include: {
                project: true,
                employee: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateTask(id, data) {
        const { name, priority, dueDate, status, employeeId } = data;
        
        if (employeeId) {
            const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { status: true } });
            if (!emp) throw new Error('Employee not found');
            if (emp.status === 'DEACTIVATED') {
                const err = new Error('Cannot assign task to a deactivated employee');
                err.code = 'ACCOUNT_DEACTIVATED';
                err.statusCode = 403;
                throw err;
            }
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (priority) updateData.priority = priority;
        if (dueDate) updateData.dueDate = new Date(dueDate);
        if (status) updateData.status = status;
        if (employeeId !== undefined) updateData.employeeId = employeeId;

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                project: true,
                employee: true,
            }
        });

        // Emit real-time event
        const io = getIO();
        if (io && task) {
            io.to(`org_${task.organizationId}`).emit('task:update', { taskId: id, type: 'update' });
        }

        return task;
    }

    async updateTaskStatus(id, status) {
        const task = await prisma.task.update({
            where: { id },
            data: { status },
        });

        // Emit real-time event
        const io = getIO();
        if (io && task) {
            io.to(`org_${task.organizationId}`).emit('task:update', { taskId: id, type: 'status' });
        }

        return task;
    }

    formatDuration(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    async deleteTask(id) {
        // Guard: Prevent deleting task with recorded work history
        const hasLogs = await prisma.taskTimeLog.count({ where: { taskId: id } });
        if (hasLogs > 0) {
            const err = new Error('Cannot delete task with recorded work history');
            err.statusCode = 400;
            throw err;
        }

        const task = await prisma.task.delete({
            where: { id },
        });

        // Emit real-time event
        const io = getIO();
        if (io && task) {
            io.to(`org_${task.organizationId}`).emit('task:update', { taskId: id, type: 'delete' });
        }

        return task;
    }

    async startTimer(taskId, employeeId, organizationId, source = 'WEB', userRole = 'EMPLOYEE') {
        if (!employeeId) {
            const err = new Error('Employee ID is required to start a task timer');
            err.statusCode = 400;
            throw err;
        }
        if (!organizationId) {
            const err = new Error('Organization ID is required');
            err.statusCode = 400;
            throw err;
        }

        // 1. Guard: Check employee status
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { id: true, status: true, organizationId: true }
        });
        if (!employee) {
            const err = new Error('Employee not found');
            err.statusCode = 404;
            throw err;
        }
        if (employee.status === 'DEACTIVATED') {
            const err = new Error('Cannot start timer: Employee account is deactivated');
            err.code = 'ACCOUNT_DEACTIVATED';
            err.statusCode = 403;
            throw err;
        }
        if (employee.status === 'BREAK') {
            const err = new Error('Cannot start a task timer while on break');
            err.statusCode = 400;
            throw err;
        }

        // 2. Guard: Must be clocked in (open attendance record)
        const activeAttendance = await prisma.attendance.findFirst({
            where: { employeeId, clockOut: null },
            orderBy: { clockIn: 'desc' }
        });
        if (!activeAttendance) {
            const err = new Error('You must be clocked in to start a task timer');
            err.statusCode = 400;
            throw err;
        }

        // 3. Guard: Task existence and tenant isolation
        const task = await prisma.task.findFirst({
            where: { id: taskId, organizationId },
            include: {
                project: { select: { id: true, name: true } }
            }
        });
        if (!task) {
            const err = new Error('Task not found in this organization');
            err.statusCode = 404;
            throw err;
        }

        // 4. Guard: Employee assignment (for EMPLOYEE role)
        if (userRole === 'EMPLOYEE' && task.employeeId && task.employeeId !== employeeId) {
            const err = new Error('Cannot track time on a task assigned to another employee');
            err.statusCode = 403;
            throw err;
        }

        // 5. Atomic transaction: auto-stop existing timers & create new one
        const now = new Date();
        const newTimer = await prisma.$transaction(async (tx) => {
            // Auto-stop any active timer for this employee
            const existingActive = await tx.taskTimeLog.findMany({
                where: { employeeId, isRunning: true }
            });

            for (const active of existingActive) {
                const segDuration = Math.max(0, Math.floor((now.getTime() - new Date(active.startTime).getTime()) / 1000));
                await tx.taskTimeLog.update({
                    where: { id: active.id },
                    data: {
                        isRunning: false,
                        endTime: now,
                        duration: segDuration
                    }
                });
            }

            // Create new active timer
            return await tx.taskTimeLog.create({
                data: {
                    taskId,
                    employeeId,
                    organizationId,
                    startTime: now,
                    isRunning: true,
                    source
                },
                include: {
                    task: {
                        select: {
                            id: true,
                            name: true,
                            priority: true,
                            status: true,
                            projectId: true,
                            project: { select: { id: true, name: true } }
                        }
                    }
                }
            });
        });

        // Emit real-time event
        const io = getIO();
        if (io) {
            io.to(`org_${organizationId}`).emit('task:timer:started', {
                employeeId,
                taskId,
                timerId: newTimer.id,
                taskName: task.name,
                startTime: newTimer.startTime
            });
        }

        return newTimer;
    }

    async stopTimer(taskId, employeeId, organizationId) {
        if (!employeeId) {
            const err = new Error('Employee ID is required to stop a task timer');
            err.statusCode = 400;
            throw err;
        }

        const activeTimer = await prisma.taskTimeLog.findFirst({
            where: {
                ...(taskId ? { taskId } : {}),
                employeeId,
                ...(organizationId ? { organizationId } : {}),
                isRunning: true
            },
            include: {
                task: {
                    select: {
                        id: true,
                        name: true,
                        projectId: true,
                        project: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { startTime: 'desc' }
        });

        if (!activeTimer) {
            const err = new Error('No active task timer found');
            err.statusCode = 400;
            throw err;
        }

        const now = new Date();
        const duration = Math.max(0, Math.floor((now.getTime() - new Date(activeTimer.startTime).getTime()) / 1000));

        const stopped = await prisma.taskTimeLog.update({
            where: { id: activeTimer.id },
            data: {
                isRunning: false,
                endTime: now,
                duration
            },
            include: {
                task: {
                    select: {
                        id: true,
                        name: true,
                        projectId: true,
                        project: { select: { id: true, name: true } }
                    }
                }
            }
        });

        // Calculate task total tracked seconds on demand
        const totalAgg = await prisma.taskTimeLog.aggregate({
            where: { taskId: activeTimer.taskId, isRunning: false },
            _sum: { duration: true }
        });
        const totalTrackedSeconds = totalAgg._sum.duration || 0;

        // Emit real-time event
        const io = getIO();
        if (io) {
            io.to(`org_${activeTimer.organizationId}`).emit('task:timer:stopped', {
                employeeId,
                taskId: activeTimer.taskId,
                timerId: stopped.id,
                duration,
                formattedDuration: this.formatDuration(duration)
            });
        }

        return {
            ...stopped,
            formattedDuration: this.formatDuration(duration),
            taskTotalTrackedSeconds: totalTrackedSeconds,
            formattedTotalTracked: this.formatDuration(totalTrackedSeconds)
        };
    }

    async getActiveTimer(employeeId, organizationId) {
        if (!employeeId) {
            return { active: false, session: null };
        }

        const activeTimer = await prisma.taskTimeLog.findFirst({
            where: {
                employeeId,
                ...(organizationId ? { organizationId } : {}),
                isRunning: true
            },
            include: {
                task: {
                    include: {
                        project: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { startTime: 'desc' }
        });

        if (!activeTimer) {
            return { active: false, session: null };
        }

        const now = Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((now - new Date(activeTimer.startTime).getTime()) / 1000));

        return {
            active: true,
            session: {
                id: activeTimer.id,
                taskId: activeTimer.taskId,
                taskName: activeTimer.task.name,
                priority: activeTimer.task.priority,
                status: activeTimer.task.status,
                projectId: activeTimer.task.projectId,
                projectName: activeTimer.task.project?.name || null,
                startTime: activeTimer.startTime,
                elapsedSeconds,
                formattedElapsed: this.formatDuration(elapsedSeconds),
                source: activeTimer.source,
                isRunning: true
            }
        };
    }

    async getTaskTimeLogs(taskId, organizationId) {
        const task = await prisma.task.findFirst({
            where: { id: taskId, organizationId },
            include: {
                project: { select: { id: true, name: true } }
            }
        });
        if (!task) {
            const err = new Error('Task not found in this organization');
            err.statusCode = 404;
            throw err;
        }

        const logs = await prisma.taskTimeLog.findMany({
            where: { taskId, organizationId },
            include: {
                employee: {
                    select: { id: true, fullName: true, avatar: true }
                }
            },
            orderBy: { startTime: 'desc' }
        });

        const totalAgg = await prisma.taskTimeLog.aggregate({
            where: { taskId, isRunning: false },
            _sum: { duration: true }
        });
        const totalTrackedSeconds = totalAgg._sum.duration || 0;

        return {
            taskId,
            taskName: task.name,
            projectName: task.project?.name || null,
            totalTrackedSeconds,
            formattedTotal: this.formatDuration(totalTrackedSeconds),
            logs: logs.map(l => ({
                ...l,
                formattedDuration: this.formatDuration(l.duration)
            }))
        };
    }

    async stopActiveTimerForEmployee(employeeId, endTime = new Date()) {
        if (!employeeId) return [];

        const activeTimers = await prisma.taskTimeLog.findMany({
            where: { employeeId, isRunning: true }
        });
        if (!activeTimers.length) return [];

        const now = new Date(endTime);
        const stoppedList = [];
        for (const timer of activeTimers) {
            const duration = Math.max(0, Math.floor((now.getTime() - new Date(timer.startTime).getTime()) / 1000));
            const updated = await prisma.taskTimeLog.update({
                where: { id: timer.id },
                data: {
                    isRunning: false,
                    endTime: now,
                    duration
                }
            });
            stoppedList.push(updated);

            // Emit real-time event
            const io = getIO();
            if (io) {
                io.to(`org_${timer.organizationId}`).emit('task:timer:stopped', {
                    employeeId,
                    taskId: timer.taskId,
                    timerId: timer.id,
                    duration,
                    autoStopped: true
                });
            }
        }
        return stoppedList;
    }

    async getBoardTasks(organizationId, filter = {}) {
        const tasks = await this.getTasks(organizationId, filter);
        
        // Group tasks by status for the Kanban board
        const board = {
            BACKLOG: [],
            IN_OPERATIONS: [],
            QUALITY_ASSURANCE: [],
            FINALIZED: []
        };

        tasks.forEach(task => {
            if (board[task.status]) {
                board[task.status].push({
                    id: task.id,
                    title: task.name,
                    project: task.project.name,
                    projectId: task.projectId,
                    priority: task.priority,
                    assignee: task.employee ? task.employee.fullName : 'Unassigned',
                    assigneeId: task.employeeId,
                    status: task.status,
                    dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'No Date',
                    createdAt: task.createdAt
                });
            }
        });

        return board;
    }
}

module.exports = new TasksService();
