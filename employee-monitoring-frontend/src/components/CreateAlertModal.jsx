import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Check, Loader2 } from 'lucide-react';
import alertService from '../services/alertService';
import { useToast } from '../context/ToastContext';
import { useRealTime } from '../hooks/RealTimeContext';
import { useEmployeeStore } from '../store/employeeStore';

const ALERT_TYPE_OPTIONS = [
    { value: 'Activity Level', label: 'Activity Level', category: 'activity' },
    { value: 'Productivity Threshold', label: 'Productivity Threshold', category: 'activity' },
    { value: 'Continuous Idle', label: 'Continuous Idle', category: 'activity' },
    { value: 'Late Arrival', label: 'Late Arrival', category: 'attendance' },
    { value: 'Manual Time Entry', label: 'Manual Time Entry', category: 'attendance' },
    { value: 'Prohibited App', label: 'Prohibited App', category: 'security' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CreateAlertModal({ isOpen, onClose, onSuccess }) {
    const { toast } = useToast();
    const { teams = [] } = useRealTime() || {};
    const { employees = [], fetchEmployees } = useEmployeeStore();

    const [alertType, setAlertType] = useState('Activity Level');
    const [name, setName] = useState('');
    const [scope, setScope] = useState('All Employees');
    const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    const [recipientType, setRecipientType] = useState('Admin'); // 'Admin' | 'Manager' | 'Specific Employee'
    const [selectedManager, setSelectedManager] = useState('team_manager');
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [delivery, setDelivery] = useState(['In App']);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
        }
    }, [isOpen, fetchEmployees]);

    const managers = useMemo(() => {
        return employees.filter(emp => (emp.role || '').toUpperCase() === 'MANAGER');
    }, [employees]);

    const nonAdminEmployees = useMemo(() => {
        return employees.filter(emp => (emp.role || '').toUpperCase() !== 'ADMIN');
    }, [employees]);

    useEffect(() => {
        if (nonAdminEmployees.length > 0 && !selectedEmployee) {
            setSelectedEmployee(nonAdminEmployees[0].name || nonAdminEmployees[0].fullName || '');
        }
    }, [nonAdminEmployees, selectedEmployee]);

    // Dynamic scope options from real teams + presets
    const scopeOptions = useMemo(() => {
        const presets = ['All Employees', 'Development Team', 'Remote Workers', 'Office Only'];
        const teamNames = Array.isArray(teams)
            ? teams.map(t => t.name).filter(Boolean)
            : [];
        return Array.from(new Set([...presets, ...teamNames]));
    }, [teams]);

    // Current category helper
    const currentCategory = useMemo(() => {
        const found = ALERT_TYPE_OPTIONS.find(opt => opt.value === alertType);
        return found ? found.category : 'activity';
    }, [alertType]);

    // Keyboard support: Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

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

    const toggleDay = (day) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const toggleDelivery = (item) => {
        setDelivery(prev =>
            prev.includes(item)
                ? (prev.length > 1 ? prev.filter(d => d !== item) : prev)
                : [...prev, item]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            if (toast?.error) toast.error('Please enter a descriptive name for the alert.');
            return;
        }

        setIsSaving(true);
        try {
            await alertService.createAlertRule({
                name: trimmedName,
                type: currentCategory,
                trigger: alertType,
                scope: scope
            });

            if (toast?.success) {
                toast.success(`Alert rule "${trimmedName}" created successfully!`);
            }
            setName('');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create alert rule:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to create alert rule';
            if (toast?.error) {
                toast.error(msg);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            {/* Backdrop click area */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Card - Styled Exactly Like CreateTeamModal */}
            <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-[#FAF8F5] dark:bg-[#252B20] rounded-3xl shadow-2xl border border-[#D6CDBC] dark:border-[#384232] overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-8 py-5 border-b border-[#E5DED2] dark:border-[#384232] flex items-center justify-between bg-[#F5F1E9]/50 dark:bg-[#1E2419]/50 shrink-0">
                    <div>
                        <h2 className="font-serif text-xl font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">
                            Create New Alert
                        </h2>
                        <p className="text-[11px] text-[#777367] dark:text-[#B8B3A7] mt-0.5">
                            Configure real-time violation thresholds and notification triggers
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        title="Close"
                        className="w-8 h-8 rounded-xl bg-[#EEE8DD] hover:bg-[#E5DDCF] dark:bg-[#1E2419] dark:hover:bg-[#2A3324] text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:text-[#F5F1E9] flex items-center justify-center transition cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                        
                        {/* Alert Type */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#777367] dark:text-[#B8B3A7]">
                                Alert Type <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={alertType}
                                    onChange={(e) => setAlertType(e.target.value)}
                                    className="w-full bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl px-4 py-3 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition appearance-none cursor-pointer"
                                >
                                    {ALERT_TYPE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value} className="bg-[#FAF8F5] dark:bg-[#1E2419] text-[#29291F] dark:text-[#F5F1E9]">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777367] dark:text-[#B8B3A7] pointer-events-none" />
                            </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#777367] dark:text-[#B8B3A7]">
                                Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter a descriptive name for your alert (e.g. Inactive Warning)"
                                required
                                className="w-full bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl px-4 py-3 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition placeholder:text-[#777367] dark:placeholder:text-[#6E7569]"
                            />
                        </div>

                        {/* Scope */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#777367] dark:text-[#B8B3A7]">
                                Scope
                            </label>
                            <div className="relative">
                                <select
                                    value={scope}
                                    onChange={(e) => setScope(e.target.value)}
                                    className="w-full bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl px-4 py-3 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition appearance-none cursor-pointer"
                                >
                                    {scopeOptions.map(opt => (
                                        <option key={opt} value={opt} className="bg-[#FAF8F5] dark:bg-[#1E2419] text-[#29291F] dark:text-[#F5F1E9]">
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777367] dark:text-[#B8B3A7] pointer-events-none" />
                            </div>
                        </div>

                        {/* Days */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#777367] dark:text-[#B8B3A7]">
                                    Days
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])}
                                        className="text-[11px] font-semibold text-[#777367] hover:text-[#B9955B] transition cursor-pointer"
                                    >
                                        Weekdays
                                    </button>
                                    <span className="text-[#D6CDBC] dark:text-[#384232]">•</span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedDays(DAYS)}
                                        className="text-[11px] font-semibold text-[#B9955B] hover:text-[#A17D45] transition cursor-pointer"
                                    >
                                        Select All
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                                {DAYS.map(day => {
                                    const isSelected = selectedDays.includes(day);
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`h-11 sm:h-12 border rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                                                isSelected
                                                    ? 'border-[#30382B] dark:border-[#B9955B] bg-[#30382B] text-[#FDFBF7] dark:bg-[#30382B] dark:text-[#F5F1E9] shadow-warm-xs'
                                                    : 'border-[#D6CDBC] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] text-[#777367] dark:text-[#B8B3A7] hover:border-[#B9955B]'
                                            }`}
                                        >
                                            <div className={`w-3.5 h-3.5 border rounded-xs flex items-center justify-center transition ${
                                                isSelected ? 'bg-[#B9955B] border-[#B9955B]' : 'border-[#C5BEAF] dark:border-[#556350]'
                                            }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-[#FDFBF7]' : 'text-[#777367] dark:text-[#B8B3A7]'}`}>
                                                {day}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recipients */}
                        <div className="space-y-2.5">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#777367] dark:text-[#B8B3A7]">
                                Recipients (Who receives this alert?)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {[
                                    { id: 'Admin', label: 'Admin (Me)' },
                                    { id: 'Manager', label: 'Manager' },
                                    { id: 'Specific Employee', label: 'Specific Employee' }
                                ].map(opt => {
                                    const isSelected = recipientType === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setRecipientType(opt.id)}
                                            className={`flex items-center gap-2.5 px-3.5 py-3 border rounded-xl transition cursor-pointer ${
                                                isSelected
                                                    ? 'border-[#30382B] bg-[#30382B]/10 text-[#30382B] dark:border-[#B9955B] dark:bg-[#B9955B]/15 dark:text-[#F5F1E9]'
                                                    : 'border-[#D6CDBC] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] text-[#777367] dark:text-[#B8B3A7] hover:border-[#B9955B]'
                                            }`}
                                        >
                                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition ${
                                                isSelected ? 'border-[#30382B] dark:border-[#B9955B]' : 'border-[#C5BEAF] dark:border-[#556350]'
                                            }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 bg-[#30382B] dark:bg-[#B9955B] rounded-full" />}
                                            </div>
                                            <span className="text-xs font-semibold">{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Manager Selection Dropdown */}
                            {recipientType === 'Manager' && (
                                <div className="p-3.5 rounded-xl border border-[#D6CDBC] dark:border-[#384232] bg-[#F5F1E9]/60 dark:bg-[#1E2419]/60 space-y-1.5 animate-in fade-in duration-200">
                                    <label className="block text-[9px] font-bold uppercase tracking-[0.14em] text-[#777367] dark:text-[#B8B3A7]">
                                        Choose Manager Target
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedManager}
                                            onChange={(e) => setSelectedManager(e.target.value)}
                                            className="w-full bg-[#FAF8F5] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition appearance-none cursor-pointer"
                                        >
                                            <option value="team_manager">Respective Team Manager (Default - Employee's direct manager)</option>
                                            <option value="all_managers">All Managers (Broadcast to all managers)</option>
                                            {managers.map(mgr => (
                                                <option key={mgr.id} value={mgr.name || mgr.fullName}>
                                                    Manager: {mgr.name || mgr.fullName} {mgr.team ? `(${typeof mgr.team === 'object' ? mgr.team.name : mgr.team})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777367] dark:text-[#B8B3A7] pointer-events-none" />
                                    </div>
                                    <p className="text-[10px] text-[#777367] dark:text-[#8E9789] pt-0.5">
                                        {selectedManager === 'team_manager' 
                                            ? "Alert will automatically be routed to whichever manager heads the offending employee's team."
                                            : selectedManager === 'all_managers'
                                            ? "All organizational managers will receive this notification."
                                            : `Alert will specifically be routed to Manager ${selectedManager}.`}
                                    </p>
                                </div>
                            )}

                            {/* Specific Employee Selection Dropdown */}
                            {recipientType === 'Specific Employee' && (
                                <div className="p-3.5 rounded-xl border border-[#D6CDBC] dark:border-[#384232] bg-[#F5F1E9]/60 dark:bg-[#1E2419]/60 space-y-1.5 animate-in fade-in duration-200">
                                    <label className="block text-[9px] font-bold uppercase tracking-[0.14em] text-[#777367] dark:text-[#B8B3A7]">
                                        Select Specific Employee to Notify
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedEmployee}
                                            onChange={(e) => setSelectedEmployee(e.target.value)}
                                            className="w-full bg-[#FAF8F5] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition appearance-none cursor-pointer"
                                        >
                                            {nonAdminEmployees.map(emp => {
                                                const empName = emp.name || emp.fullName || 'Employee';
                                                const empTeam = typeof emp.team === 'object' ? (emp.team?.name || 'No Team') : (emp.team || 'No Team');
                                                return (
                                                    <option key={emp.id} value={empName}>
                                                        {empName} — {empTeam} ({emp.email || 'No email'})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777367] dark:text-[#B8B3A7] pointer-events-none" />
                                    </div>
                                    <p className="text-[10px] text-[#777367] dark:text-[#8E9789] pt-0.5">
                                        This specific employee will receive this alert notification.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Delivery */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#777367] dark:text-[#B8B3A7]">
                                Delivery
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
                                {['In App', 'Email'].map(item => {
                                    const isSelected = delivery.includes(item);
                                    return (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => toggleDelivery(item)}
                                            className={`flex items-center gap-2.5 p-3 border rounded-xl transition cursor-pointer ${
                                                isSelected
                                                    ? 'border-[#30382B] bg-[#30382B]/10 text-[#30382B] dark:border-[#B9955B] dark:bg-[#B9955B]/15 dark:text-[#F5F1E9]'
                                                    : 'border-[#D6CDBC] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] text-[#777367] dark:text-[#B8B3A7] hover:border-[#B9955B]'
                                            }`}
                                        >
                                            <div className={`w-3.5 h-3.5 border rounded-xs flex items-center justify-center shrink-0 transition ${
                                                isSelected ? 'bg-[#30382B] dark:bg-[#B9955B] border-[#30382B] dark:border-[#B9955B]' : 'border-[#C5BEAF] dark:border-[#556350]'
                                            }`}>
                                                {isSelected && <Check size={10} className="text-white" />}
                                            </div>
                                            <span className="text-xs font-semibold">{item}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer - Styled Exactly Like CreateTeamModal */}
                    <div className="px-8 py-4 bg-[#F5F1E9]/60 dark:bg-[#1E2419]/60 border-t border-[#E5DED2] dark:border-[#384232] flex items-center justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-xl border border-[#D6CDBC] dark:border-[#384232] text-[#777367] dark:text-[#B8B3A7] hover:bg-[#EAE2D3] dark:hover:bg-[#1E2419] text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isSaving}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-warm-sm cursor-pointer flex items-center gap-2 ${
                                name.trim() && !isSaving
                                    ? 'bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] dark:bg-[#B9955B] dark:hover:bg-[#C9A86B] dark:text-[#1E2419]'
                                    : 'bg-[#E5DED2] dark:bg-[#384232] text-[#777367] dark:text-[#6E7569] cursor-not-allowed'
                            }`}
                        >
                            {isSaving && <Loader2 size={14} className="animate-spin text-[#D3B98D]" />}
                            <span>Save Alert</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

export default CreateAlertModal;
