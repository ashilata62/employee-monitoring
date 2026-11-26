const prisma = require('../config/db');
const attendanceService = require('../modules/attendance/attendance.service');

/** 15 minutes of inactivity / offline / freeze → auto clock-out */
const STALE_MS = 15 * 60 * 1000;

async function touchAgentLastSeen(employeeId) {
    if (!employeeId) return;
    const now = new Date();
    try {
        await prisma.agent.updateMany({
            where: { employeeId },
            data: { lastSeen: now, status: 'active' },
        });
        await prisma.employee.update({
            where: { id: employeeId },
            data: { lastActiveAt: now }
        });
    } catch (e) {
        // Safe ignore
    }
}

/**
 * Called on agent heartbeat / first activity — one open session per employee.
 */
async function onAgentPulse(employeeId, organizationId) {
    if (!employeeId) return;

    // Guard: Never pulse attendance or update status for deactivated employees
    const emp = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { status: true }
    });
    if (emp?.status === 'DEACTIVATED') {
        return;
    }

    await touchAgentLastSeen(employeeId);

    // Keep existing open session running without closing or splitting it
    const existingOpen = await prisma.attendance.findFirst({
        where: { employeeId, clockOut: null },
        select: { id: true }
    });
    if (existingOpen) {
        return existingOpen;
    }

    try {
        await attendanceService.clockIn(employeeId, organizationId || 'default-org-id');
    } catch (err) {
        if (!err.message.includes('Already clocked in') && err.statusCode !== 409) {
            throw err;
        }
    }
}

/**
 * Auto clock-out stale open sessions when no heartbeat or activity has been received for 30+ minutes.
 */
const AUTO_CLOCK_OUT_MS = 30 * 60 * 1000;

async function processStaleAttendanceForEmployee(employeeId, openAttendance = null) {
    if (!employeeId) return false;

    const activeAtt = openAttendance || await prisma.attendance.findFirst({
        where: { employeeId, clockOut: null },
        orderBy: { clockIn: 'desc' }
    });
    if (!activeAtt) return false;

    const [emp, agent] = await Promise.all([
        prisma.employee.findUnique({
            where: { id: employeeId },
            select: { status: true, lastActiveAt: true }
        }),
        prisma.agent.findUnique({
            where: { employeeId },
            select: { lastSeen: true }
        })
    ]);

    const timestamps = [
        activeAtt.clockIn ? new Date(activeAtt.clockIn).getTime() : 0,
        emp?.lastActiveAt ? new Date(emp.lastActiveAt).getTime() : 0,
        agent?.lastSeen ? new Date(agent.lastSeen).getTime() : 0
    ];
    const lastPulseMs = Math.max(...timestamps);

    if (lastPulseMs > 0 && (Date.now() - lastPulseMs) > AUTO_CLOCK_OUT_MS) {
        try {
            await attendanceService.clockOut(employeeId, new Date(lastPulseMs));
            return true;
        } catch (err) {
            if (!err.message?.includes('No active clock-in')) {
                console.error(`[AttendanceSession] Auto clock-out failed for ${employeeId}:`, err.message);
            }
        }
    }
    return false;
}

/**
 * Background sweep — closes stale open sessions with no pulse for 30+ minutes.
 */
async function processAllStaleSessions() {
    const openSessions = await prisma.attendance.findMany({
        where: { clockOut: null },
        orderBy: { clockIn: 'desc' }
    });

    let closedCount = 0;
    const seenEmployees = new Set();
    for (const session of openSessions) {
        if (seenEmployees.has(session.employeeId)) continue;
        seenEmployees.add(session.employeeId);
        const closed = await processStaleAttendanceForEmployee(session.employeeId, session);
        if (closed) closedCount++;
    }
    return closedCount;
}

module.exports = {
    STALE_MS,
    touchAgentLastSeen,
    onAgentPulse,
    processStaleAttendanceForEmployee,
    processAllStaleSessions,
};
