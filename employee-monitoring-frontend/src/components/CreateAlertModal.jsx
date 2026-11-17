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
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl shadow-2xl animate-scale-in overflow-hidden border border-[#E5DED2] dark:border-[#384232]">
                {/* Header */}
                <div className="px-8 py-5 border-b border-[#E5DED2] dark:border-[#384232] flex items-center justify-between">
                    <h2 className="font-serif text-xl font-bold text-[#29291F] dark:text-[#F5F1E9]">Create New Alert</h2>
                    <button onClick={onClose} className="text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Alert Type */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Alert Type</label>
                        <div className="relative">
                            <select
                                value={alertType}
                                onChange={(e) => setAlertType(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="Activity Level">Activity Level</option>
                                <option value="Productivity Threshold">Productivity Threshold</option>
                                <option value="Manual Time Entry">Manual Time Entry</option>
                                <option value="Continuous Idle">Continuous Idle</option>
                                <option value="Late Arrival">Late Arrival</option>
                                <option value="Prohibited App">Prohibited Application</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter a descriptive name for your alert (e.g. Inactive Warning)"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>

                    {/* Scope */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Scope</label>
                        <div className="relative">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsScopeOpen(!isScopeOpen)}
                                    className="flex items-center gap-2 px-6 py-2.5 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-tight hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                >
                                    {scope}
                                    <ChevronDown size={14} className={isScopeOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                </button>
                                <span className="text-xs text-slate-400">Current scope applied to this alert</span>
                            </div>
                            {isScopeOpen && (
                                <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 space-y-1">
                                    {scopeOptions.map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => { setScope(opt); setIsScopeOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between transition-colors ${scope === opt ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                        >
                                            {opt}
                                            {scope === opt && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Days */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Days</label>
                            <button
                                type="button"
                                onClick={() => setSelectedDays(days)}
                                className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
                            >
                                Select All
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {days.map(day => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDay(day)}
                                    className={`flex-1 h-14 border rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${selectedDays.includes(day)
                                            ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                                        }`}
                                >
                                    <div className={`w-4 h-4 border-2 rounded-sm mb-1 flex items-center justify-center transition-colors ${selectedDays.includes(day) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {selectedDays.includes(day) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase ${selectedDays.includes(day) ? 'text-indigo-600' : 'text-slate-500'}`}>{day}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recipients */}
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Recipients</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Only Me', 'Specific Users', 'All Admins'].map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setRecipient(opt)}
                                    className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-all ${recipient === opt
                                            ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20 text-indigo-600'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${recipient === opt ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {recipient === opt && <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                                    </div>
                                    <span className="text-xs font-bold">{opt}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Delivery */}
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Delivery</label>
                        <div className="grid grid-cols-2 gap-4">
                            {['In App', 'Email'].map(item => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => toggleDelivery(item)}
                                    className={`flex items-center gap-3 p-4 border rounded-xl transition-all ${delivery.includes(item)
                                            ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20 text-indigo-600'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center transition-colors ${delivery.includes(item) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {delivery.includes(item) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <span className="text-xs font-bold">{item}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#E5DED2] dark:border-[#384232] flex justify-end gap-3 bg-[#EEE8DD]/30 dark:bg-[#1E2419]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2.5 border border-[#E5DED2] dark:border-[#384232] bg-[#FBF9F5] dark:bg-[#252B20] text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#EEE8DD] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="px-7 py-2.5 bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] rounded-xl text-xs font-bold uppercase tracking-wider shadow-warm-sm transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={14} className="animate-spin text-[#D3B98D]" />
                                Saving...
                            </>
                        ) : (
                            'Save Alert'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
