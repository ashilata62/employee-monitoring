import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const makeId = () => Math.random().toString(36).slice(2, 9);

const INITIAL_USERS = [];

const INITIAL_ORG_GROUPS = [];

const getInitialUser = () => {
    try {
        const u = localStorage.getItem('user');
        const parsed = u ? JSON.parse(u) : null;
        if (parsed) {
            return {
                id: parsed.id,
                name: parsed.fullName || parsed.name || '',
                email: parsed.email || '',
                role: parsed.role || 'Admin',
                avatar: parsed.avatar || null,
                language: parsed.language || "English",
                timeFormat: parsed.timeFormat || "12h",
                timeZonePreference: parsed.timeZonePreference || "organization",
                twoFactorEnabled: !!parsed.twoFactorEnabled,
                connectedAccounts: parsed.connectedAccounts || { google: false, slack: false }
            };
        }
    } catch (e) {
        // ignore
    }
    return {
        id: null,
        name: "",
        email: "",
        role: "",
        avatar: null,
        language: "English",
        timeFormat: "12h",
        timeZonePreference: "organization",
        twoFactorEnabled: false,
        connectedAccounts: {
            google: false,
            slack: false
        }
    };
};

export const ALL_FEATURES = [
    { id: 'productivity', label: 'Productivity' },
    { id: 'screenshots', label: 'Screenshots' },
    { id: 'reports', label: 'Reports' },
    { id: 'timeAttendance', label: 'Time & Attendance' },
    { id: 'activities', label: 'Activities' },
    { id: 'projects', label: 'Projects' },
];

export const ALL_PERMISSIONS = [
    { id: 'canManageEmployees', label: 'Can manage employees' },
    { id: 'canManageTeams', label: 'Can manage teams' },
    { id: 'canManageProjects', label: 'Can manage projects' },
    { id: 'canEditTracking', label: 'Can edit tracking settings' },
    { id: 'canViewAnalytics', label: 'Can view advanced analytics' },
];

export const useUserStore = create(
    persist(
        (set, get) => ({
            users: INITIAL_USERS,
            orgGroups: INITIAL_ORG_GROUPS,
            currentUser: getInitialUser(),

            updateProfile: (updates) => set((s) => ({
                currentUser: { ...s.currentUser, ...updates }
            })),
            
            updatePassword: async (newPassword) => {
                // Password updates handled by auth service
            },
            
            toggle2FA: () => set((s) => ({
                currentUser: { ...s.currentUser, twoFactorEnabled: !s.currentUser.twoFactorEnabled }
            })),
            
            connectAccount: (provider) => set((s) => ({
                currentUser: {
                    ...s.currentUser,
                    connectedAccounts: { ...s.currentUser.connectedAccounts, [provider]: true }
                }
            })),
            
            disconnectAccount: (provider) => set((s) => ({
                currentUser: {
                    ...s.currentUser,
                    connectedAccounts: { ...s.currentUser.connectedAccounts, [provider]: false }
                }
            })),
            
            updateLocalization: (updates) => set((s) => ({
                currentUser: { ...s.currentUser, ...updates }
            })),

            addUser: (user) =>
                set((s) => ({
                    users: [...s.users, { ...user, id: makeId() }],
                })),

            updateUser: (id, updates) =>
                set((s) => ({
                    users: s.users.map((u) => u.id === id ? { ...u, ...updates } : u),
                })),

            removeUser: (id) => {
                const { users } = get();
                const admins = users.filter((u) => u.role === 'admin');
                // Prevent removing last admin
                if (admins.length === 1 && admins[0].id === id) return { error: 'Cannot remove the last admin.' };
                set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
                return { success: true };
            },

            addOrgGroup: (group) =>
                set((s) => {
                    const exists = s.orgGroups.some((g) => g.name.toLowerCase() === group.name.toLowerCase().trim());
                    if (exists) return s; // silently ignore duplicates (caller should validate first)
                    return { orgGroups: [...s.orgGroups, { ...group, id: makeId(), createdAt: Date.now() }] };
                }),

            updateOrgGroup: (id, updates) =>
                set((s) => ({
                    orgGroups: s.orgGroups.map((g) => g.id === id ? { ...g, ...updates } : g),
                })),

            removeOrgGroup: (id) =>
                set((s) => ({
                    orgGroups: s.orgGroups.filter((g) => g.id !== id),
                    users: s.users.map((u) => ({
                        ...u,
                        scope: {
                            ...u.scope,
                            orgGroups: u.scope.orgGroups === id ? 'all' : u.scope.orgGroups,
                        },
                    })),
                })),

            isOrgGroupNameUnique: (name, excludeId) => {
                const { orgGroups } = get();
                return !orgGroups.some(
                    (g) => g.name.toLowerCase() === name.toLowerCase().trim() && g.id !== excludeId
                );
            },
        }),
        { name: 'user-management-storage-v2' }
    )
);
