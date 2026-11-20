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
    const [invitedSuccess, setInvitedSuccess] = useState(null);

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
        status: 'INVITED'
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
            setInvitedSuccess(null);
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

    const liveBackendUrl = (API_BASE_URL && !API_BASE_URL.includes('localhost'))
        ? `${API_BASE_URL}/agent/download`
        : 'https://insight-pool-production.up.railway.app/api/agent/download';
    const downloadAgentUrl = liveBackendUrl;

    const handleCopy = () => {
        navigator.clipboard.writeText(downloadAgentUrl);
        setCopied(true);
        toast.success("Live direct download link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadWindows = () => {
        const link = document.createElement('a');
        link.href = downloadAgentUrl;
        link.setAttribute('download', 'EMS-Tracker-latest.exe');
        link.target = '_blank';
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
            const hasPassword = singleForm.password && singleForm.password.trim().length >= 6;
            const chosenStatus = hasPassword ? (singleForm.status || 'ACTIVE') : 'INVITED';
            const payload = {
                fullName: singleForm.fullName.trim(),
                email: singleForm.email.trim().toLowerCase(),
                teamId: singleForm.teamId || teams[0]?.id || null,
                location: singleForm.location || 'Office',
                computerType: singleForm.computerType || 'PERSONAL',
                role: singleForm.role || 'EMPLOYEE',
                status: chosenStatus,
                organizationId: resolvedOrgId
            };

            if (singleForm.hourlyRate !== '' && !isNaN(Number(singleForm.hourlyRate))) {
                payload.hourlyRate = Number(singleForm.hourlyRate);
            }

            if (hasPassword) {
                payload.password = singleForm.password.trim();
            }

            const res = await inviteEmployee(payload);
            toast.success(`Employee "${singleForm.fullName}" added to database successfully!`);
            logAction(user?.name || 'Admin', user?.role || 'Admin', 'Create', 'Employee', `Created employee: "${singleForm.fullName}"`);

            await fetchEmployees();

            if (res?.setupLink) {
                setInvitedSuccess({
                    fullName: singleForm.fullName.trim(),
                    email: singleForm.email.trim().toLowerCase(),
                    setupLink: res.setupLink,
                    emailSent: res.emailSent,
                    emailSimulated: res.emailSimulated,
                    status: chosenStatus
                });
            } else {
                setSingleForm({
                    fullName: '',
                    email: '',
                    teamId: teams[0]?.id || '',
                    location: 'Office',
                    computerType: 'PERSONAL',
                    role: 'EMPLOYEE',
                    password: '',
                    hourlyRate: '',
                    status: 'INVITED'
                });
                onClose();
            }
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
                    status: 'INVITED',
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
                {!invitedSuccess && (
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
                                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl text-xs font-black transition-all border-b-2 -mb-px whitespace-nowrap ${isActive
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
                )}

                {/* Body Content */}
                <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
                    {invitedSuccess ? (
                        <div className="space-y-5 py-2 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
                                    <Check size={24} />
                                </div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Employee Added &amp; Saved
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    <strong>{invitedSuccess.fullName}</strong> ({invitedSuccess.email}) has been added to your database with status{' '}
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                        {invitedSuccess.status || 'INVITED'} (Pending)
                                    </span>.
                                </p>
                            </div>

                            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                    <span>Agent Setup &amp; Invitation Link</span>
                                    <span className="text-emerald-600 font-bold">Valid for 7 days</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={invitedSuccess.setupLink}
                                        className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-medium text-slate-800 dark:text-slate-100 select-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(invitedSuccess.setupLink);
                                            toast.success("Invitation link copied to clipboard!");
                                        }}
                                        className="h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                                    >
                                        <Copy size={14} />
                                        <span>Copy Link</span>
                                    </button>
                                </div>
                            </div>

                            {invitedSuccess.emailSimulated ? (
                                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                                    <p className="font-bold flex items-center gap-1.5">
                                        <Info size={14} /> Live SMTP Not Configured (Simulation Mode)
                                    </p>
                                    <p className="text-[10px] text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                                        The backend is currently running with placeholder SMTP credentials in <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env</code>. The email invite was simulated in the server console. You can copy the setup link above and send it directly to the employee or open it to complete agent setup. For automated emails, configure your Gmail App Password in <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env</code>.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                                    <p className="font-bold flex items-center gap-1.5">
                                        <Check size={14} /> Invitation Email Sent
                                    </p>
                                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                                        An email with agent installation steps has been dispatched to {invitedSuccess.email}.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInvitedSuccess(null);
                                        setSingleForm({
                                            fullName: '',
                                            email: '',
                                            teamId: teams[0]?.id || '',
                                            location: 'Office',
                                            computerType: 'PERSONAL',
                                            role: 'EMPLOYEE',
                                            password: '',
                                            hourlyRate: '',
                                            status: 'INVITED'
                                        });
                                        onClose();
                                    }}
                                    className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
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
                                            Direct Installer Download URL (.exe)
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                                                {downloadAgentUrl}
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
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default AddEmployeeModal;
