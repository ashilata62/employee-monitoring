import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Bell,
    Search,
    X,
    CheckCheck,
    AlertTriangle,
    Info,
    AlertOctagon,
    Plus,
    Trash2,
    SlidersHorizontal,
    History,
    ShieldAlert,
    Clock,
    Activity,
    ExternalLink,
    RefreshCw
} from 'lucide-react';
import { CreateAlertModal } from '../components/CreateAlertModal';
import { useRealTime } from '../hooks/RealTimeContext';
import { useAuthStore } from '../store/authStore';
import alertService from '../services/alertService';
import { useToast } from '../context/ToastContext';

const SEVERITY_CONFIG = {
    critical: {
        label: 'Critical',
        badge: 'bg-[#A84B4B]/10 text-[#A84B4B] border-[#A84B4B]/30 dark:bg-[#A84B4B]/20 dark:text-[#D97777] dark:border-[#A84B4B]/40',
        icon: AlertOctagon,
        dot: 'bg-[#A84B4B]'
    },
    warning: {
        label: 'Warning',
        badge: 'bg-[#B9955B]/10 text-[#B9955B] border-[#B9955B]/30 dark:bg-[#B9955B]/20 dark:text-[#D3B98D] dark:border-[#B9955B]/40',
        icon: AlertTriangle,
        dot: 'bg-[#B9955B]'
    },
    info: {
        label: 'Info',
        badge: 'bg-[#5E7D64]/10 text-[#5E7D64] border-[#5E7D64]/30 dark:bg-[#5E7D64]/20 dark:text-[#8BB394] dark:border-[#5E7D64]/40',
        icon: Info,
        dot: 'bg-[#5E7D64]'
    },
};

const TYPE_ICONS = {
    attendance: Clock,
    security: ShieldAlert,
    activity: Activity,
};

