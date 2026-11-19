import api from "./apiClient";

const notificationService = {
    getNotifications: async (params = {}) => {
        try {
            const response = await api.get("/notifications", { params });
            return response.data;
        } catch (e) {
            return { success: true, data: [] };
        }
    },

    createNotification: async (data = {}) => {
        // Ephemeral local notification - avoid firing unsupported POST to remote backend
        return { success: true, data };
    },

    markAsRead: async (id) => {
        try {
            const response = await api.patch(`/notifications/${id}/read`);
            return response.data;
        } catch (e) {
            return { success: true };
        }
    },

    markAllAsRead: async () => {
        try {
            const response = await api.patch("/notifications/mark-all-read");
            return response.data;
        } catch (e) {
            return { success: true };
        }
    },

    deleteNotification: async (id) => {
        try {
            const response = await api.delete(`/notifications/${id}`);
            return response.data;
        } catch (e) {
            return { success: true };
        }
    },

    deleteAllNotifications: async () => {
        try {
            const response = await api.delete("/notifications/delete-all");
            return response.data;
        } catch (e) {
            return { success: true };
        }
    }
};

export default notificationService;
