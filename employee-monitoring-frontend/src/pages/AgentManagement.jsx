import React, { useState, useEffect } from 'react';
import agentService from '../services/agentService';
import { toast } from '../utils/toastManager';
import { 
    Monitor, 
    Smartphone, 
    Hash, 
    Activity, 
    Clock, 
    Info, 
    Search,
    Shield,
    CheckCircle2,
    XCircle,
    Calendar,
    Edit3,
    Trash2,
    CheckCircle,
    Eye,
    EyeOff,
    X,
    ChevronDown,
    UserMinus
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

// API_BASE_URL is now managed within services/apiClient.js

export function AgentManagement() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingAgent, setEditingAgent] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const fetchAgents = async () => {
        try {
            setLoading(true);
            const response = await agentService.listAgents();

            if (response.success) {
                setAgents(response.data);
            }
        } catch (err) {
            setError(err.userMessage || err.message || 'Failed to fetch agents');
            toast.error(err.userMessage || 'Failed to fetch agents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
        
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const filteredAgents = agents.filter(agent => 
        agent.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.deviceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.employee?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString();
    };

    const isOnline = (lastSeen) => {
        if (!lastSeen) return false;
        return (new Date() - new Date(lastSeen)) < 10 * 60 * 1000; // 10 mins
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await agentService.updateAgentStatus(id, status);
            toast.success(`Agent status updated to ${status}`);
            setActiveDropdown(null);
            fetchAgents();
        } catch (err) {
            toast.error(err.userMessage || 'Status update failed');
        }
    };

    const handleDelete = async (agent) => {
        const empName = agent.employee?.fullName || 'this employee';
        const deviceId = agent.deviceId || 'device';
        
        const confirmed = window.confirm(`Are you sure you want to remove monitoring agent (${deviceId}) for ${empName}?`);
        if (!confirmed) return;
        
        try {
            await agentService.removeAgent(agent.id || agent.employeeId);
            toast.success(`Agent (${deviceId}) removed successfully`);
            fetchAgents();
        } catch (err) {
            toast.error(err.userMessage || err.message || 'Deletion failed');
        }
    };

    const handleEdit = (agent) => {
        setEditingAgent(agent);
        setEditForm({
            name: agent.employee?.fullName || '',
            email: agent.employee?.email || '',
            password: '' // Don't show old password
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const data = { ...editForm };
            if (!data.password) delete data.password;

            await agentService.updateAgent(editingAgent.id, data);
            toast.success('Agent details updated successfully');
            setEditingAgent(null);
            fetchAgents();
        } catch (err) {
            toast.error(err.userMessage || 'Update failed');
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-normal text-[#29291F] dark:text-[#F5F1E9] tracking-tight flex items-center gap-2.5">
                        <Monitor className="text-[#B9955B]" size={28} />
                        Monitoring Agents
                    </h1>
                    <p className="text-[#777367] dark:text-[#B8B3A7] text-xs font-medium mt-1">
                        Manage and track all registered desktop monitoring devices
                    </p>
                </div>
                
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777367]" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search by employee name or device ID..."
                        className="pl-10 pr-4 py-2 bg-[#FBF9F5] dark:bg-[#1E2419] border border-[#E5DED2] dark:border-[#384232] rounded-xl w-full md:w-80 text-xs font-medium text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition-all placeholder:text-[#9E988A]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-[#EEE8DD] text-[#30382B] rounded-xl">
                            <Monitor size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em]">Total Agents</p>
                            <h3 className="font-serif text-2xl font-bold text-[#29291F] dark:text-[#F5F1E9] mt-0.5">{agents.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-[#F4F7F4] text-[#5E7D64] rounded-xl">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em]">Online Now</p>
                            <h3 className="font-serif text-2xl font-bold text-[#29291F] dark:text-[#F5F1E9] mt-0.5">
                                {agents.filter(a => isOnline(a.lastSeen)).length}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-[#FDF8F0] text-[#C98A3C] rounded-xl">
                            <Shield size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em]">Active Status</p>
                            <h3 className="font-serif text-2xl font-bold text-[#29291F] dark:text-[#F5F1E9] mt-0.5">{agents.filter(a => a.status === 'active').length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#E5DDCF]/70 dark:bg-[#1E2419] border-b border-[#D6CDBC] dark:border-[#384232]">
                                <th className="px-6 py-4 text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">Agent ID</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">Employee & ID</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">Device ID</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">System Info</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">Last Seen</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em]">Registered</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D6CDBC]/60 dark:divide-[#384232]">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array(8).fill(0).map((_, j) => (
                                            <td key={j} className="px-6 py-6"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredAgents.length > 0 ? (
                                filteredAgents.map((agent) => (
                                    <tr key={agent.id} className="bg-[#F5F1E9] dark:bg-[#1E2419] hover:bg-[#EAE2D3] dark:hover:bg-[#252B20] transition-colors border-b border-[#D6CDBC]/50">
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-mono font-bold text-slate-400">{agent.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-[#EEE8DD] text-[#30382B] border border-[#D6CDBC] flex items-center justify-center font-bold text-xs">
                                                    {agent.employee?.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{agent.employee?.fullName}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono">{agent.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Hash size={14} />
                                                <span className="font-mono text-xs font-bold">{agent.deviceId}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                agent.status === 'pending'
                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                    : agent.status === 'rejected'
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                        : isOnline(agent.lastSeen) 
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500"
                                            )}>
                                                <div className={cn(
                                                    "h-1.5 w-1.5 rounded-full", 
                                                    agent.status === 'pending' ? "bg-amber-500" :
                                                    agent.status === 'rejected' ? "bg-red-500" :
                                                    isOnline(agent.lastSeen) ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                                                )}></div>
                                                {agent.status === 'pending' ? 'Pending Approval' : 
                                                 agent.status === 'rejected' ? 'Rejected' :
                                                 (isOnline(agent.lastSeen) ? 'Online' : 'Offline')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                    <Smartphone size={12} />
                                                    {agent.systemInfo?.platform} {agent.systemInfo?.arch}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-medium">{agent.systemInfo?.release}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Clock size={14} />
                                                <span className="text-xs font-medium">{formatDate(agent.lastSeen)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Calendar size={14} />
                                                <span className="text-xs font-medium">{formatDate(agent.createdAt).split(',')[0]}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {agent.status === 'pending' && (
                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveDropdown(activeDropdown === agent.id ? null : agent.id);
                                                            }}
                                                            className={cn(
                                                                "flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all text-[11px] font-black uppercase tracking-wider",
                                                                activeDropdown === agent.id && "ring-2 ring-amber-300"
                                                            )}
                                                        >
                                                            Actions
                                                            <ChevronDown size={14} />
                                                        </button>
                                                        
                                                        {activeDropdown === agent.id && (
                                                            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                                <button 
                                                                    onClick={() => handleStatusUpdate(agent.id, 'active')}
                                                                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors border-b border-slate-100 dark:border-slate-800"
                                                                >
                                                                    <CheckCircle size={14} />
                                                                    Approve
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleStatusUpdate(agent.id, 'rejected')}
                                                                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                                                >
                                                                    <UserMinus size={14} />
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <button 
                                                    onClick={() => handleEdit(agent)}
                                                    className="p-2 bg-[#EEE8DD] hover:bg-[#E5DED2] text-[#B9955B] rounded-xl transition-all cursor-pointer"
                                                    title="Edit Agent"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(agent)}
                                                    className="p-2 bg-[#FAF3F2] hover:bg-[#F5E4E2] text-[#A84B4B] rounded-xl transition-all cursor-pointer"
                                                    title="Delete Employee & Agent"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Info size={40} strokeWidth={1} />
                                            <p className="text-sm font-medium">No monitoring agents found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingAgent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl w-full max-w-md shadow-warm-lg border border-[#D6CDBC] dark:border-[#384232] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[#D6CDBC] dark:border-[#384232] flex items-center justify-between bg-[#E5DDCF]/40">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Edit3 className="text-primary-600" size={20} />
                                Edit Monitoring Member
                            </h3>
                            <button onClick={() => setEditingAgent(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Full Name</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2.5 bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition-all"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Email Address</label>
                                <input 
                                    type="email" 
                                    className="w-full px-4 py-2.5 bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition-all"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Reset Password (Optional)</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Enter new password to reset"
                                        className="w-full px-4 py-2.5 bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] focus:border-[#B9955B] outline-none transition-all pr-10"
                                        value={editForm.password}
                                        onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Leave empty to keep existing password.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setEditingAgent(null)}
                                    className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-[0.98]"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Legend/Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex gap-3">
                <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
                    Agents are considered <strong>Online</strong> if they have sent a heartbeat or activity log within the last 10 minutes. 
                    <strong> Pending</strong> agents must be approved before tracking data is processed.
                </div>
            </div>
        </div>
    );
}
