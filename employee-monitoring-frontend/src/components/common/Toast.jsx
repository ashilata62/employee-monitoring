import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';

const toastConfig = {
  success: {
    icon: <CheckCircle2 className="text-[#4ADE80]" size={20} />,
    borderColor: 'border-[#2D4533]',
    iconBg: 'bg-[#1E3022]',
    ringColor: 'ring-emerald-500/20'
  },
  error: {
    icon: <XCircle className="text-[#F87171]" size={20} />,
    borderColor: 'border-[#5A2428]',
    iconBg: 'bg-[#381B1E]',
    ringColor: 'ring-rose-500/20'
  },
  warning: {
    icon: <AlertTriangle className="text-[#FBBF24]" size={20} />,
    borderColor: 'border-[#5A431E]',
    iconBg: 'bg-[#332514]',
    ringColor: 'ring-amber-500/20'
  },
  info: {
    icon: <Info className="text-[#60A5FA]" size={20} />,
    borderColor: 'border-[#263D52]',
    iconBg: 'bg-[#1A2836]',
    ringColor: 'ring-sky-500/20'
  },
};

const Toast = ({ id, message, type = 'info' }) => {
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const config = toastConfig[type] || toastConfig.info;

  // Direct auto-dismiss timer
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
    <div
      className={`pointer-events-auto flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border ${config.borderColor} bg-[#181F16] text-[#F5F1E9] shadow-2xl shadow-black/80 ring-1 ${config.ringColor} animate-in slide-in-from-bottom-2 fade-in duration-300 relative z-[10000]`}
      style={{ backgroundColor: '#181F16', opacity: 1 }}
    >
      <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-xl ${config.iconBg}`}>
        {config.icon}
      </div>
      <div className="flex-1 text-sm font-semibold pr-1 select-none leading-snug text-[#F5F1E9]">
        {message}
      </div>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close notification"
        className="flex-shrink-0 p-1.5 rounded-xl text-[#9E988A] hover:text-white hover:bg-white/10 transition-colors cursor-pointer pointer-events-auto active:scale-95"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
