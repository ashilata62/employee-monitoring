import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/apiClient';

export const useAuditLogStore = create(
    persist(
        (set, get) => ({
            auditLogs: [],
            isLoading: false,
            error: null,
            filters: {
                dateRange: 'all',
                users: [],
                userRoles: []
            },
            sortConfig: {
                key: 'dateTime',
                direction: 'desc'
            },

            // Fetch real audit logs from database
            fetchAuditLogs: async (search = '') => {
                set({ isLoading: true, error: null });
                try {
                    const res = await api.get('/compliance/audit-logs', {
                        params: search ? { search } : {}
                    });
                    const rawLogs = res.data?.data || res.data || [];
                    const mappedLogs = rawLogs.map(l => {
                        let parsedMetadata = {};
                        if (typeof l.metadata === 'string') {
                            try { parsedMetadata = JSON.parse(l.metadata || '{}'); } catch (e) { parsedMetadata = {}; }
                        } else if (l.metadata && typeof l.metadata === 'object') {
                            parsedMetadata = l.metadata;
                        }

                        const userName = l.userName || (typeof l.user === 'object' ? (l.user?.fullName || l.user?.email) : l.user) || 'System Administrator';

                        return {
                            id: l.id,
                            dateTime: l.dateTime || l.createdAt || l.time,
                            userName: userName,
                            userRole: parsedMetadata?.userRole || l.userRole || 'Admin',
                            ipAddress: l.ipAddress || '127.0.0.1',
                            actionType: l.action?.toLowerCase().includes('create') || l.action?.toLowerCase().includes('add') ? 'Create'
                                : l.action?.toLowerCase().includes('delete') || l.action?.toLowerCase().includes('remove') ? 'Delete'
                                : 'Update',
                            action: l.action,
                            objectType: parsedMetadata?.objectType || (l.action?.includes('Token') ? 'API Token' : l.action?.includes('Employee') ? 'Employee' : 'System')
                        };
                    });
                    set({ auditLogs: mappedLogs, isLoading: false });
                } catch (err) {
                    console.error('Failed to fetch audit logs:', err);
                    set({ error: err.message, isLoading: false });
                }
            },

            // Actions
            addLog: (log) => {
                const newLog = {
                    id: `log_${Date.now()}`,
                    dateTime: new Date().toISOString(),
                    ipAddress: '127.0.0.1',
                    ...log
                };
                set((state) => ({
                    auditLogs: [newLog, ...state.auditLogs]
                }));
            },

            setFilters: (newFilters) => {
                set((state) => ({
                    filters: { ...state.filters, ...newFilters }
                }));
            },

            setSort: (key) => {
                set((state) => {
                    const direction = state.sortConfig.key === key && state.sortConfig.direction === 'desc' ? 'asc' : 'desc';
                    return { sortConfig: { key, direction } };
                });
            },

            clearFilters: () => {
                set({
                    filters: {
                        dateRange: 'all',
                        users: [],
                        userRoles: []
                    }
                });
            }
        }),
        {
            name: 'audit-logs-storage',
            partialize: (state) => ({ filters: state.filters, sortConfig: state.sortConfig })
        }
    )
);
