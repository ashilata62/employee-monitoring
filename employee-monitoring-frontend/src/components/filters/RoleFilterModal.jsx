import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Shield } from 'lucide-react';
import { cn } from '../../utils/cn';

export function RoleFilterModal({ isOpen, onClose, selectedRoles = [], onApply }) {
    const [localSelected, setLocalSelected] = useState(selectedRoles);

    // In this system, only 3 roles exist: Admin, Manager, and Employee
    const roles = [
        { id: 'Admin', label: 'Admin', desc: 'Full workspace & system control', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
        { id: 'Manager', label: 'Manager', desc: 'Team oversight & tracking monitoring', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
        { id: 'Employee', label: 'Employee', desc: 'Personal metrics & tracked activity', color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' },
    ];

    useEffect(() => {
        setLocalSelected(selectedRoles || []);
    }, [selectedRoles, isOpen]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const toggleRole = (roleId) => {
        setLocalSelected(prev => 
            prev.some(r => r.toLowerCase() === roleId.toLowerCase())
                ? prev.filter(r => r.toLowerCase() !== roleId.toLowerCase())
                : [...prev, roleId]
        );
    };

    const isSelected = (roleId) => {
        return localSelected.some(r => r.toLowerCase() === roleId.toLowerCase());
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />
            <div 
                className="relative w-full max-w-sm bg-[#FAF8F5] dark:bg-[#252B20] rounded-3xl shadow-2xl border border-[#D6CDBC] dark:border-[#384232] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5DED2] dark:border-[#384232] flex items-center justify-between bg-[#F5F1E9]/50 dark:bg-[#1E2419]/50">
                    <div>
                        <h3 className="font-serif text-lg font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">
                            Filter by Role
                        </h3>
                        <p className="text-[11px] text-[#777367] dark:text-[#B8B3A7] mt-0.5">
                            Filter audit events by account role
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-xl bg-[#EEE8DD] hover:bg-[#E5DDCF] dark:bg-[#1E2419] dark:hover:bg-[#2A3324] text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:text-[#F5F1E9] flex items-center justify-center transition cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Role List */}
                <div className="p-6 space-y-3">
                    {roles.map(r => {
                        const selected = isSelected(r.id);
                        return (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => toggleRole(r.id)}
                                className={cn(
                                    "w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer",
                                    selected
                                        ? "border-[#B9955B] bg-[#B9955B]/10 dark:bg-[#B9955B]/15 shadow-warm-xs"
                                        : "border-[#E5DED2] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] hover:border-[#B9955B]/60"
                                )}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", r.color)}>
                                        <Shield size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] uppercase tracking-wider block">
                                            {r.label}
                                        </span>
                                        <span className="text-[10px] text-[#777367] dark:text-[#B8B3A7] block truncate">
                                            {r.desc}
                                        </span>
                                    </div>
                                </div>
                                <div className={cn(
                                    "w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ml-2",
                                    selected 
                                        ? "bg-[#B9955B] border-[#B9955B] text-white" 
                                        : "border-[#C5BEAF] dark:border-[#556350]"
                                )}>
                                    {selected && <Check size={12} className="text-white" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#F5F1E9]/60 dark:bg-[#1E2419]/60 border-t border-[#E5DED2] dark:border-[#384232] flex gap-3">
                    <button 
                        type="button"
                        onClick={() => setLocalSelected([])}
                        className="flex-1 py-2.5 rounded-xl border border-[#D6CDBC] dark:border-[#384232] text-[#777367] dark:text-[#B8B3A7] hover:bg-[#EAE2D3] dark:hover:bg-[#1E2419] font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                        Clear
                    </button>
                    <button 
                        type="button"
                        onClick={() => {
                            onApply(localSelected);
                            onClose();
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] dark:bg-[#B9955B] dark:hover:bg-[#C9A86B] dark:text-[#1E2419] font-bold text-xs uppercase tracking-wider transition shadow-warm-xs cursor-pointer active:scale-95"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

export default RoleFilterModal;
