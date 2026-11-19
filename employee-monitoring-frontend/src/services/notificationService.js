import api from "./apiClient";

const notificationService = {
    getNotifications: async (params = {}) => {
        const response = await api.get("/notifications", { params });
        return response.data;
    },

    createNotification: async (data = {}) => {
        const response = await api.post("/notifications", data);
        return response.data;
    },

    markAsRead: async (id) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.patch("/notifications/mark-all-read");
        return response.data;
    },

    deleteNotification: async (id) => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },

    deleteAllNotifications: async () => {
        const response = await api.delete("/notifications/delete-all");
        return response.data;
    }
};

export default notificationService;