function AlertRow({ alert, onDismiss }) {
    const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
    const Icon = cfg.icon;

    return (
        <div className={`flex items-start gap-3.5 p-4 rounded-xl sm:rounded-2xl border transition-all ${alert.read ? 'opacity-60 bg-[#FBF9F5]/50 dark:bg-[#252B20]/40' : 'bg-[#FBF9F5] dark:bg-[#252B20] shadow-warm-xs'} border-[#D6CDBC] dark:border-[#384232] hover:border-[#B9955B] dark:hover:border-[#B9955B]`}>
            <div className={`mt-0.5 p-2 rounded-xl border ${cfg.badge} shrink-0`}>
                <Icon size={16} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">
                        {alert.employeeName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cfg.badge}`}>
                        {cfg.label}
                    </span>
                    {!alert.read && (
                        <span className="h-2 w-2 rounded-full bg-[#A84B4B] animate-pulse shrink-0" />
                    )}
                </div>

                <p className="text-xs font-medium text-[#29291F] dark:text-[#E2E8DE] leading-relaxed break-words">
                    {alert.message}
                </p>

                {alert.screenshotUrl && (
                    <div className="mt-2">
                        <a
                            href={alert.screenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EEE8DD] dark:bg-[#1E2419] text-[11px] font-semibold text-[#B9955B] hover:underline border border-[#D6CDBC] dark:border-[#384232]"
                        >
                            <ExternalLink size={12} />
                            <span>View Violation Screenshot</span>
                        </a>
                    </div>
                )}

                <div className="flex items-center gap-2 mt-2.5 text-[10px] font-semibold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-wider flex-wrap">
                    <span>{alert.team}</span>
                    <span>•</span>
                    <span>{alert.type}</span>
                    <span>•</span>
                    <span>{alert.date}</span>
                </div>
            </div>

            {!alert.read && (
                <button
                    type="button"
                    onClick={() => onDismiss(alert.id)}
                    title="Dismiss alert"
                    className="shrink-0 p-1.5 rounded-lg text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] hover:bg-[#EEE8DD] dark:hover:bg-[#1E2419] transition-all cursor-pointer"
                >
                    <X size={15} />
                </button>
            )}
        </div>
    );
}

export function Alerts() {
    const { alerts, dismissAlert, dismissAllAlerts } = useRealTime();
    const { toast } = useToast();
    const { role } = useAuthStore();
    const [activeTab, setActiveTab] = useState('Overview'); // 'Overview' | 'Rules' | 'Logs'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [rules, setRules] = useState([]);
    const [rulesLoading, setRulesLoading] = useState(false);

    const loadRules = useCallback(async () => {
        if (role === 'EMPLOYEE') return;
        setRulesLoading(true);
        try {
            const data = await alertService.getAlertRules();
            setRules(Array.isArray(data) ? data : (data?.data || []));
        } catch (err) {
            console.error('Failed to load alert rules:', err);
        } finally {
            setRulesLoading(false);
        }
    }, [role]);

    useEffect(() => {
        loadRules();
    }, [loadRules]);

    const handleDeleteRule = async (id, name) => {
        try {
            await alertService.deleteAlertRule(id);
            setRules(prev => prev.filter(r => r.id !== id));
            if (toast?.success) toast.success(`Rule "${name}" deleted.`);
        } catch (err) {
            if (toast?.error) toast.error('Failed to delete rule: ' + err.message);
        }
    };

    const filteredAlerts = useMemo(() => {
        return alerts.filter(a => {
            if (activeTab === 'Overview' && a.read) return false;
            if (filterType !== 'all' && a.severity?.toLowerCase() !== filterType.toLowerCase()) return false;
            if (search) {
                const s = search.toLowerCase();
                const mMatch = (a.message || '').toLowerCase().includes(s);
                const eMatch = (a.employeeName || '').toLowerCase().includes(s);
                if (!mMatch && !eMatch) return false;
            }
            return true;
        });
    }, [alerts, activeTab, filterType, search]);

    const unreadCount = alerts.filter(a => !a.read).length;
    const bySeverity = {
        critical: alerts.filter(a => a.severity?.toLowerCase() === 'critical').length,
        warning:  alerts.filter(a => a.severity?.toLowerCase() === 'warning').length,
        info:     alerts.filter(a => a.severity?.toLowerCase() === 'info').length,
    };

    return (
        <div className="w-full space-y-6 animate-fade-in pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D6CDBC]/60 dark:border-[#384232] pb-5">
                <div className="min-w-0">
                    <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#29291F] dark:text-[#F5F1E9] tracking-tight flex items-center gap-3 flex-wrap">
                        Alerts & Incidents
                        {unreadCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#A84B4B] text-white text-[11px] font-bold tracking-wide">
                                {unreadCount} Active
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-[#777367] dark:text-[#B8B3A7] font-medium mt-1">
                        Real-time violation detection for attendance, excessive idle time, and prohibited applications.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={dismissAllAlerts}
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#D6CDBC] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] dark:hover:bg-[#252B20] transition-all shadow-warm-xs shrink-0 whitespace-nowrap cursor-pointer"
                        >
                            <CheckCheck size={14} className="text-[#5E7D64]" />
                            <span>Mark All Read</span>
                        </button>
                    )}
                    {role !== 'EMPLOYEE' && (
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#B9955B] hover:bg-[#A17D45] text-white text-xs font-semibold transition-all shadow-warm-xs hover:shadow-md shrink-0 whitespace-nowrap cursor-pointer"
                        >
                            <Plus size={14} />
                            <span>New Alert Rule</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                {[
                    { label: 'Critical', count: bySeverity.critical, color: 'text-[#A84B4B] dark:text-[#D97777]', badge: 'bg-[#A84B4B]/10 border-[#A84B4B]/30', icon: AlertOctagon },
                    { label: 'Warning',  count: bySeverity.warning,  color: 'text-[#B9955B] dark:text-[#D3B98D]', badge: 'bg-[#B9955B]/10 border-[#B9955B]/30', icon: AlertTriangle },
                    { label: 'Info',     count: bySeverity.info,     color: 'text-[#5E7D64] dark:text-[#8BB394]', badge: 'bg-[#5E7D64]/10 border-[#5E7D64]/30', icon: Info },
                ].map(card => {
                    const isSelected = filterType === card.label.toLowerCase();
                    const CardIcon = card.icon;
                    return (
                        <button
                            key={card.label}
                            type="button"
                            onClick={() => setFilterType(isSelected ? 'all' : card.label.toLowerCase())}
                            className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-left shadow-warm-xs ${
                                isSelected
                                    ? 'ring-2 ring-[#B9955B] border-[#B9955B] bg-[#FBF9F5] dark:bg-[#252B20]'
                                    : 'bg-[#FBF9F5] dark:bg-[#252B20] border-[#D6CDBC] dark:border-[#384232] hover:border-[#B9955B] dark:hover:border-[#B9955B]'
                            }`}
                        >
                            <div>
                                <span className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] block">
                                    {card.label} Severity
                                </span>
                                <p className={`text-2xl font-bold font-sans mt-0.5 tabular-nums ${card.color}`}>
                                    {card.count}
                                </p>
                            </div>
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${card.badge} ${card.color}`}>
                                <CardIcon size={18} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between gap-4 border-b border-[#D6CDBC]/60 dark:border-[#384232] overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1 shrink-0">
                    {[
                        { id: 'Overview', label: 'Live Alerts', icon: Bell, count: unreadCount },
                        ...(role !== 'EMPLOYEE' ? [{ id: 'Rules', label: 'Alert Rules', icon: SlidersHorizontal, count: rules.length }] : []),
                        { id: 'Logs', label: 'Audit History', icon: History, count: alerts.length },
                    ].map(tab => {
                        const TabIcon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold transition-all relative border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
                                    isActive
                                        ? 'text-[#B9955B] border-[#B9955B]'
                                        : 'text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:text-[#F5F1E9] border-transparent'
                                }`}
                            >
                                <TabIcon size={14} />
                                <span>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                                        isActive ? 'bg-[#B9955B]/15 text-[#B9955B]' : 'bg-[#EEE8DD] dark:bg-[#1E2419] text-[#777367]'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {role !== 'EMPLOYEE' && activeTab === 'Rules' && (
                    <button
                        type="button"
                        onClick={loadRules}
                        disabled={rulesLoading}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] pb-2 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                        <RefreshCw size={13} className={rulesLoading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                )}
            </div>

            {/* Search toolbar (for Overview & Logs) */}
            {activeTab !== 'Rules' && (
                <div className="flex items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777367] dark:text-[#B8B3A7]" />
                        <input
                            type="text"
                            placeholder="Search by employee, message..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-9 bg-[#FBF9F5] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] rounded-xl pl-9 pr-4 text-xs font-medium text-[#29291F] dark:text-[#F5F1E9] placeholder:text-[#777367] outline-none focus:ring-2 focus:ring-[#B9955B]/20 focus:border-[#B9955B] shadow-warm-xs transition-all"
                        />
                    </div>
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="text-xs font-semibold text-[#777367] hover:text-[#A84B4B] flex items-center gap-1 cursor-pointer shrink-0"
                        >
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>
            )}

            {/* Content Tabs */}
            {activeTab === 'Rules' ? (
                /* ─── ALERT RULES TAB ───────────────────────── */
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                        {rules.map(rule => {
                            const RuleIcon = TYPE_ICONS[rule.type?.toLowerCase()] || Activity;
                            return (
                                <div
                                    key={rule.id}
                                    className="p-4 sm:p-5 rounded-2xl bg-[#FBF9F5] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs flex flex-col justify-between space-y-3 hover:border-[#B9955B] transition-all"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-xl bg-[#B9955B]/10 text-[#B9955B] border border-[#B9955B]/20 flex items-center justify-center shrink-0">
                                                <RuleIcon size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm font-bold text-[#29291F] dark:text-[#F5F1E9] truncate">
                                                    {rule.name}
                                                </h4>
                                                <p className="text-xs text-[#777367] dark:text-[#B8B3A7] font-medium mt-0.5">
                                                    Trigger: <strong className="text-[#29291F] dark:text-[#F5F1E9]">{rule.trigger}</strong>
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteRule(rule.id, rule.name)}
                                            title="Delete alert rule"
                                            className="p-1.5 rounded-lg text-[#777367] hover:text-[#A84B4B] hover:bg-[#A84B4B]/10 transition-all cursor-pointer"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#D6CDBC]/50 dark:border-[#384232]/50 text-[#777367] font-medium">
                                        <span>Scope: <strong className="text-[#29291F] dark:text-[#F5F1E9]">{rule.scope || 'All Employees'}</strong></span>
                                        <span className="px-2 py-0.5 rounded-full bg-[#5E7D64]/10 text-[#5E7D64] dark:text-[#8BB394] font-bold uppercase text-[9px]">
                                            Active
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {rules.length === 0 && (
                        <div className="py-16 text-center bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border-2 border-dashed border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
                            <SlidersHorizontal size={36} className="mx-auto text-[#777367] mb-2" />
                            <p className="text-sm font-bold text-[#29291F] dark:text-[#F5F1E9]">No custom alert rules configured</p>
                            <p className="text-xs text-[#777367] mt-1">Create rules to monitor employee thresholds.</p>
                            {role !== 'EMPLOYEE' && (
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-4 px-4 py-2 rounded-xl bg-[#B9955B] hover:bg-[#A17D45] text-white text-xs font-semibold shadow-warm-xs transition-all cursor-pointer"
                                >
                                    Add Alert Rule
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                /* ─── LIVE ALERTS & AUDIT HISTORY TABS ────────── */
                <div className="space-y-3">
                    {filteredAlerts.length === 0 ? (
                        <div className="py-20 text-center bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
                            <Bell size={36} className="mx-auto text-[#777367] dark:text-[#9E988A] mb-3 opacity-60" />
                            <p className="text-base font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                {activeTab === 'Overview' ? 'No active alerts' : 'No audit history found'}
                            </p>
                            <p className="text-xs text-[#777367] font-medium mt-1">
                                {activeTab === 'Overview'
                                    ? 'All clear — no policy threshold violations detected in current period.'
                                    : 'Historical events will appear here once alerts trigger and resolve.'}
                            </p>
                        </div>
                    ) : (
                        filteredAlerts.map(alert => (
                            <AlertRow
                                key={alert.id}
                                alert={alert}
                                onDismiss={dismissAlert}
                            />
                        ))
                    )}
                </div>
            )}

            <CreateAlertModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    loadRules();
                    if (toast?.success) toast.success('New alert rule added.');
                }}
            />
        </div>
    );
}

export default Alerts;
