import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';

const icons = {
  success: <CheckCircle className="text-emerald-500" size={20} />,
  error: <XCircle className="text-rose-500" size={20} />,
  warning: <AlertTriangle className="text-amber-500" size={20} />,
  info: <Info className="text-blue-500" size={20} />,
};

const styles = {
  success: 'border-emerald-100 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-400',
  error: 'border-rose-100 bg-rose-50/50 dark:bg-rose-900/10 text-rose-900 dark:text-rose-400',
  warning: 'border-amber-100 bg-amber-50/50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-400',
  info: 'border-blue-100 bg-blue-50/50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-400',
};

const Toast = ({ id, message, type = 'info' }) => {
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  // Fallback direct auto-dismiss timer
  useEffect(() => {
    const timer = setTimeout(() => {
      removeNotification(id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [id, removeNotification]);

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeNotification(id);
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border shadow-lg animate-in slide-in-from-right-4 fade-in duration-300 relative z-[10000] ${styles[type] || styles.info}`}>
      <div className="flex-shrink-0">{icons[type] || icons.info}</div>
      <div className="flex-1 text-sm font-medium pr-1 select-none leading-snug">{message}</div>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close notification"
        className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer pointer-events-auto active:scale-95"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
