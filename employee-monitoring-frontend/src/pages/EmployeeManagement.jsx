import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Search,
    Filter,
    Plus,
    MoreVertical,
    Mail,
    Phone,
    MapPin,
    Shield,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Globe,
    X,
    Eye,
    EyeOff,
    Edit,
    Trash2,
    UserPlus,
    Users,
    Bell,
    UserCheck,
    Info,
    ShieldCheck,
    Lock,
    Clock,
    Copy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '../store/employeeStore';
import { useTeamStore } from '../store/teamStore';
import { useAuthStore } from '../store/authStore';
import { useOrganizationStore } from '../store/organizationStore';
import { useRealTime } from '../hooks/RealTimeContext';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import { useToast } from '../context/ToastContext';
import { subscribeStaffStatus } from '../utils/staffSync';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

// --- Reusable Modal Component ---
const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = "max-w-md" }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div
                className={cn(
                    "w-full bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl p-5 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5DED2] dark:border-[#384232] animate-in zoom-in-95 duration-200 relative z-10",
                    maxWidth
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5 sm:mb-8">
                    <div>
                        <h3 className="font-serif text-2xl font-bold text-[#29291F] dark:text-[#F5F1E9] leading-none">{title}</h3>
                        {subtitle && <p className="text-xs font-semibold text-[#777367] mt-1.5 uppercase tracking-wider">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="h-9 w-9 rounded-xl bg-[#EEE8DD] hover:bg-[#E5DED2] text-[#777367] hover:text-[#29291F] dark:bg-[#1E2419] dark:hover:bg-[#2E362A] flex items-center justify-center transition-all cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
};

// --- New Components for Privacy Controls ---

const TransparencyModal = ({ isOpen, onClose, employee }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Transparency Dashboard"
            subtitle={employee?.name}
            maxWidth="max-w-lg"
        >
            <div className="space-y-4 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tracking Hours</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock size={14} className="text-primary-500" /> 09:00 - 18:00
                        </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Frequency</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-500" /> Every 5 Min
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Monitored Data Types</h4>
                    {[
                        { name: 'Application Tracking', status: 'Enabled', desc: 'Records active window titles and usage duration.' },
                        { name: 'Screenshot Monitoring', status: 'Smart Blur', desc: 'Captures screen every 5-10 mins with sensitive data blurring.' },
                        { name: 'Location Tracking', status: 'Shift Only', desc: 'GPS tracking active only during designated work hours.' },
                        { name: 'Activity Levels', status: 'Enabled', desc: 'Keystroke and mouse movement frequency (no logging).' }
                    ].map((type, i) => (
                        <div key={i} className="group p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/40 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                <span className="text-sm font-black text-slate-800 dark:text-slate-200">{type.name}</span>
                                <span className="w-fit text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 uppercase tracking-tighter">
                                    {type.status}
                                </span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-400 leading-tight">{type.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/20 flex gap-3 items-start mb-8">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                    Last monitoring activity detected 4 minutes ago. All data is encrypted and subject to the company's Privacy Policy.
                </p>
            </div>

            <button
                onClick={onClose}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                Dismiss Dashboard
            </button>
        </Modal>
    );
};

const PrivacyControlsPanel = ({ isExpanded, toggleExpand }) => {
    return (
        <div className={cn(
            "rounded-[2.5rem] border transition-all duration-500 overflow-hidden",
            isExpanded
                ? "bg-white dark:bg-slate-900 shadow-2xl border-primary-100 dark:border-primary-900/30 p-5 md:p-8"
                : "bg-slate-50/80 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 p-5 md:p-6"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-5">
                    <div className={cn(
                        "h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0",
                        isExpanded ? "bg-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none" : "bg-white dark:bg-slate-800 text-slate-400 shadow-sm"
                    )}>
                        <Shield size={isExpanded ? 20 : 18} strokeWidth={isExpanded ? 2.5 : 2} />
                    </div>
                    <div>
                        <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight">Privacy & Monitoring Controls</h2>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5">Enterprise-level data governance & transparency settings</p>
                    </div>
                </div>
                <button
                    onClick={toggleExpand}
                    className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all group shrink-0"
                >
                    <ChevronDown size={20} className={cn("transition-transform duration-500", isExpanded && "rotate-180")} />
                </button>
            </div>

            {isExpanded && (
                <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 fade-in duration-500">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-black text-slate-800 dark:text-slate-200">Work-Hours Monitoring</p>
                                <p className="text-[11px] font-medium text-slate-400">Auto pause tracking outside shift</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600 shadow-inner"></div>
                            </label>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-900/20 flex items-center gap-3">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Globally Enforced</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-800 dark:text-slate-200">Sensitive Data Protection</p>
                            <p className="text-[11px] font-medium text-slate-400">Global screenshot privacy mode</p>
                        </div>
                        <div className="relative group">
                            <select className="w-full h-11 pl-4 pr-10 rounded-xl border-2 border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-200 appearance-none focus:border-primary-500 focus:bg-white transition-all cursor-pointer outline-none">
                                <option>Smart Sensitive Blur (Default)</option>
                                <option>Partial Interface Blur</option>
                                <option>Total Content Privacy</option>
                                <option>Disable Screenshotting</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-800 dark:text-slate-200">Policy Compliance</p>
                            <p className="text-[11px] font-medium text-slate-400">Require employee acknowledgement</p>
                        </div>
                        <button className="w-full h-11 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-md">
                            Broadcast New Policy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

{/* MergeEmployeesModal removed */}

const EditEmployeeModal = ({ isOpen, onClose, employee, onUpdate }) => {
    const toast = useToast();
    const { teams } = useTeamStore();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: 'EMPLOYEE',
        teamId: '',
        location: '',
        hourlyRate: 0,
        status: '',
        password: ''
    });

    useEffect(() => {
        if (employee) {
            let initialLocation = employee.workMode || 'Remote';
            if (employee.location && !employee.location.startsWith('—')) {
                initialLocation = employee.location;
            }
            setFormData({
                fullName: employee.name || employee.fullName || '',
                email: employee.email || '',
                role: employee.role || 'EMPLOYEE',
                teamId: employee.teamId || '',
                location: initialLocation,
                hourlyRate: employee.hourlyRate || 0,
                status: (employee.status || 'ACTIVE').toUpperCase(),
                password: ''
            });
        }
    }, [employee, isOpen]);

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let retVal = "";
        for (let i = 0; i < 12; i++) {
            retVal += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setFormData({ ...formData, password: retVal });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final validation and data prep
        const submitData = { ...formData };

        // Clean teamId: if empty string or not selected, send null so foreign key check succeeds
        if (!submitData.teamId || submitData.teamId === '') {
            submitData.teamId = null;
        }

        // Clean location if it contains display format like "— (Office)"
        if (submitData.location) {
            const loc = submitData.location.trim();
            if (loc.startsWith('— (')) {
                submitData.location = loc.replace('— (', '').replace(')', '').trim();
            }
        }

        // Remove empty password so it doesn't fail backend min(6) validation
        if (!submitData.password || submitData.password.trim() === '') {
            delete submitData.password;
        }

        // Ensure hourlyRate is a valid number
        submitData.hourlyRate = isNaN(submitData.hourlyRate) ? 0 : submitData.hourlyRate;

        try {
            await onUpdate(employee.id, submitData);
            onClose();
        } catch (error) {
            // Error is handled by apiClient global toast
            console.error("Update failed:", error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Employee" subtitle={employee?.name} maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-xs font-bold outline-none focus:border-primary-500 transition-all"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-xs font-bold outline-none focus:border-primary-500 transition-all"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Role</label>
                        <select
                            value={formData.role?.toUpperCase() || 'EMPLOYEE'}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value.toUpperCase() })}
                            className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-xs font-bold outline-none focus:border-primary-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="EMPLOYEE">Employee</option>
                            <option value="MANAGER">Manager</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
                        <select
                            value={formData.status.toUpperCase()}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value.toUpperCase() })}
                            className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-xs font-bold outline-none focus:border-primary-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="IDLE">Idle</option>
                            <option value="OFFLINE">Offline</option>
                            <option value="INVITED">Invited</option>
                            <option value="DEACTIVATED">Deactivated</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Team</label>
                    <select
                        value={formData.teamId}
                        onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-xs font-bold outline-none focus:border-primary-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Select Team</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Hourly Rate ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.hourlyRate || 0}
                            onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                setFormData({ ...formData, hourlyRate: val });
                            }}
                            className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-xs font-bold outline-none focus:border-primary-500 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-xs font-bold outline-none focus:border-primary-500 transition-all"
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Reset Password (Optional)
                        </label>
                        <button
                            type="button"
                            onClick={generatePassword}
                            className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-all"
                        >
                            Generate Password
                        </button>
                    </div>
                    <div className="relative group">
                        <input
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={formData.status === 'INVITED' ? "Password not set - Enter to create" : "Leave blank to keep existing (********)"}
                            className={cn(
                                "w-full h-11 pl-4 pr-10 rounded-xl border-2 bg-slate-50 text-xs font-bold outline-none transition-all",
                                formData.status === 'INVITED' ? "border-amber-200 focus:border-amber-500" : "border-slate-100 focus:border-primary-500"
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {formData.status === 'INVITED' && !formData.password && (
                        <p className="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-1 px-1">
                            <Info size={12} strokeWidth={3} />
                            User has not set their password yet.
                        </p>
                    )}
                </div>
                <div className="flex gap-3 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-primary-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-primary-700 shadow-xl transition-all">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
};

const DeleteConfirmationModal = ({ isOpen, onClose, employee, onConfirm }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Employee" subtitle="Security Confirmation" maxWidth="max-w-md">
            <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center">
                    <p className="text-sm font-bold text-rose-700">
                        Are you sure you want to <span className="uppercase underline">permanently delete</span> <span className="font-black underline">{employee?.name}</span>?
                    </p>
                    <p className="text-[11px] text-rose-500 mt-2">
                        This action cannot be undone. All related data will be removed from the database.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                    <button
                        onClick={() => { onConfirm(employee.id); onClose(); }}
                        className="flex-1 py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-rose-700 shadow-xl transition-all"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const NotificationsPanel = ({ isOpen, onClose }) => {
    const notifications = [
        { id: 1, title: 'New Employee Added', time: '2 mins ago', icon: <UserPlus size={16} /> },
        { id: 2, title: 'Merge Request Completed', time: '1 hour ago', icon: <Shield size={16} /> },
        { id: 3, title: 'Agent Offline: Robert Fox', time: '3 hours ago', icon: <Info size={16} /> },
    ];

    if (!isOpen) return null;

    return (
        <div className="absolute top-16 right-0 z-[120] w-80 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Notifications</h4>
                <button onClick={onClose} className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Mark all as read</button>
            </div>
            <div className="space-y-4">
                {notifications.map(n => (
                    <div key={n.id} className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary-600 transition-colors">
                            {n.icon}
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white">{n.title}</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-6 py-3 border-t border-slate-50 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">View All Activity</button>
        </div>
    );
};

const EmployeeActionsDrawer = ({ isOpen, onClose, employee, onUpdateStatus }) => {
    if (!isOpen || !employee) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-[#EEE8DD] dark:bg-[#252B20] h-full shadow-warm-lg border-l border-[#D6CDBC] dark:border-[#384232] animate-in slide-in-from-right duration-500 flex flex-col">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Quick Actions</h3>
                        <button onClick={onClose} className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-[2rem] border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden">
                            <img src={employee.avatar} className="h-full w-full object-cover" alt="" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{employee.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    employee.status === 'active' ? "bg-emerald-500" : "bg-slate-400"
                                )}></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{employee.status}</p>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                                    (employee.role || 'EMPLOYEE').toUpperCase() === 'ADMIN'
                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                        : (employee.role || 'EMPLOYEE').toUpperCase() === 'MANAGER'
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                )}>
                                    {(employee.role || 'EMPLOYEE').toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Manage Status</h5>
                        <div className="grid grid-cols-1 gap-3">
                            {employee.status === 'deactivated' ? (
                                <button
                                    onClick={() => onUpdateStatus(employee.id, 'active')}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                            <UserCheck size={20} />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-tight">Reactivate Employee</span>
                                    </div>
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => onUpdateStatus(employee.id, 'DEACTIVATED')}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-700 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                            <EyeOff size={20} />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-tight">Deactivate Monitoring</span>
                                    </div>
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}

                            <button
                                onClick={() => { /* Placeholder for real app */ }}
                                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-600 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <Shield size={20} />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-tight">Reset Private Data</span>
                                </div>
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Employee Info</h5>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{typeof employee.team === 'object' ? (employee.team?.name || 'No Team') : (employee.team || 'No Team')}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{employee.location}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{employee.role || 'Employee'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-[1.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Close Actions
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const AdvancedCalendar = ({ isOpen, onClose, selectedPreset, onSelectPreset, triggerRef }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date()); // For navigation
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const calendarRef = useRef(null);

    useLayoutEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const calendarWidth = 540;
            const calendarHeight = 440; // Approximate

            let top = rect.bottom + window.scrollY + 12; // Increased from 8 to 12
            let left = rect.left + window.scrollX;

            // Prevent horizontal overflow
            if (left + calendarWidth > window.innerWidth) {
                left = window.innerWidth - calendarWidth - 20;
            }
            if (left < 20) left = 20;

            setCoords({ top, left });
        }
    }, [isOpen, triggerRef]);

    if (!isOpen) return null;

    const presets = [
        'Today', 'Yesterday', 'This Week', 'Last 7 Days',
        'Previous Week', 'This Month', 'Previous Month',
        'Last 3 Months', 'Last 6 Months'
    ];

    // Helper to get days for the current month view
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Add empty slots for days before the 1st
        for (let i = 0; i < firstDay; i++) days.push(null);
        // Add actual days
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        return days;
    };

    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'short' });
    const year = currentMonth.getFullYear();

    const calendarContent = (
        <div
            ref={calendarRef}
            style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                position: 'absolute'
            }}
            className="z-[9999] w-[540px] bg-[#EEE8DD] dark:bg-[#252B20] backdrop-blur-md rounded-2xl shadow-warm-lg border border-[#D6CDBC] dark:border-[#384232] flex overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
            {/* Left side: Calendar */}
            <div className="flex-1 p-8 border-r border-slate-50 dark:border-slate-800">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calendar</span>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                            <Globe size={12} className="text-primary-600" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Employees' Time Zone</span>
                            <ChevronDown size={12} className="text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{monthName} {year}</span>
                        <ChevronDown size={14} className="text-slate-400" />
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-y-2 text-center mb-4">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <div key={d} className="text-[10px] font-black text-slate-300 uppercase">{d}</div>
                    ))}
                    {days.map((day, i) => (
                        <div key={i} className="flex items-center justify-center h-10">
                            {day && (
                                <button
                                    className={cn(
                                        "h-8 w-8 rounded-full text-[11px] font-bold transition-all",
                                        day === 27 && monthName === 'Feb' ? "bg-primary-600 text-white shadow-lg shadow-primary-200 font-black" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    )}
                                >
                                    {day}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-50 dark:border-slate-800">
                    <button onClick={onClose} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                    <button onClick={onClose} className="px-8 py-2.5 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-100 dark:shadow-none transition-all">Apply</button>
                </div>
            </div>

            {/* Right side: Presets */}
            <div className="w-52 bg-slate-50/50 dark:bg-slate-800/30 p-8 flex flex-col gap-1 overflow-y-auto max-h-[500px] scrollbar-thin">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Preset Filters</h4>
                {presets.map(preset => (
                    <button
                        key={preset}
                        onClick={() => { onSelectPreset(preset); onClose(); }}
                        className={cn(
                            "w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all",
                            selectedPreset === preset ? "bg-primary-100/50 text-primary-600 font-black" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                    >
                        {preset}
                    </button>
                ))}
            </div>
        </div>
    );

    return createPortal(calendarContent, document.body);
};

const EmployeeRow = ({ employee, onEdit, onDelete, onTransparencyClick, visibleColumns }) => {
    const navigate = useNavigate();
    const { role: userRole } = useAuthStore();
    const rolePath = userRole ? `/${userRole.toLowerCase()}` : '';
    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef(null);
    const { employees: realTimeEmps = [] } = useRealTime();

    // Match employee against live real-time telemetry
    const liveMatch = realTimeEmps.find(rt => 
        String(rt.id) === String(employee.id) || 
        String(rt.userId) === String(employee.id) ||
        String(rt.employeeId) === String(employee.id) ||
        (rt.email && employee.email && rt.email.toLowerCase() === employee.email.toLowerCase())
    );

    const liveStatus = (liveMatch?.status || liveMatch?.accountStatus || '').toLowerCase();
    const dbStatus = (employee.status || '').toLowerCase();

    const isExplicitlyWorking = (liveStatus === 'online' || liveStatus === 'active') && 
                                liveMatch?.isOnBreak !== true && 
                                liveMatch?.isIdle !== true;

    const isLiveBreak = !isExplicitlyWorking && (
        liveMatch?.isOnBreak === true || 
        liveStatus === 'break' || 
        (dbStatus === 'break' && liveStatus !== 'online' && liveStatus !== 'active')
    );

    const isLiveIdle = !isLiveBreak && !isExplicitlyWorking && (
        liveStatus === 'idle' || liveStatus === 'afk' || liveStatus === 'passive' || liveStatus === 'idle_warning' ||
        liveMatch?.isIdle === true ||
        (liveMatch?.idleTime || 0) >= 60 ||
        (liveMatch?.idleMinutes || 0) >= 1 ||
        (typeof employee.idle === 'number' && employee.idle >= 60 && liveStatus !== 'online') ||
        (dbStatus === 'idle' || dbStatus === 'afk')
    );

    const isLiveOnline = isExplicitlyWorking ||
                         liveStatus === 'online' || liveStatus === 'active' ||
                         dbStatus === 'online' || dbStatus === 'active' ||
                         liveMatch?.isOnline || liveMatch?.agentStatus === 'active' ||
                         isLiveIdle || isLiveBreak;

    let badgeText = 'Offline';
    let badgeClass = 'bg-[#EEE8DD] text-[#777367] dark:bg-[#1E2419] dark:text-[#B8B3A7] border border-[#D6CDBC] dark:border-[#384232]';
    let dotClass = 'bg-[#9E988A]';

    if (dbStatus === 'deactivated') {
        badgeText = 'Deactivated';
        badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
        dotClass = 'bg-rose-500';
    } else if (dbStatus === 'pending' || dbStatus === 'invited') {
        badgeText = 'Invited';
        badgeClass = 'bg-[#B9955B]/15 text-[#A17D45] dark:text-[#D3B98D] border border-[#B9955B]/30';
        dotClass = 'bg-[#B9955B]';
    } else if (isLiveBreak) {
        badgeText = 'On Break';
        badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 dark:border-amber-800';
        dotClass = 'bg-amber-500';
    } else if (isLiveIdle) {
        badgeText = 'AFK';
        badgeClass = 'bg-amber-100/90 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
        dotClass = 'bg-amber-500 animate-pulse';
    } else if (isLiveOnline) {
        badgeText = 'Working';
        badgeClass = 'bg-[#EAEFEA] dark:bg-[#1E2B20] text-[#5E7D64] dark:text-[#8BB394] border border-[#C5D7C7] dark:border-[#325238]';
        dotClass = 'bg-[#5E7D64] animate-pulse';
    }

    const workTimeDisplay = (() => {
        if (typeof liveMatch?.activeHours === 'number' && liveMatch.activeHours > 0) {
            const hrs = Math.floor(liveMatch.activeHours);
            const mins = Math.round((liveMatch.activeHours % 1) * 60);
            return `${hrs}h ${String(mins).padStart(2, '0')}m`;
        }
        if (typeof liveMatch?.totalWorkHours === 'number' && liveMatch.totalWorkHours > 0) {
            const hrs = Math.floor(liveMatch.totalWorkHours);
            const mins = Math.round((liveMatch.totalWorkHours % 1) * 60);
            return `${hrs}h ${String(mins).padStart(2, '0')}m`;
        }
        if (typeof employee.workTime === 'string' && employee.workTime) {
            return employee.workTime;
        }
        return '0h 00m';
    })();

    const statusColor = dotClass;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            {/* ── MOBILE CARD (hidden on md+) ── */}
            <tr className="md:hidden border-b border-slate-100 dark:border-slate-800 last:border-0 relative">
                <td className="p-4" colSpan={99}>
                    <div
                        className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs p-5 flex flex-col gap-4 active:scale-[0.98] transition-transform cursor-pointer relative"
                        onClick={() => navigate(`${rolePath}/employees/${employee.id}`)}
                    >
                        {/* Status Badge (Top Right) */}
                        <div className={cn("absolute top-5 right-5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0", badgeClass)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
                            <span>{badgeText}</span>
                        </div>

                        {/* Header: Avatar + Info */}
                        <div className="flex items-center gap-4 pr-16">
                            <div className="h-14 w-14 shrink-0 rounded-2xl border-2 border-white dark:border-slate-700 shadow-md overflow-hidden">
                                <img src={employee.avatar} className="h-full w-full object-cover" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-base font-black text-slate-900 dark:text-white truncate leading-tight">{employee.name}</h4>
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                                        (employee.role || 'EMPLOYEE').toUpperCase() === 'ADMIN'
                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                            : (employee.role || 'EMPLOYEE').toUpperCase() === 'MANAGER'
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                    )}>
                                        {(employee.role || 'EMPLOYEE').toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide truncate mt-0.5">{employee.email}</p>
                                <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-tighter">
                                    {typeof employee.team === 'object' ? employee.team?.name : employee.team}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-100/50 dark:border-slate-800/50 flex flex-col gap-0.5">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Location</span>
                                <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 truncate">{employee.location || 'Remote'}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-100/50 dark:border-slate-800/50 flex flex-col gap-0.5">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Work Time</span>
                                <span className="text-[12px] font-black text-slate-700 dark:text-slate-200">{workTimeDisplay}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-100/50 dark:border-slate-800/50 flex flex-col gap-0.5">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Activity</span>
                                <span className="text-[12px] font-black text-slate-700 dark:text-slate-200">0h 00m</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-100/50 dark:border-slate-800/50 flex flex-col gap-0.5">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Productivity</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary-500 w-[85%]" />
                                    </div>
                                    <span className="text-[10px] font-black text-primary-600">85%</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2.5 pt-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`${rolePath}/employees/${employee.id}`); }}
                                className="flex-1 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Eye size={16} /> Profile
                            </button>
                            {/* Privacy button removed */}
                            {userRole === 'ADMIN' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(employee); }}
                                    className="h-11 w-11 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm"
                                >
                                    <Edit size={16} />
                                </button>
                            )}
                            {userRole === 'ADMIN' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(employee); }}
                                    className="h-11 w-11 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </td>
            </tr>

            {/* ── DESKTOP TABLE ROW (hidden below md) ── */}
            <tr
                className="hidden md:table-row group hover:bg-[#EEE8DD]/30 dark:hover:bg-[#1E2419] cursor-pointer transition-all duration-200 border-b border-[#E5DED2]/60 dark:border-[#384232]/60 last:border-0"
                onClick={() => navigate(`${rolePath}/employees/${employee.id}`)}
            >
                {visibleColumns.includes('User') && (
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-[#EEE8DD] text-[#30382B] border border-[#E5DED2] flex items-center justify-center font-bold text-xs tracking-wider">
                                {employee.avatar && !employee.avatar.includes('ui-avatars.com') ? (
                                    <img src={employee.avatar} className="h-full w-full object-cover rounded-xl" alt="" />
                                ) : (
                                    <span>{(employee.name || 'U').slice(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-[#29291F] dark:text-[#F5F1E9] truncate">{employee.name}</p>
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                                        (employee.role || 'EMPLOYEE').toUpperCase() === 'ADMIN'
                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                            : (employee.role || 'EMPLOYEE').toUpperCase() === 'MANAGER'
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                    )}>
                                        {(employee.role || 'EMPLOYEE').toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-[11px] font-medium text-[#777367]">{employee.email}</p>
                            </div>
                        </div>
                    </td>
                )}
                {visibleColumns.includes('Team') && (
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#EEE8DD]/60 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9]">
                            {typeof employee.team === 'object' ? (employee.team?.name || 'No Team') : (employee.team || 'No Team')}
                        </span>
                    </td>
                )}
                {visibleColumns.includes('Location') && (
                    <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#777367] dark:text-[#B8B3A7]">{employee.location || 'Remote'}</span>
                    </td>
                )}
                {visibleColumns.includes('Work Time') && (
                    <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#29291F] dark:text-[#F5F1E9]">{workTimeDisplay}</span>
                    </td>
                )}
                {visibleColumns.includes('Manual Time') && (
                    <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#29291F] dark:text-[#F5F1E9]">0h 00m</span>
                    </td>
                )}
                {visibleColumns.includes('Computer Act.') && (
                    <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#29291F] dark:text-[#F5F1E9]">0h 00m</span>
                    </td>
                )}
                <td className="px-6 py-4">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider", badgeClass)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
                        {badgeText}
                    </span>
                </td>
                <td className="px-6 py-4 text-right relative">
                    <div className="flex items-center justify-end gap-1.5">
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`${rolePath}/employees/${employee.id}`); }}
                            className="h-8 w-8 rounded-lg bg-[#EEE8DD]/60 text-[#777367] hover:text-[#30382B] hover:bg-[#EEE8DD] flex items-center justify-center transition-all shadow-warm-xs cursor-pointer"
                            title="View Profile"
                        >
                            <Eye size={15} />
                        </button>

                        {userRole === 'ADMIN' && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(employee); }}
                                    className="h-8 w-8 rounded-lg bg-[#EEE8DD]/60 text-[#777367] hover:text-[#B9955B] hover:bg-[#EEE8DD] flex items-center justify-center transition-all shadow-warm-xs cursor-pointer"
                                    title="Edit Employee"
                                >
                                    <Edit size={15} />
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(employee); }}
                                    className="h-8 w-8 rounded-lg bg-[#EEE8DD]/60 text-[#777367] hover:text-[#A84B4B] hover:bg-[#FAF3F2] flex items-center justify-center transition-all shadow-warm-xs cursor-pointer"
                                    title="Delete Employee"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </>
                        )}
                    </div>
                </td>
            </tr>
        </>
    );
};

