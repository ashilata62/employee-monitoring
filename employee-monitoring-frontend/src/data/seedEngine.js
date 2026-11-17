/**
 * @file seedEngine.js (Sanitized - All dummy data generation disabled)
 * Real data is loaded exclusively from the backend database.
 */

export const TEAMS = ['Engineering', 'Sales', 'HR', 'Operations'];
export const PROJECTS_LIST = [];
export const TASK_STATUSES = ['To Do', 'In Progress', 'In Review', 'Completed'];

export function buildAttendanceLogs() { return []; }
export function buildActivityLogs() { return []; }
export function buildAppUsageLogs() { return []; }
export function buildLocationLogs() { return []; }
export function buildScreenshots() { return []; }
export function buildTasks() { return []; }
export function buildAlerts() { return []; }
export function buildPayrollData() { return []; }

export function generateSeedData() {
    return {
        employees: [],
        attendanceLogs: [],
        activityLogs: [],
        appUsageLogs: [],
        locationLogs: [],
        screenshots: [],
        tasks: [],
        alerts: [],
        payrollData: [],
        projects: []
    };
}
