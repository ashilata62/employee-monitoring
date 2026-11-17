import api from "./apiClient";

const agentService = {
    /**
     * Get all agents
     */
    listAgents: async () => {
        const response = await api.get("/agent/list");
        return response.data;
    },

    /**
     * Get agent status by employeeId
     * @param {string} employeeId 
     */
    getAgentStatus: async (employeeId) => {
        const response = await api.get(`/agent/status/${employeeId}`);
        return response.data;
    },

    /**
     * Update agent status (approve/reject)
     * @param {string} id - Agent ID
     * @param {string} status - 'active', 'rejected', etc.
     */
    updateAgentStatus: async (id, status) => {
        const response = await api.patch(`/agent/status/${id}`, { status });
        return response.data;
    },

    /**
     * Update agent details
     * @param {string} id - Agent ID
     * @param {Object} data - Update data
     */
    updateAgent: async (id, data) => {
        const response = await api.patch(`/agent/${id}`, data);
        return response.data;
    },

    /**
     * Remove agent device
     * @param {string} id - Agent ID or Employee ID
     */
    removeAgent: async (id) => {
        const response = await api.delete(`/agent/${id}`);
        return response.data;
    },

    /**
     * Download agent installer
     */
    downloadAgent: async () => {
        const response = await api.get("/agent/download", { responseType: 'blob' });
        return response.data;
    }
};

export default agentService;
