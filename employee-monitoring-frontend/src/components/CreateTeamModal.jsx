import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';

export function CreateTeamModal({ isOpen, onClose, onCreateTeam, initialData }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
        } else {
            setName('');
            setDescription('');
        }
    }, [initialData, isOpen]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isSubmitting) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, isSubmitting]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName || isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            await onCreateTeam({ name: trimmedName, description });
            setName('');
            setDescription('');
            onClose();
        } catch (err) {
            console.error('Failed to submit team:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            {/* Backdrop click area */}
            <div className="absolute inset-0" onClick={() => { if (!isSubmitting) onClose(); }} />

            {/* Modal Card */}
            <div 
                className="relative w-full max-w-lg bg-[#FAF8F5] dark:bg-[#252B20] rounded-3xl shadow-2xl border border-[#D6CDBC] dark:border-[#384232] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-5 border-b border-[#E5DED2] dark:border-[#384232] flex items-center justify-between bg-[#F5F1E9]/50 dark:bg-[#1E2419]/50">
                    <div>
                        <h2 className="font-serif text-xl font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">
                            {initialData ? 'Edit Team' : 'Create New Team'}
                        </h2>
                        <p className="text-[11px] text-[#777367] dark:text-[#B8B3A7] mt-0.5">
                            {initialData ? 'Update team specifications and assignments' : 'Configure a new organizational unit for employees'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        title="Close"
                        className="w-8 h-8 rounded-xl bg-[#EEE8DD] hover:bg-[#E5DDCF] dark:bg-[#1E2419] dark:hover:bg-[#2A3324] text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:text-[#F5F1E9] flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit}>
                    <div className="p-8 space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#777367] dark:text-[#B8B3A7]">
                                Team Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Design System, Backend Engineering"
                                required
                                disabled={isSubmitting}
                                className="w-full bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl px-4 py-3 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition placeholder:text-[#777367] dark:placeholder:text-[#6E7569] disabled:opacity-60"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#777367] dark:text-[#B8B3A7]">
                                Team Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the team's core responsibilities and focus areas..."
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl px-4 py-3 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition placeholder:text-[#777367] dark:placeholder:text-[#6E7569] resize-none disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 bg-[#F5F1E9]/60 dark:bg-[#1E2419]/60 border-t border-[#E5DED2] dark:border-[#384232] flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl border border-[#D6CDBC] dark:border-[#384232] text-[#777367] dark:text-[#B8B3A7] hover:bg-[#EAE2D3] dark:hover:bg-[#1E2419] text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-warm-sm cursor-pointer flex items-center gap-2 ${
                                name.trim() && !isSubmitting
                                    ? 'bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] dark:bg-[#B9955B] dark:hover:bg-[#C9A86B] dark:text-[#1E2419]'
                                    : 'bg-[#E5DED2] dark:bg-[#384232] text-[#777367] dark:text-[#6E7569] cursor-not-allowed'
                            }`}
                        >
                            {isSubmitting && <Loader2 size={14} className="animate-spin text-[#D3B98D]" />}
                            <span>{initialData ? 'Save Changes' : 'Create Team'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
