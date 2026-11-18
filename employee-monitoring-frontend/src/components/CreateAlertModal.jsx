import React, { useState } from 'react';
import { X, ChevronDown, Check, Loader2 } from 'lucide-react';
import alertService from '../services/alertService';
import { useToast } from '../context/ToastContext';

export function CreateAlertModal({ isOpen, onClose, onSuccess }) {
    const { toast } = useToast();
    const [alertType, setAlertType] = useState('Activity Level');
    const [name, setName] = useState('');
    const [scope, setScope] = useState('All Employees');
    const [isScopeOpen, setIsScopeOpen] = useState(false);
    const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    const [recipient, setRecipient] = useState('Only Me');
    const [delivery, setDelivery] = useState(['In App']);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const scopeOptions = ['All Employees', 'Development Team', 'Remote Workers', 'Office Only'];

    const toggleDay = (day) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const toggleDelivery = (item) => {
        if (delivery.includes(item)) {
            setDelivery(delivery.filter(d => d !== item));
        } else {
            setDelivery([...delivery, item]);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!name.trim()) {
            if (toast?.error) toast.error('Please enter a descriptive name for the alert.');
            return;
        }

        setIsSaving(true);
        try {
            const ruleType = alertType.toLowerCase().includes('attendance') ? 'attendance'
                : alertType.toLowerCase().includes('security') ? 'security'
                : 'activity';

            await alertService.createAlertRule({
                name: name.trim(),
                type: ruleType,
                trigger: alertType,
                scope: scope
            });

            if (toast?.success) {
                toast.success(`Alert rule "${name.trim()}" created successfully in database!`);
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl shadow-warm-lg animate-scale-in overflow-hidden border border-[#E5DED2] dark:border-[#384232]">
                {/* Header */}
                <div className="px-6 sm:px-8 py-5 border-b border-[#E5DED2] dark:border-[#384232] flex items-center justify-between bg-[#FBF9F5] dark:bg-[#252B20]">
                    <h2 className="font-serif text-xl font-semibold text-[#29291F] dark:text-[#F5F1E9]">Create New Alert</h2>
                    <button onClick={onClose} className="text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] transition-colors cursor-pointer p-1 rounded-lg">
                        <X size={18} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
                    {/* Alert Type */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">Alert Type</label>
                        <div className="relative">
                            <select
                                value={alertType}
                                onChange={(e) => setAlertType(e.target.value)}
                                className="w-full bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#E5DED2] dark:border-[#384232] rounded-xl px-4 py-2.5 text-xs font-medium text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="Activity Level">Activity Level</option>
                                <option value="Productivity Threshold">Productivity Threshold</option>
                                <option value="Manual Time Entry">Manual Time Entry</option>
                                <option value="Continuous Idle">Continuous Idle</option>
                                <option value="Late Arrival">Late Arrival</option>
                                <option value="Prohibited App">Prohibited Application</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777367] pointer-events-none" />
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter a descriptive name for your alert (e.g. Inactive Warning)"
                            className="w-full bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#E5DED2] dark:border-[#384232] rounded-xl px-4 py-2.5 text-xs font-medium text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] focus:border-[#B9955B] outline-none transition-all"
                        />
                    </div>

                    {/* Scope */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">Scope</label>
                        <div className="relative">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsScopeOpen(!isScopeOpen)}
                                    className="flex items-center gap-2 px-5 py-2 border border-[#E5DED2] dark:border-[#384232] bg-[#EEE8DD] dark:bg-[#1E2419] text-[#30382B] dark:text-[#F5F1E9] rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#E5DED2] transition-colors cursor-pointer"
                                >
                                    <span>{scope}</span>
                                    <ChevronDown size={13} className={isScopeOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                </button>
                                <span className="text-xs text-[#777367]">Current scope applied to this alert</span>
                            </div>
                            {isScopeOpen && (
                                <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-[#FBF9F5] dark:bg-[#252B20] border border-[#E5DED2] dark:border-[#384232] rounded-xl shadow-warm-lg p-1.5 space-y-1">
                                    {scopeOptions.map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => { setScope(opt); setIsScopeOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${scope === opt ? 'bg-[#EEE8DD] text-[#30382B] dark:bg-[#30382B] dark:text-[#FDFBF7]' : 'text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#EEE8DD]/50'}`}
                                        >
                                            {opt}
                                            {scope === opt && <Check size={14} className="text-[#B9955B]" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Days */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">Days</label>
                            <button
                                type="button"
                                onClick={() => setSelectedDays(days)}
                                className="text-xs font-semibold text-[#B9955B] hover:text-[#A17D45] uppercase tracking-wider cursor-pointer"
                            >
                                Select All
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {days.map(day => {
                                const isSelected = selectedDays.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`flex-1 h-12 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${isSelected
                                                ? 'border-[#30382B] bg-[#30382B] text-[#FDFBF7] shadow-warm-xs'
                                                : 'border-[#E5DED2] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] text-[#777367] hover:border-[#B9955B]'
                                            }`}
                                    >
                                        <div className={`w-3.5 h-3.5 border rounded-xs flex items-center justify-center transition-colors ${isSelected ? 'bg-[#B9955B] border-[#B9955B]' : 'border-[#C5BEAF]'
                                            }`}>
                                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-[#FDFBF7]' : 'text-[#777367]'}`}>{day}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recipients */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">Recipients</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Only Me', 'Specific Users', 'All Admins'].map(opt => {
                                const isSelected = recipient === opt;
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setRecipient(opt)}
                                        className={`flex items-center gap-2.5 px-3.5 py-2.5 border rounded-xl transition-all cursor-pointer ${isSelected
                                                ? 'border-[#30382B] bg-[#30382B]/10 text-[#30382B] dark:border-[#B9955B] dark:bg-[#B9955B]/15 dark:text-[#F5F1E9]'
                                                : 'border-[#E5DED2] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] text-[#777367] hover:border-[#B9955B]'
                                            }`}
                                    >
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-[#30382B] dark:border-[#B9955B]' : 'border-[#C5BEAF]'
                                            }`}>
                                            {isSelected && <div className="w-1.5 h-1.5 bg-[#30382B] dark:bg-[#B9955B] rounded-full" />}
                                        </div>
                                        <span className="text-xs font-semibold">{opt}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Delivery */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">Delivery</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['In App', 'Email'].map(item => {
                                const isSelected = delivery.includes(item);
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => toggleDelivery(item)}
                                        className={`flex items-center gap-2.5 p-3 border rounded-xl transition-all cursor-pointer ${isSelected
                                                ? 'border-[#30382B] bg-[#30382B]/10 text-[#30382B] dark:border-[#B9955B] dark:bg-[#B9955B]/15 dark:text-[#F5F1E9]'
                                                : 'border-[#E5DED2] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] text-[#777367] hover:border-[#B9955B]'
                                            }`}
                                    >
                                        <div className={`w-3.5 h-3.5 border rounded-xs flex items-center justify-center transition-colors ${isSelected ? 'bg-[#30382B] dark:bg-[#B9955B] border-[#30382B] dark:border-[#B9955B]' : 'border-[#C5BEAF]'
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

                {/* Footer */}
                <div className="p-5 sm:p-6 border-t border-[#E5DED2] dark:border-[#384232] flex justify-end gap-3 bg-[#EEE8DD]/40 dark:bg-[#1E2419]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-5 py-2.5 border border-[#E5DED2] dark:border-[#384232] bg-[#FBF9F5] dark:bg-[#252B20] text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#EEE8DD] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="px-6 py-2.5 bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] rounded-xl text-xs font-semibold uppercase tracking-wider shadow-warm-xs transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={13} className="animate-spin text-[#D3B98D]" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <span>Save Alert</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
