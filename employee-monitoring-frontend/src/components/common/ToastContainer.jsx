import React from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import Toast from './Toast';

const ToastContainer = () => {
  const notifications = useNotificationStore((state) => state.notifications);

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none px-3">
      <div className="flex flex-col gap-2.5 w-full pointer-events-auto">
        {notifications.map((n) => (
          <Toast key={n.id} {...n} />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
