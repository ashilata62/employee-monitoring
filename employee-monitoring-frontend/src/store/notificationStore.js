import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  addNotification: (message, type = 'info') => {
    if (!message) return;

    // Prevent duplicate identical messages from stacking or freezing
    const current = get().notifications;
    if (current.some(n => n.message === message)) {
      return;
    }

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }));

    // Auto-remove after 4 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => String(n.id) !== String(id)),
      }));
    }, 4000);
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => String(n.id) !== String(id)),
    })),
  clearAll: () => set({ notifications: [] }),
}));
