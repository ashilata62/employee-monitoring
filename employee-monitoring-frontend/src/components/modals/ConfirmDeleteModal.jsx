import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';

export function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Delete Item',
    description = 'This action cannot be undone and will permanently remove this record.',
    confirmText = 'Delete',
    isLoading = false
}) {
    // Keyboard support: Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isLoading) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, isLoading]);

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            {/* Backdrop click area */}
            <div className="absolute inset-0" onClick={() => { if (!isLoading) onClose(); }} />

            {/* Modal Card - Styled Exactly in the app theme */}
            <div
                className="relative w-full max-w-md bg-[#FAF8F5] dark:bg-[#252B20] rounded-3xl shadow-2xl border border-[#D6CDBC] dark:border-[#384232] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 sm:px-8 py-5 border-b border-[#E5DED2] dark:border-[#384232] flex items-center justify-between bg-[#F5F1E9]/50 dark:bg-[#1E2419]/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                            <Trash2 size={18} />
                        </div>
                        <div>
                            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">
                                {title}
                            </h2>
                            <p className="text-[11px] text-[#777367] dark:text-[#B8B3A7] mt-0.5">
                                Permanent removal confirmation
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        title="Close"
                        className="w-8 h-8 rounded-xl bg-[#EEE8DD] hover:bg-[#E5DDCF] dark:bg-[#1E2419] dark:hover:bg-[#2A3324] text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:text-[#F5F1E9] flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 space-y-3.5">
                    <p className="text-xs sm:text-sm text-[#29291F] dark:text-[#F5F1E9] font-medium leading-relaxed">
                        {description}
                    </p>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-[11px] text-[#8C6D37] dark:text-[#D3B98D] font-medium leading-relaxed">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <span>This action cannot be undone. Any active assignments or records will be updated.</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 sm:px-8 py-4 bg-[#F5F1E9]/60 dark:bg-[#1E2419]/60 border-t border-[#E5DED2] dark:border-[#384232] flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl border border-[#D6CDBC] dark:border-[#384232] text-[#777367] dark:text-[#B8B3A7] hover:bg-[#EAE2D3] dark:hover:bg-[#1E2419] text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-warm-sm cursor-pointer bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {isLoading && <Loader2 size={14} className="animate-spin text-white" />}
                        <span>{confirmText}</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

export default ConfirmDeleteModal;