export function EmployeeManagement() {
    const navigate = useNavigate();
    const { employees, fetchEmployees, updateEmployee, removeEmployee, isLoading } = useEmployeeStore();
    const { teams, fetchTeams } = useTeamStore();
    const { role } = useAuthStore();
    const toast = useToast();

    // UI States
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [transparencyEmployee, setTransparencyEmployee] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [deletingEmployee, setDeletingEmployee] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addModalTab, setAddModalTab] = useState('single');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false);
    const [showColumnDropdown, setShowColumnDropdown] = useState(false);

    // Filter & Pagination States
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const [visibleColumns, setVisibleColumns] = useState([
        'User', 'Team', 'Location', 'Productive', 'Unproductive', 'Neutral', 'Idle', 'Break', 'Utilization',
        'Agent Version', 'Created'
    ]);

    useEffect(() => {
        fetchEmployees();
        fetchTeams();

        const interval = setInterval(() => {
            fetchEmployees();
            fetchTeams();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchEmployees, fetchTeams]);

    useEffect(() => {
        const unsubscribe = subscribeStaffStatus(() => {
            fetchEmployees();
        });
        return unsubscribe;
    }, [fetchEmployees]);

    // Filtering Logic
    const filteredEmployees = employees.filter(emp => {
        const q = searchQuery.toLowerCase();
        const teamName = typeof emp.team === 'object' ? emp.team?.name : emp.team;
        const matchesSearch = (emp.name?.toLowerCase() ?? '').includes(q) ||
            (teamName?.toLowerCase() ?? '').includes(q) ||
            (emp.email?.toLowerCase() ?? '').includes(q);
        
        const status = emp.status?.toLowerCase() || '';
        const matchesTab = activeTab === 'All' ? true :
            activeTab === 'Active' ? ['active', 'idle', 'offline', 'online', 'break', 'invited', 'pending'].includes(status) :
            activeTab === 'Pending' ? ['pending', 'invited'].includes(status) :
            activeTab === 'Deactivated' ? status === 'deactivated' :
            status === 'merged';
            
        return matchesSearch && matchesTab;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

    // Handlers
    const handleUpdateEmployee = async (id, data) => {
        await updateEmployee(id, data);
    };

    const handleDeleteEmployee = async (id) => {
        try {
            await removeEmployee(id);
            setShowDeleteModal(false);
            setDeletingEmployee(null);
        } catch (error) {
            // Error handled by apiClient
        }
    };

    return (
        <div className="relative space-y-6 pb-20 max-w-full overflow-x-hidden box-border px-4 md:px-0">
            {/* Modals */}
{/* TransparencyModal removed */}

            <AddEmployeeModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                initialTab={addModalTab}
            />

            <EditEmployeeModal
                isOpen={showEditModal}
                onClose={() => { setShowEditModal(false); setEditingEmployee(null); }}
                employee={editingEmployee}
                onUpdate={handleUpdateEmployee}
            />

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setDeletingEmployee(null); }}
                employee={deletingEmployee}
                onConfirm={handleDeleteEmployee}
            />

            {/* Merge Modal removed */}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                    <h1 className="font-serif text-3xl font-normal text-[#29291F] dark:text-[#F5F1E9] tracking-tight">Employees</h1>
                    <p className="text-xs font-medium text-[#777367] dark:text-[#B8B3A7] mt-0.5">Manage team members, roles and monitoring status</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    {role === 'ADMIN' && (
                        <div className="flex items-center gap-2.5">
                            {/* 1. Add Employee Manually Button */}
                            <button
                                onClick={() => {
                                    setAddModalTab('single');
                                    setShowAddModal(true);
                                }}
                                className="flex items-center justify-center gap-2 rounded-xl bg-[#30382B] hover:bg-[#3C4536] px-5 py-2.5 text-xs font-semibold text-[#FDFBF7] transition-all shadow-warm-sm active:scale-95 cursor-pointer"
                            >
                                <UserPlus size={15} className="text-[#D3B98D]" />
                                <span>+ Add Employee Manually</span>
                            </button>

                            {/* 2. Invite / Batch Button */}
                            <button
                                onClick={() => {
                                    setAddModalTab('batch');
                                    setShowAddModal(true);
                                }}
                                className="flex items-center justify-center gap-2 rounded-xl border border-[#E5DED2] dark:border-[#384232] bg-[#FBF9F5] dark:bg-[#252B20] px-4 py-2.5 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#EEE8DD] transition-all shadow-warm-xs active:scale-95 cursor-pointer"
                            >
                                <Users size={15} className="text-[#777367]" />
                                <span>Invite / Batch</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>


            {/* Table Container */}
            <div className="rounded-2xl border border-[#D6CDBC] dark:border-[#384232] bg-[#EEE8DD] dark:bg-[#252B20] shadow-warm-xs overflow-hidden mb-8">

                {/* Filter Bar */}
                <div className="p-4 md:p-5 border-b border-[#D6CDBC] dark:border-[#384232] bg-[#EEE8DD] dark:bg-[#252B20]">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Status Filter Dropdown */}
                        <div className="relative min-w-[150px] group">
                            <select
                                value={activeTab}
                                onChange={(e) => { setActiveTab(e.target.value); setCurrentPage(1); }}
                                className="w-full h-10 pl-3.5 pr-9 rounded-xl border border-[#E5DED2] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] text-[10px] font-bold uppercase tracking-widest text-[#29291F] dark:text-[#F5F1E9] appearance-none focus:border-[#B9955B] focus:outline-none transition-all cursor-pointer"
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Pending">Pending</option>
                                <option value="Deactivated">Deactive</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777367] pointer-events-none" />
                        </div>

                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777367]" size={15} />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full rounded-xl border border-[#E5DED2] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] pl-9 pr-4 py-2 text-xs font-medium text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="hidden md:table-header-group">
                            <tr className="bg-[#EEE8DD]/40 dark:bg-[#1E2419] border-b border-[#E5DED2] dark:border-[#384232]">
                                {visibleColumns.includes('User') && <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">Employee</th>}
                                {visibleColumns.includes('Team') && <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">Team</th>}
                                {visibleColumns.includes('Location') && <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">Location</th>}
                                {visibleColumns.includes('Work Time') && <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">Work Time</th>}
                                {visibleColumns.includes('Manual Time') && <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">Manual Time</th>}
                                {visibleColumns.includes('Computer Act.') && <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">Computer Act.</th>}
                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">Status</th>
                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-transparent md:divide-[#E5DED2]/60 dark:md:divide-[#384232]/60">
                            {paginatedEmployees.map((emp) => (
                                <EmployeeRow
                                    key={emp.id}
                                    employee={emp}
                                    onSelect={setSelectedEmployee}
                                    onTransparencyClick={setTransparencyEmployee}
                                    onEdit={(e) => { setEditingEmployee(e); setShowEditModal(true); }}
                                    onDelete={(e) => { setDeletingEmployee(e); setShowDeleteModal(true); }}
                                    visibleColumns={visibleColumns}
                                />
                            ))}
                            {filteredEmployees.length === 0 && !isLoading && (
                                <tr className="block md:table-row">
                                    <td colSpan="99" className="px-6 py-20 text-center block md:table-cell">
                                        <div className="flex flex-col items-center justify-center opacity-50">
                                            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                                                <Search size={32} />
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">No employees found</p>
                                            <p className="text-sm font-medium text-slate-500">Try adjusting your filters or search terms</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {isLoading && (
                                <tr className="block md:table-row">
                                    <td colSpan="99" className="px-6 py-20 text-center block md:table-cell">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-8 py-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Showing <span className="text-slate-900 dark:text-white">{startIndex + 1}</span> to <span className="text-slate-900 dark:text-white">{Math.min(startIndex + itemsPerPage, filteredEmployees.length)}</span> of <span className="text-slate-900 dark:text-white">{filteredEmployees.length}</span> members
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-9 px-4 rounded-xl border border-[#D6CDBC] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] text-[10px] font-bold uppercase tracking-wider text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#EAE2D3] disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <ChevronLeft size={14} /> Previous
                            </button>

                            <div className="flex items-center gap-1 mx-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={cn(
                                            "h-9 w-9 rounded-xl text-[10px] font-black transition-all",
                                            currentPage === i + 1
                                                ? "bg-[#30382B] text-[#FDFBF7] shadow-warm-xs"
                                                : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-9 px-4 rounded-xl border border-[#D6CDBC] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] text-[10px] font-bold uppercase tracking-wider text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#EAE2D3] disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Side Drawer */}
            <EmployeeActionsDrawer
                isOpen={!!selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
                employee={selectedEmployee}
                onUpdateStatus={(id, status) => {
                    handleUpdateEmployee(id, { status });
                    setSelectedEmployee(null);
                }}
            />
        </div>
    );
}
