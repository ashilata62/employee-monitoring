import api from "./apiClient";

const notificationService = {
    getNotifications: async (params = {}) => {
        try {
            const response = await api.get("/notifications", { params, skipToast: true });
            return response.data;
        } catch (e) {
            return { success: true, data: [] };
        }
    },

    createNotification: async (data = {}) => {
        try {
            const response = await api.post("/notifications", data, { skipToast: true });
            return response.data;
        } catch (e) {
            return { success: true, data };
        }
    },

    markAsRead: async (id) => {
        try {
            const response = await api.patch(`/notifications/${id}/read`, {}, { skipToast: true });
            return response.data;
        } catch (e) {
            return { success: true };
        }
    },

    markAllAsRead: async () => {
        try {
            const response = await api.patch("/notifications/mark-all-read", {}, { skipToast: true });
            return response.data;
        } catch (e) {
            return { success: true };
        }
    },

    deleteNotification: async (id) => {
        try {
            const response = await api.delete(`/notifications/${id}`, { skipToast: true });
            return response.data;
        } catch (e) {
            return { success: true };
        }
    },

    deleteAllNotifications: async () => {
        try {
            const response = await api.delete("/notifications/delete-all", { skipToast: true });
            return response.data;
        } catch (e) {
            return { success: true };
        }
    }
};

export default notificationService;
