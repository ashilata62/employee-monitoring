import api from "./apiClient";

const dashboardService = {
    getAdminDashboard: async (startDate, endDate, compareStartDate, compareEndDate) => {
        const response = await api.get("/dashboard/admin", { 
            params: { startDate, endDate, compareStartDate, compareEndDate } 
        });
        return response.data;
    },
    getManagerDashboard: async (startDate, endDate, compareStartDate, compareEndDate) => {
        const response = await api.get("/dashboard/manager", { 
            params: { startDate, endDate, compareStartDate, compareEndDate } 
        });
        return response.data;
    },
    getEmployeeDashboard: async (startDate, endDate, compareStartDate, compareEndDate) => {
        const response = await api.get("/dashboard/me", { 
            params: { startDate, endDate, compareStartDate, compareEndDate } 
        });
        return response.data;
    }
};

export default dashboardService;
