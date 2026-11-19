import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const toastTypes = {
    success: {
        icon: <CheckCircle2 className="text-[#4ADE80]" size={18} />,
        border: 'border-[#2D4533]',
        dot: 'bg-[#4ADE80]',
    },
    error: {
        icon: <AlertCircle className="text-[#F87171]" size={18} />,
        border: 'border-[#5A2428]',
        dot: 'bg-[#F87171]',
    },
    warning: {
        icon: <AlertTriangle className="text-[#FBBF24]" size={18} />,
        border: 'border-[#5A431E]',
        dot: 'bg-[#FBBF24]',
    },
    info: {
        icon: <Info className="text-[#60A5FA]" size={18} />,
        border: 'border-[#263D52]',
        dot: 'bg-[#60A5FA]',
    },
};

export const Toast = ({ message, type = 'info', onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);
    const config = toastTypes[type] || toastTypes.info;

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onRemove, 300);
    };

    return (
        <div
            className={`
                group flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border
                transition-all duration-300 ease-out transform
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
                ${config.border} bg-[#181F16] text-[#F5F1E9] min-w-[280px] max-w-md pointer-events-auto
            `}
            style={{ backgroundColor: '#181F16', opacity: 1 }}
        >
            <div className="flex-shrink-0">{config.icon}</div>
            
            <span className="text-xs font-semibold tracking-tight flex-grow truncate text-[#F5F1E9]">
                {message}
            </span>

            <button
                onClick={handleClose}
                className="p-1 text-[#9E988A] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onRemove={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};
