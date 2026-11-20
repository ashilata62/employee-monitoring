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

    try {
        await attendanceService.clockIn(employeeId, organizationId || 'default-org-id');
    } catch (err) {
        if (!err.message.includes('Already clocked in') && err.statusCode !== 409) {
            throw err;
        }
    }
}

/**
 * Auto Clock-Out disabled: Employees remain in AFK/IDLE during shift so idle and unproductive time continue to accumulate.
 */
async function processStaleAttendanceForEmployee(employeeId, openAttendance = null) {
    return false;
}

/**
 * Background sweep — auto clock-out disabled.
 */
async function processAllStaleSessions() {
    return 0;
}

module.exports = {
    STALE_MS,
    touchAgentLastSeen,
    onAgentPulse,
    processStaleAttendanceForEmployee,
    processAllStaleSessions,
};
