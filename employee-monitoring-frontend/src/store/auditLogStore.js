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
                dateRange: 'today',
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
                    const mappedLogs = rawLogs.map(l => ({
                        id: l.id,
                        dateTime: l.createdAt,
                        userName: l.user?.fullName || l.user?.email || 'System Administrator',
                        userRole: l.metadata?.userRole || 'Admin',
                        ipAddress: l.ipAddress || '127.0.0.1',
                        actionType: l.action?.toLowerCase().includes('create') || l.action?.toLowerCase().includes('add') ? 'Create'
                            : l.action?.toLowerCase().includes('delete') || l.action?.toLowerCase().includes('remove') ? 'Delete'
                            : 'Update',
                        action: l.action,
                        objectType: l.metadata?.objectType || (l.action?.includes('Token') ? 'API Token' : l.action?.includes('Employee') ? 'Employee' : 'System')
                    }));
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
                        dateRange: 'today',
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
