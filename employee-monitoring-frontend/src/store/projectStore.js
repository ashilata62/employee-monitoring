import { create } from 'zustand';
import api from '../services/apiClient';
import toast from '../services/toastService';

// api (apiClient) already has baseURL: API_BASE_URL

export const useProjectStore = create((set, get) => ({
    projects: [],
    loading: false,
    error: null,

    fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/projects');
            set({ projects: response.data.data, loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to fetch projects', loading: false });
        }
    },

    createProject: async (projectData) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/projects', projectData);
            set(state => ({
                projects: [...state.projects, response.data.data],
                loading: false
            }));
            toast.success('Project created successfully');
            return response.data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed', loading: false });
            throw error;
        }
    },

    assignEmployees: async (projectId, employeeIds) => {
        set({ loading: true, error: null });
        try {
            await api.post('/projects/assign', { projectId, employeeIds });
            await get().fetchProjects();
            set({ loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to assign employees', loading: false });
            throw error;
        }
    },

    logTime: async (logData) => {
        set({ loading: true, error: null });
        try {
            await api.post('/projects/log-time', logData);
            await get().fetchProjects();
            set({ loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to log time', loading: false });
            throw error;
        }
    },

    updateProject: async (projectId, projectData) => {
        set({ loading: true, error: null });
        try {
            const response = await api.put(`/projects/${projectId}`, projectData);
            set(state => ({
                projects: state.projects.map(p => p.id === projectId ? response.data.data : p),
                loading: false
            }));
            toast.success('Project updated successfully');
            return response.data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to update project', loading: false });
            toast.error(error);
            throw error;
        }
    },

    deleteProject: async (projectId) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/projects/${projectId}`);
            set(state => ({
                projects: state.projects.filter(p => p.id !== projectId),
                loading: false
            }));
            toast.success('Project deleted successfully');
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to delete project', loading: false });
            toast.error(error);
            throw error;
        }
    }
}));
