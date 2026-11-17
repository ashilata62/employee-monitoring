const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const prisma = require('../config/db');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 'Authentication required! Please log in.', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return errorResponse(res, 'Invalid or expired token!', 401);
        }

        // Check if employee account is deactivated
        let targetEmployeeId = decoded.employeeId;
        if (!targetEmployeeId && decoded.userId) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { employeeId: true }
            });
            targetEmployeeId = user?.employeeId;
        }

        if (targetEmployeeId) {
            const employee = await prisma.employee.findUnique({
                where: { id: targetEmployeeId },
                select: { status: true, role: true }
            });

            if (employee && employee.status === 'DEACTIVATED') {
                return res.status(403).json({
                    success: false,
                    code: 'ACCOUNT_DEACTIVATED',
                    message: 'Your account has been deactivated. Please contact your administrator.'
                });
            }
        }

        req.user = decoded;

        // Ensure fresh employee & organization mapping so cached/stale tokens don't desync
        try {
            const emp = await prisma.employee.findFirst({
                where: {
                    OR: [
                        ...(decoded.employeeId ? [{ id: decoded.employeeId }] : []),
                        ...(decoded.email ? [{ email: decoded.email }] : [])
                    ]
                },
                select: { id: true, organizationId: true, role: true }
            });
            if (emp) {
                req.user.employeeId = emp.id;
                req.user.organizationId = emp.organizationId || 'default-org-id';
            } else if (!req.user.organizationId) {
                req.user.organizationId = 'default-org-id';
            }
        } catch (e) {
            // Fallback to decoded token
        }

        next();
    } catch (err) {
        console.error('[AuthMiddleware] Error verifying user status:', err);
        return errorResponse(res, 'Authentication check failed', 500);
    }
};

module.exports = authMiddleware;
