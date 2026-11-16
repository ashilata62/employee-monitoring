const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const prisma = require('../config/db');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(res, 'Authentication required! Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return errorResponse(res, 'Invalid or expired token!', 401);
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
};

module.exports = authMiddleware;
