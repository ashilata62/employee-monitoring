import axios from "axios";
import API_BASE_URL from "../config/api";
import { toast } from "../utils/toastManager";
import { getErrorMessage } from "../utils/errorHandler";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Let browser set the correct multipart boundary for FormData
        if (config.data instanceof FormData) {
            if (config.headers?.delete) {
                config.headers.delete('Content-Type');
                config.headers.delete('content-type');
            } else if (config.headers) {
                delete config.headers['Content-Type'];
                delete config.headers['content-type'];
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor for global error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const message = getErrorMessage(error);
        
        // Handle 401 Unauthorized (expired or invalid token)
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login') && !error.config?.url?.includes('/agent/idle')) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else if (error.response?.status !== 401 && !error.config?.skipToast) {
            toast.error(message);
        }
        
        error.userMessage = message;
        return Promise.reject(error);
    }
);

export default api;
