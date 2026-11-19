import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Search, Edit, Trash2, Eye, TrendingUp, Plus, X } from 'lucide-react';
import { CreateTeamModal } from '../components/CreateTeamModal';
import { useTeamStore } from '../store/teamStore';
import { useEmployeeStore } from '../store/employeeStore';
import { useAuthStore } from '../store/authStore';
import { useOrganizationStore } from '../store/organizationStore';
import { useToast } from '../context/ToastContext';
import activityService from '../services/activityService';
import { cn } from '../utils/cn';

const formatHours = (hours) => {
    const totalMinutes = Math.round((hours || 0) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export function Teams() {
    const { teams: contextTeams, fetchTeams, addTeam, updateTeam, deleteTeam, isLoading } = useTeamStore();
    const { employees, fetchEmployees } = useEmployeeStore();
    const { user } = useAuthStore();
    const { organization, fetchOrganization } = useOrganizationStore();
    const [teamSummaries, setTeamSummaries] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [search, setSearch] = useState('');
    const { toast } = useToast();
    const [selectedTeam, setSelectedTeam] = useState(null);

    useEffect(() => {
        fetchTeams();
        fetchEmployees();
        if (!organization?.id) fetchOrganization();

        const interval = setInterval(() => {
            fetchTeams();
            fetchEmployees();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchTeams, fetchEmployees, fetchOrganization, organization?.id]);

    const teamIdsKey = useMemo(
        () => contextTeams.map(t => t.id).sort().join(','),
        [contextTeams]
    );

    useEffect(() => {
        if (!teamIdsKey) return;
        let cancelled = false;
        const ids = teamIdsKey.split(',').filter(Boolean);

        const fetchSummaries = async () => {
            const results = await Promise.all(
                ids.map(async (id) => {
                    try {
                        const res = await activityService.getTeamSummary(id);
                        return res.success ? [id, res.data] : null;
                    } catch (error) {
                        console.error(`Failed to fetch summary for team ${id}:`, error);
                        return null;
                    }
                })
            );
            if (!cancelled) {
                const summaries = {};
                results.forEach((entry) => {
                    if (entry) summaries[entry[0]] = entry[1];
                });
                setTeamSummaries(summaries);
            }
        };

        fetchSummaries();
        return () => { cancelled = true; };
    }, [teamIdsKey]);

    const teamsData = useMemo(() => contextTeams.map(team => {
        const initials = team.name.substring(0, 2).toUpperCase();
        const teamEmployees = (team.employees && team.employees.length > 0)
            ? team.employees
            : employees.filter(emp => emp.teamId === team.id || (typeof emp.team === 'object' && emp.team?.id === team.id));

        const summary = teamSummaries[team.id] || {
            activeHours: 0,
            idleHours: 0,
            manualHours: 0,
            productiveHours: 0,
            unproductiveHours: 0,
            neutralHours: 0,
            productivityPct: 0
        };

        return {
            ...team,
            initials,
            employees: teamEmployees,
            memberCount: teamEmployees.length,
            onlineCount: teamEmployees.filter(e => {
                const s = e.status?.toLowerCase();
                return s === 'active' || s === 'online';
            }).length,
            productivity: summary.productivityPct,
            stats: {
                work: formatHours(summary.activeHours + summary.idleHours + summary.manualHours),
                comp: formatHours(summary.activeHours + summary.idleHours),
                manual: formatHours(summary.manualHours),
                prod: formatHours(summary.productiveHours),
                unprod: formatHours(summary.unproductiveHours),
                neutral: formatHours(summary.neutralHours),
                idle: formatHours(summary.idleHours),
            },
        };
    }).filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase())), [contextTeams, search, teamSummaries, employees]);

    const handleCreateTeam = async (teamData) => {
        if (editingTeam) {
            try {
                await updateTeam(editingTeam.id, teamData);
                toast('Team updated successfully', 'success');
                setIsModalOpen(false);
                setEditingTeam(null);
            } catch (err) {
                toast('Failed to update team', 'error');
            }
        } else {
            try {
                await addTeam(teamData);
                toast('Team created successfully', 'success');
                setIsModalOpen(false);
            } catch (err) {
                toast('Failed to create team', 'error');
            }
        }
    };

    const handleEditClick = (team) => {
        setEditingTeam(team);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTeam(null);
    };

    if (isLoading && contextTeams.length === 0) {
        return <div className="py-20 text-center text-[#777367] font-medium">Loading teams...</div>;
    }

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-normal text-[#29291F] dark:text-[#F5F1E9] tracking-tight">Teams</h1>
                    <div className="flex items-center gap-2 mt-1 text-xs font-medium text-[#777367]">
                        <Users size={13} className="text-[#B9955B]" />
                        <span>{employees.length} employees · {contextTeams.length} teams</span>
                    </div>
                </div>
                {user?.role === 'ADMIN' && (
                    <button
                        onClick={() => { setEditingTeam(null); setIsModalOpen(true); }}
                        className="flex items-center justify-center gap-2 bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] px-5 py-2.5 rounded-xl text-xs font-semibold shadow-warm-sm transition-all active:scale-95 cursor-pointer"
                    >
                        <Plus size={15} className="text-[#D3B98D]" />
                        <span>Create New Team</span>
                    </button>
                )}
            </div>

            {/* Top Summary Cards (Compact & Luxury) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {teamsData.slice(0, 4).map(team => (
                    <div
                        key={team.id}
                        className="bg-[#FBF9F5] dark:bg-[#252B20] p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E5DED2] dark:border-[#384232] shadow-warm-xs hover:border-[#B9955B]/60 transition-all flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-7 w-7 rounded-lg bg-[#EEE8DD] text-[#30382B] border border-[#E5DED2] flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {team.initials}
                                </div>
                                <span className="font-serif text-sm font-semibold text-[#29291F] dark:text-[#F5F1E9] truncate">{team.name}</span>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-[#5E7D64] shrink-0" />
                        </div>

                        <div className="flex items-end justify-between my-1">
                            <div>
                                <p className="text-[10px] font-bold text-[#777367] uppercase tracking-wider">{team.memberCount || 0} Members</p>
                                <p className="text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] mt-0.5">{team.onlineCount || 0} Online</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-[#777367] uppercase tracking-wider">Prod.</p>
                                <p className="text-xs font-bold text-[#B9955B] mt-0.5 tabular-nums">{team.productivity || 0}%</p>
                            </div>
                        </div>

                        <div className="mt-2 h-1.5 bg-[#EEE8DD] dark:bg-[#1E2419] rounded-full overflow-hidden">
                            <div className="h-full bg-[#B9955B] rounded-full transition-all duration-700" style={{ width: `${team.productivity || 0}%` }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777367]" />
                    <input
                        type="text"
                        placeholder="Search teams by name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-[#FBF9F5] dark:bg-[#252B20] border border-[#E5DED2] dark:border-[#384232] rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] focus:border-[#B9955B] outline-none transition-all shadow-warm-xs"
                    />
                </div>
            </div>

            {/* Teams List (Clean Table / Card Container) */}
            <div className="bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border border-[#E5DED2] dark:border-[#384232] shadow-warm-xs overflow-hidden mb-8">
                {/* Desktop & Tablet Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#EEE8DD]/40 dark:bg-[#1E2419] border-b border-[#E5DED2] dark:border-[#384232] text-[#777367] dark:text-[#B8B3A7]">
                            <tr>
                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Team Architecture</th>
                                <th className="px-3 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider">Work</th>
                                <th className="px-3 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider">Comp</th>
                                <th className="px-3 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider">Manual</th>
                                <th className="px-3 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider">Prod</th>
                                <th className="px-3 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider">Unprod</th>
                                <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider">Productivity</th>
                                <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5DED2]/60 dark:divide-[#384232]/60">
                            {teamsData.map((team) => (
                                <tr key={team.id} className="hover:bg-[#EEE8DD]/30 dark:hover:bg-[#1E2419] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-[#EEE8DD] text-[#30382B] border border-[#E5DED2] flex items-center justify-center font-bold text-xs tracking-wider shrink-0">
                                                {team.initials}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-serif text-sm font-semibold text-[#29291F] dark:text-[#F5F1E9] truncate">{team.name}</h3>
                                                <p className="text-[11px] font-medium text-[#777367]">{team.memberCount} Members · {team.onlineCount} Online</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 text-center font-sans font-medium text-xs text-[#29291F] dark:text-[#F5F1E9] tabular-nums">{team.stats.work}</td>
                                    <td className="px-3 py-4 text-center font-sans font-medium text-xs text-[#29291F] dark:text-[#F5F1E9] tabular-nums">{team.stats.comp}</td>
                                    <td className="px-3 py-4 text-center font-sans font-medium text-xs text-[#29291F] dark:text-[#F5F1E9] tabular-nums">{team.stats.manual}</td>
                                    <td className="px-3 py-4 text-center font-sans font-semibold text-xs text-[#5E7D64] tabular-nums">{team.stats.prod}</td>
                                    <td className="px-3 py-4 text-center font-sans font-semibold text-xs text-[#A84B4B] tabular-nums">{team.stats.unprod}</td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[#B9955B]/15 text-[#A17D45]">
                                            {team.productivity || 0}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => setSelectedTeam(team)}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#EEE8DD]/60 text-[#777367] hover:text-[#30382B] hover:bg-[#EEE8DD] transition-all shadow-warm-xs cursor-pointer"
                                                title="View Details"
                                            >
                                                <Eye size={15} />
                                            </button>
                                            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                                                <button
                                                    onClick={() => handleEditClick(team)}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#EEE8DD]/60 text-[#777367] hover:text-[#B9955B] hover:bg-[#EEE8DD] transition-all shadow-warm-xs cursor-pointer"
                                                    title="Edit Team"
                                                >
                                                    <Edit size={15} />
                                                </button>
                                            )}
                                            {user?.role === 'ADMIN' && (
                                                <button
                                                    onClick={() => { if (window.confirm(`Are you sure you want to delete ${team.name}?`)) deleteTeam(team.id); }}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#EEE8DD]/60 text-[#777367] hover:text-[#A84B4B] hover:bg-[#FAF3F2] transition-all shadow-warm-xs cursor-pointer"
                                                    title="Delete Team"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View (<640px) - Compact & Elegant */}
                <div className="sm:hidden divide-y divide-[#E5DED2]/60 dark:divide-[#384232]/60">
                    {teamsData.map((team) => (
                        <div key={team.id} className="p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-xl bg-[#EEE8DD] text-[#30382B] border border-[#E5DED2] flex items-center justify-center font-bold text-xs shrink-0">
                                        {team.initials}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-serif text-sm font-semibold text-[#29291F] dark:text-[#F5F1E9] truncate">{team.name}</h3>
                                        <p className="text-[11px] text-[#777367]">{team.memberCount} Members · {team.onlineCount} Online</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[#B9955B]/15 text-[#A17D45]">
                                    {team.productivity || 0}%
                                </span>
                            </div>

                            {/* Mini stats pills */}
                            <div className="grid grid-cols-4 gap-1.5 bg-[#EEE8DD]/40 rounded-xl p-2 text-center text-[10px]">
                                <div>
                                    <span className="text-[#777367] block">Work</span>
                                    <span className="font-bold text-[#29291F]">{team.stats.work}</span>
                                </div>
                                <div>
                                    <span className="text-[#777367] block">Comp</span>
                                    <span className="font-bold text-[#29291F]">{team.stats.comp}</span>
                                </div>
                                <div>
                                    <span className="text-[#777367] block">Prod</span>
                                    <span className="font-bold text-[#5E7D64]">{team.stats.prod}</span>
                                </div>
                                <div>
                                    <span className="text-[#777367] block">Unprod</span>
                                    <span className="font-bold text-[#A84B4B]">{team.stats.unprod}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    onClick={() => setSelectedTeam(team)}
                                    className="px-2.5 py-1 text-xs rounded-lg bg-[#EEE8DD] text-[#30382B] font-semibold flex items-center gap-1"
                                >
                                    <Eye size={13} /> View
                                </button>
                                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                                    <button
                                        onClick={() => handleEditClick(team)}
                                        className="px-2.5 py-1 text-xs rounded-lg bg-[#EEE8DD] text-[#B9955B] font-semibold flex items-center gap-1"
                                    >
                                        <Edit size={13} /> Edit
                                    </button>
                                )}
                                {user?.role === 'ADMIN' && (
                                    <button
                                        onClick={() => { if (window.confirm(`Are you sure you want to delete ${team.name}?`)) deleteTeam(team.id); }}
                                        className="px-2.5 py-1 text-xs rounded-lg bg-[#FAF3F2] text-[#A84B4B] font-semibold flex items-center gap-1"
                                    >
                                        <Trash2 size={13} /> Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {teamsData.length === 0 && (
                    <div className="py-16 text-center text-[#777367] font-medium text-sm">No teams found.</div>
                )}
            </div>

            <CreateTeamModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onCreateTeam={handleCreateTeam}
                initialData={editingTeam}
            />

            <TeamDetailModal
                isOpen={!!selectedTeam}
                onClose={() => setSelectedTeam(null)}
                team={selectedTeam}
            />
        </div>
    );
}

const TeamDetailModal = ({ isOpen, onClose, team }) => {
    if (!isOpen || !team) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            {/* Backdrop click area */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Card */}
            <div className="relative w-full max-w-2xl bg-[#FAF8F5] dark:bg-[#252B20] rounded-3xl shadow-2xl border border-[#D6CDBC] dark:border-[#384232] flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5DED2] dark:border-[#384232] flex items-center justify-between bg-[#F5F1E9]/50 dark:bg-[#1E2419]/50 sticky top-0 z-10">
                    <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-[#EEE8DD] text-[#30382B] border border-[#E5DED2] flex items-center justify-center text-xs font-bold">
                            {team.initials}
                        </div>
                        <div>
                            <h2 className="font-serif text-xl font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">{team.name}</h2>
                            <p className="text-[10px] font-bold text-[#777367] uppercase tracking-wider mt-0.5">{team.memberCount || 0} Team Members</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        title="Close"
                        className="w-8 h-8 rounded-xl bg-[#EEE8DD] hover:bg-[#E5DDCF] dark:bg-[#1E2419] dark:hover:bg-[#2A3324] text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:text-[#F5F1E9] flex items-center justify-center transition cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Performance Summary & Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* Productivity Card */}
                        <div className="bg-[#EEE8DD]/40 dark:bg-[#1E2419] p-4 rounded-xl border border-[#E5DED2] dark:border-[#384232] flex flex-col items-center justify-center text-center">
                            <div className="h-8 w-8 rounded-lg bg-[#EEE8DD] text-[#B9955B] flex items-center justify-center mb-2">
                                <TrendingUp size={16} />
                            </div>
                            <span className="text-[10px] font-bold text-[#777367] uppercase tracking-wider mb-1">Productivity</span>
                            <span className="text-2xl font-bold font-sans text-[#B9955B] tabular-nums">{team.productivity || 0}%</span>
                            <div className="mt-2.5 w-full h-1.5 bg-[#E5DED2] dark:bg-[#252B20] rounded-full overflow-hidden">
                                <div className="h-full bg-[#B9955B] rounded-full" style={{ width: `${team.productivity || 0}%` }} />
                            </div>
                        </div>

                        {/* Status Card */}
                        <div className="bg-[#EEE8DD]/40 dark:bg-[#1E2419] p-4 rounded-xl border border-[#E5DED2] dark:border-[#384232] flex flex-col items-center justify-center text-center">
                            <div className="h-8 w-8 rounded-lg bg-[#EEE8DD] text-[#5E7D64] flex items-center justify-center mb-2">
                                <Users size={16} />
                            </div>
                            <span className="text-[10px] font-bold text-[#777367] uppercase tracking-wider mb-1">Live Online</span>
                            <span className="text-2xl font-bold font-sans text-[#29291F] dark:text-[#F5F1E9] tabular-nums">{team.onlineCount || 0}</span>
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-[#5E7D64]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#5E7D64]" />
                                <span>Online Now</span>
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className="bg-[#EEE8DD]/40 dark:bg-[#1E2419] p-4 rounded-xl border border-[#E5DED2] dark:border-[#384232] flex flex-col justify-center text-left">
                            <span className="text-[10px] font-bold text-[#777367] uppercase tracking-wider mb-1">Description</span>
                            <p className="text-xs text-[#29291F] dark:text-[#F5F1E9] leading-relaxed line-clamp-3">
                                {team.description || "No specific description defined for this team unit."}
                            </p>
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] uppercase tracking-wider">Team Roster</h3>
                            <span className="text-[10px] font-bold text-[#777367] uppercase tracking-wider">{team.memberCount || 0} Total</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(team.employees || []).map((emp, i) => {
                                const isOnline = emp.status?.toLowerCase() === 'active' || emp.status?.toLowerCase() === 'online';
                                return (
                                    <div key={emp.id || i} className="flex items-center gap-3 bg-[#EEE8DD]/30 dark:bg-[#1E2419] p-3 rounded-xl border border-[#E5DED2]/60 dark:border-[#384232]/60">
                                        <div className="h-9 w-9 shrink-0 rounded-lg bg-[#EEE8DD] text-[#30382B] flex items-center justify-center text-xs font-bold border border-[#E5DED2]">
                                            {emp.name?.substring(0, 2).toUpperCase() || 'EM'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] truncate">{emp.name}</p>
                                            <p className="text-[10px] text-[#777367] truncate">{emp.email}</p>
                                        </div>
                                        <div className={cn(
                                            "h-2 w-2 rounded-full shrink-0",
                                            isOnline ? 'bg-[#5E7D64]' : 'bg-[#9E988A]'
                                        )} />
                                    </div>
                                );
                            })}
                            {(team.employees || []).length === 0 && (
                                <div className="col-span-full text-center py-8 bg-[#EEE8DD]/20 rounded-xl border border-dashed border-[#E5DED2]">
                                    <Users className="mx-auto text-[#777367] mb-2" size={24} />
                                    <p className="text-xs font-medium text-[#777367]">No members assigned to this team.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t border-[#E5DED2] dark:border-[#384232] bg-[#F5F1E9]/60 dark:bg-[#1E2419]/60 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] dark:bg-[#B9955B] dark:hover:bg-[#C9A86B] dark:text-[#1E2419] rounded-xl text-xs font-bold uppercase tracking-wider shadow-warm-xs transition-all active:scale-95 cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
