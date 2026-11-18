import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Monitor,
    User,
    UserPlus,
    Users,
    Info,
    Download,
    ChevronRight,
    Apple,
    Laptop,
    Copy,
    Check,
    Plus,
    Trash2,
    Lock,
    Key,
    Building2,
    MapPin,
    Shield,
    Eye,
    EyeOff,
    DollarSign
} from 'lucide-react';
import { useEmployeeStore } from '../store/employeeStore';
import { useTeamStore } from '../store/teamStore';
import { useAuthStore } from '../store/authStore';
import { useOrganizationStore } from '../store/organizationStore';
import { logAction } from '../utils/logAction';
import { useToast } from '../context/ToastContext';
import API_BASE_URL from '../config/api';

export function AddEmployeeModal({ isOpen, onClose, initialTab = 'single' }) {
    const { inviteEmployee, fetchEmployees } = useEmployeeStore();
    const { fetchTeams, teams } = useTeamStore();
    const { user, role } = useAuthStore();
    const { fetchOrganization, organization } = useOrganizationStore();
    const { toast } = useToast();

    // Mode: 'single' | 'batch' | 'agent'
    const [activeTab, setActiveTab] = useState(initialTab || 'single');
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Single Employee Form
    const [singleForm, setSingleForm] = useState({
        fullName: '',
        email: '',
        teamId: '',
        location: 'Office',
        computerType: 'PERSONAL',
        role: 'EMPLOYEE',
        password: '',
        hourlyRate: '',
        status: 'ACTIVE'
    });

    // Batch Employees Form
    const [personalEmployees, setPersonalEmployees] = useState([
        { id: 1, email: '', name: '', team: '', location: 'Office' },
        { id: 2, email: '', name: '', team: '', location: 'Office' },
    ]);

    // Fetch teams and organization info whenever modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab || 'single');
            fetchTeams();
            fetchOrganization();
        }
    }, [isOpen, initialTab]);

    // Set default team once teams load
    useEffect(() => {
        if (teams && teams.length > 0) {
            if (!singleForm.teamId) {
                setSingleForm(prev => ({ ...prev, teamId: teams[0].id }));
            }
            setPersonalEmployees(prev => prev.map(emp => ({
                ...emp,
                team: emp.team || teams[0].id
            })));
        }
    }, [teams]);

    if (!isOpen) return null;

    const resolvedOrgId = user?.organizationId || user?.employee?.organizationId || organization?.id || 'default-org-id';

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let retVal = "";
        for (let i = 0; i < 10; i++) {
            retVal += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setSingleForm(prev => ({ ...prev, password: retVal }));
    };

    const handleCopy = () => {
        const url = `${window.location.origin}/setup-agent`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Agent Setup URL copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadWindows = () => {
        const downloadUrl = `${API_BASE_URL}/agent/download`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', 'EMS-Tracker-latest.exe');
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const addAnotherEmployee = () => {
        setPersonalEmployees(prev => [
            ...prev,
            { id: Date.now(), email: '', name: '', team: teams[0]?.id || '', location: 'Remote' }
        ]);
    };

    const removeEmployee = (id) => {
        if (personalEmployees.length > 1) {
            setPersonalEmployees(prev => prev.filter(emp => emp.id !== id));
        }
    };

    // ── Handle Single Employee Direct Submit ────────────────────────────────
    const handleSingleSubmit = async (e) => {
        e.preventDefault();
        if (!singleForm.fullName.trim() || !singleForm.email.trim()) {
            toast.error("Please enter both Full Name and Email.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                fullName: singleForm.fullName.trim(),
                email: singleForm.email.trim().toLowerCase(),
                teamId: singleForm.teamId || teams[0]?.id || null,
                location: singleForm.location || 'Office',
                computerType: singleForm.computerType || 'PERSONAL',
                role: singleForm.role || 'EMPLOYEE',
                status: singleForm.status || 'ACTIVE',
                organizationId: resolvedOrgId
            };

            if (singleForm.hourlyRate !== '' && !isNaN(Number(singleForm.hourlyRate))) {
                payload.hourlyRate = Number(singleForm.hourlyRate);
            }

            if (singleForm.password && singleForm.password.trim().length >= 6) {
                payload.password = singleForm.password.trim();
            }

            const res = await inviteEmployee(payload);
            toast.success(`Employee "${singleForm.fullName}" added to database successfully!`);
            logAction(user?.name || 'Admin', 'Owner', 'Create', 'Employee', `Created employee: "${singleForm.fullName}"`);
            
            await fetchEmployees();
            setSingleForm({
                fullName: '',
                email: '',
                teamId: teams[0]?.id || '',
                location: 'Office',
                computerType: 'PERSONAL',
                role: 'EMPLOYEE',
                password: '',
                hourlyRate: '',
                status: 'ACTIVE'
            });
            onClose();
        } catch (err) {
            console.error('[AddEmployeeModal] Submit failed:', err);
            const msg = err.response?.data?.message || err.message || "Failed to add employee";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Handle Batch Invite Submit ──────────────────────────────────────────
    const handleBatchSubmit = async () => {
        const validEmployees = personalEmployees.filter(emp => emp.email?.trim() && emp.name?.trim());
        if (validEmployees.length === 0) {
            toast.error("Please fill in at least one employee with Name and Email.");
            return;
        }

        setSubmitting(true);
        let successCount = 0;
        let lastError = null;

        for (const emp of validEmployees) {
            try {
                const selectedTeamId = emp.team || teams[0]?.id || null;
                await inviteEmployee({
                    fullName: emp.name.trim(),
                    email: emp.email.trim().toLowerCase(),
                    teamId: selectedTeamId,
                    location: emp.location || 'Remote',
                    computerType: 'PERSONAL',
                    status: 'ACTIVE',
                    organizationId: resolvedOrgId
                });
                successCount++;
            } catch (err) {
                console.error('Batch item failed:', err);
                lastError = err.response?.data?.message || err.message;
            }
        }

        setSubmitting(false);
        if (successCount > 0) {
            toast.success(`Successfully added ${successCount} employee(s) to database!`);
            await fetchEmployees();
            onClose();
        } else if (lastError) {
            toast.error(lastError);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden p-2 sm:p-4">
            <div className="absolute inset-0 transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 shrink-0">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Add New Employee</h2>
                            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Create a new team member and link tracking settings</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 pt-3 sm:pt-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto scrollbar-none">
                    {[
                        { id: 'single', label: 'Manual Add Employee', icon: UserPlus },
                        { id: 'batch', label: 'Batch Invite', icon: Users },
                        { id: 'agent', label: 'Agent Installer', icon: Monitor }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl text-xs font-black transition-all border-b-2 -mb-px whitespace-nowrap ${
                                    isActive
                                        ? 'border-primary-600 text-primary-600 bg-white dark:bg-slate-900'
                                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                <Icon size={14} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Body Content */}
                <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
                    {/* ── 1. Single Employee Form (Direct Add) ─────────────────── */}
                    {activeTab === 'single' && (
                        <form onSubmit={handleSingleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                                        Full Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Rahul Sharma"
                                        value={singleForm.fullName}
                                        onChange={(e) => setSingleForm({ ...singleForm, fullName: e.target.value })}
                                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                                        Email Address <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="rahul@company.com"
                                        value={singleForm.email}
                                        onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                                        Department / Team
                                    </label>
                                    <select
                                        value={singleForm.teamId}
                                        onChange={(e) => setSingleForm({ ...singleForm, teamId: e.target.value })}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 transition-all cursor-pointer"
                                    >
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                        {teams.length === 0 && <option value="">General Team</option>}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                                        Role
                                    </label>
                                    <select
                                        value={singleForm.role}
                                        onChange={(e) => setSingleForm({ ...singleForm, role: e.target.value })}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 transition-all cursor-pointer"
                                    >
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="MANAGER">Manager</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                                        Status
                                    </label>
                                    <select
                                        value={singleForm.status}
                                        onChange={(e) => setSingleForm({ ...singleForm, status: e.target.value })}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 transition-all cursor-pointer"
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INVITED">Pending / Invited</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                                        Work Mode
                                    </label>
                                    <select
                                        value={singleForm.location}
                                        onChange={(e) => setSingleForm({ ...singleForm, location: e.target.value })}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 transition-all cursor-pointer"
                                    >
                                        <option value="Office">Office</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                                        Computer Type
                                    </label>
                                    <select
                                        value={singleForm.computerType}
                                        onChange={(e) => setSingleForm({ ...singleForm, computerType: e.target.value })}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 transition-all cursor-pointer"
                                    >
                                        <option value="PERSONAL">Personal Computer</option>
                                        <option value="COMPANY">Company Computer</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                                        Hourly Rate ($/hr)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={singleForm.hourlyRate}
                                            onChange={(e) => setSingleForm({ ...singleForm, hourlyRate: e.target.value })}
                                            className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 transition-all"
                                        />
                                        <DollarSign size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                        <Key size={11} /> Login Password (Optional)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        className="text-[10px] font-bold text-primary-600 hover:underline"
                                    >
                                        Generate Password
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min 6 characters (or leave empty to send setup email)"
                                        value={singleForm.password}
                                        onChange={(e) => setSingleForm({ ...singleForm, password: e.target.value })}
                                        className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 px-1">
                                    When set, creates a direct web & desktop agent login account in database immediately.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    <UserPlus size={15} />
                                    <span>{submitting ? 'Saving to DB...' : 'Save & Add Employee'}</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── 2. Batch Invite ──────────────────────────────────────── */}
                    {activeTab === 'batch' && (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-500 font-medium">
                                Add multiple employees simultaneously. They will be added to the database and sent setup instructions.
                            </p>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {personalEmployees.map((emp, idx) => (
                                    <div key={emp.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                                        <div className="col-span-4">
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={emp.name}
                                                onChange={(e) => {
                                                    const updated = [...personalEmployees];
                                                    updated[idx].name = e.target.value;
                                                    setPersonalEmployees(updated);
                                                }}
                                                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <input
                                                type="email"
                                                placeholder="email@company.com"
                                                value={emp.email}
                                                onChange={(e) => {
                                                    const updated = [...personalEmployees];
                                                    updated[idx].email = e.target.value;
                                                    setPersonalEmployees(updated);
                                                }}
                                                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <select
                                                value={emp.team}
                                                onChange={(e) => {
                                                    const updated = [...personalEmployees];
                                                    updated[idx].team = e.target.value;
                                                    setPersonalEmployees(updated);
                                                }}
                                                className="w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                                            >
                                                {teams.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                                {teams.length === 0 && <option value="">General Team</option>}
                                            </select>
                                        </div>
                                        <div className="col-span-1 flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removeEmployee(emp.id)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addAnotherEmployee}
                                className="flex items-center gap-1.5 text-xs font-black text-primary-600 hover:underline"
                            >
                                <Plus size={14} /> Add Another Row
                            </button>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBatchSubmit}
                                    disabled={submitting}
                                    className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Saving to DB...' : 'Save & Invite All'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── 3. Agent Download (Company Computers) ───────────────── */}
                    {activeTab === 'agent' && (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-500 font-medium">
                                For company-owned desktops/laptops, install the agent software directly or share the installer URL.
                            </p>

                            <div
                                onClick={handleDownloadWindows}
                                className="flex items-center justify-between p-4 border-2 border-primary-100 dark:border-primary-900/40 bg-primary-50/30 dark:bg-primary-900/10 rounded-2xl cursor-pointer hover:border-primary-400 transition-all group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-md">
                                        <Monitor size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900 dark:text-white">Windows Desktop Agent (.exe)</h4>
                                        <p className="text-[10px] text-slate-400 font-semibold">Native agent with auto-start, tray, and stealth support</p>
                                    </div>
                                </div>
                                <Download size={18} className="text-primary-600 group-hover:translate-y-0.5 transition-transform" />
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                                    Agent Setup Web URL
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                                        {window.location.origin}/setup-agent
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors"
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        <span>{copied ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default AddEmployeeModal;
