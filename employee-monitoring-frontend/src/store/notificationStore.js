import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  addNotification: (message, type = 'info', meta = {}) => {
    if (!message) return;

    // Prevent duplicate identical messages from stacking within 2.5s
    const current = get().notifications;
    if (current.some(n => n.message === message)) {
      return;
    }

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      notifications: [...state.notifications, { id, message, type, ...meta }],
    }));

    // Auto-remove toast popup from floating view after 4 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => String(n.id) !== String(id)),
      }));
    }, 4000);

    // Broadcast event so Navbar Bell dropdown (Header & RealTimeContext) records it
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:toast_notification', {
        detail: {
          id,
          title: message,
          message,
          type,
          description: meta.description || '',
          link: meta.link || null,
          time: 'Just now',
          timestamp: Date.now()
        }
      }));
    }

    return id;
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => String(n.id) !== String(id)),
    })),
  clearAll: () => set({ notifications: [] }),
}));
