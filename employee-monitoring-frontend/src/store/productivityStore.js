import { create } from 'zustand';
import productivityService from '../services/productivityService';

const RANDOM_COLORS = ['#F5A623', '#FF6B6B', '#FF4D4F', '#FFD666', '#9254DE', '#69C0FF', '#D3ADF7', '#52C41A', '#13C2C2', '#2F54EB'];

export const useProductivityStore = create((set, get) => ({
    apps: [],
    tags: [],
    loading: false,
    error: null,
    filters: {
        view: 'All apps & websites',
        thresholdEnabled: false,
        thresholdHours: 4,
        search: '',
        activeTag: null,
        selectedTeamId: null,
    },

    // ── Data fetching ────────────────────────────────────────────────
    fetchProductivityData: async (params = {}) => {
        set({ loading: true, error: null });
        try {
            const { filters } = get();
            const fetchParams = { ...params };
            if (filters.selectedTeamId) {
                fetchParams.teamId = filters.selectedTeamId;
            }
            const [apps, tags] = await Promise.all([
                productivityService.getApps(fetchParams),
                productivityService.getTags()
            ]);
            set({ apps, tags, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    // ── Department filter ────────────────────────────────────────────
    setDepartmentFilter: (teamId) => {
        set((s) => ({
            filters: { ...s.filters, selectedTeamId: teamId || null }
        }));
        // Refetch with new department filter
        get().fetchProductivityData();
    },

    // ── App & Rule actions ──────────────────────────────────────────
    toggleSelectApp: (id) =>
        set((s) => ({
            apps: s.apps.map((a) => ((a.id || a.appName) === id ? { ...a, selected: !a.selected } : a)),
        })),

    toggleSelectAll: (checked) =>
        set((s) => ({ apps: s.apps.map((a) => ({ ...a, selected: checked })) })),

    setAppTag: async (appId, tagId) => {
        try {
            const { apps, tags, filters } = get();
            const app = apps.find((a) => (a.id || a.appName) === appId);
            if (!app) return;

            const tag = tagId ? tags.find((t) => t.id === tagId) : null;
            const productivityMap = {
                Focus: 'PRODUCTIVE',
                Learning: 'PRODUCTIVE',
                Collaborative: 'NEUTRAL',
                Distraction: 'UNPRODUCTIVE',
            };

            await productivityService.updateRule({
                domain: app.domain,
                appName: app.appName,
                tagId: tagId,
                category: app.category,
                productivity: tag ? productivityMap[tag.name] || 'NEUTRAL' : 'NEUTRAL',
                teamId: filters.selectedTeamId || null,
            });

            set((s) => ({
                apps: s.apps.map((a) =>
                    (a.id || a.appName) === appId
                        ? {
                            ...a,
                            tagId,
                            productivity: tag ? productivityMap[tag.name] || 'NEUTRAL' : 'NEUTRAL',
                            isTeamSpecific: !!filters.selectedTeamId,
                        }
                        : a
                ),
            }));
        } catch (error) {
            set({ error: error.message });
        }
    },

    bulkSetTag: async (tagId) => {
        const { apps } = get();
        const selected = apps.filter((a) => a.selected);
        for (const app of selected) {
            await get().setAppTag(app.id || app.appName, tagId);
        }
        await get().fetchProductivityData();
    },

    autoLabel: async () => {
        set({ loading: true });
        try {
            const result = await productivityService.autoLabel();
            await get().fetchProductivityData();
            set({ loading: false });
            return result;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    // ── Filter actions ────────────────────────────────────
    updateFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value } })),

    toggleThreshold: () =>
        set((s) => ({ filters: { ...s.filters, thresholdEnabled: !s.filters.thresholdEnabled } })),

    // ── Tag actions ────────────────────────────────────────
    addTag: async (name, color) => {
        const { tags } = get();
        const trimmed = name.trim();
        if (!trimmed) return { error: 'Name is required.' };
        if (tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) return { error: 'Tag already exists.' };
        
        const newColor = color || RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
        try {
            const newTag = await productivityService.createTag({ name: trimmed, color: newColor });
            set((s) => ({ tags: [...s.tags, newTag] }));
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    },

    updateTag: async (id, data) => {
        try {
            const updatedTag = await productivityService.updateTag(id, data);
            set((s) => ({
                tags: s.tags.map((t) => t.id === id ? updatedTag : t),
            }));
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    },

    deleteTag: async (id) => {
        try {
            await productivityService.deleteTag(id);
            set((s) => ({
                tags: s.tags.filter((t) => t.id !== id),
                apps: s.apps.map((a) => a.tagId === id ? { ...a, tagId: null } : a),
            }));
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    },

    getTagUsageCount: (id) => {
        const { apps } = get();
        return apps.filter((a) => a.tagId === id).length;
    },
}));
