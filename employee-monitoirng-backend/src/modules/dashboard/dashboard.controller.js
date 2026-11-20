const dashboardService = require('./dashboard.service');
const prisma = require('../../config/db');

const getAdminDashboard = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { startDate, endDate, compareStartDate, compareEndDate, employeeId, teamId, role } = req.query;
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    const data = await dashboardService.getAdminDashboard(
      organizationId,
      startDate,
      endDate,
      compareStartDate,
      compareEndDate,
      employeeId || null,
      teamId || null,
      role || null
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getManagerDashboard = async (req, res) => {
  try {
    const { organizationId, teamId: userTeamId, role: userRole } = req.user;
    const { startDate, endDate, compareStartDate, compareEndDate, employeeId, teamId, role } = req.query;
    if (userRole !== 'MANAGER') {
      return res.status(403).json({ message: 'Forbidden: Manager access required' });
    }
    const effectiveTeamId = userTeamId || teamId || null;
    const data = await dashboardService.getManagerDashboard(
      organizationId,
      effectiveTeamId,
      startDate,
      endDate,
      compareStartDate,
      compareEndDate,
      employeeId || null,
      role || null
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployeeDashboard = async (req, res) => {
  try {
    let { organizationId, employeeId } = req.user;

    // Guaranteed resolution: fallback to user record or employee table by email
    if (!employeeId && (req.user.userId || req.user.id)) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId || req.user.id },
        select: { employeeId: true, organizationId: true }
      });
      if (user?.employeeId) {
        employeeId = user.employeeId;
        if (!organizationId) organizationId = user.organizationId;
      }
    }
    if (!employeeId && req.user.email) {
      const emp = await prisma.employee.findFirst({
        where: { email: req.user.email },
        select: { id: true, organizationId: true }
      });
      if (emp) {
        employeeId = emp.id;
        if (!organizationId) organizationId = emp.organizationId;
      }
    }

    if (!employeeId) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const { startDate, endDate, compareStartDate, compareEndDate } = req.query;
    const data = await dashboardService.getEmployeeDashboard(organizationId, employeeId, startDate, endDate, compareStartDate, compareEndDate);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminDashboard,
  getManagerDashboard,
  getEmployeeDashboard
};
