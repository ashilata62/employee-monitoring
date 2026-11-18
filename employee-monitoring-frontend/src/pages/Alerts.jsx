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
import alertService from '../services/alertService';
import { useToast } from '../context/ToastContext';

const SEVERITY_CONFIG = {
    critical: {
        label: 'Critical',
        badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
        icon: AlertOctagon,
        dot: 'bg-rose-500'
    },
    warning: {
        label: 'Warning',
        badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
        icon: AlertTriangle,
        dot: 'bg-amber-500'
    },
    info: {
        label: 'Info',
        badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
        icon: Info,
        dot: 'bg-blue-500'
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
        <div className={`flex items-start gap-3.5 p-4 rounded-xl sm:rounded-2xl border transition-all ${alert.read ? 'opacity-60 bg-white/50 dark:bg-slate-900/40' : 'bg-white dark:bg-slate-900 shadow-sm'} border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700`}>
            <div className={`mt-0.5 p-2 rounded-xl border ${cfg.badge} shrink-0`}>
                <Icon size={16} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {alert.employeeName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cfg.badge}`}>
                        {cfg.label}
                    </span>
                    {!alert.read && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                </div>

                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    {alert.message}
                </p>

                {alert.screenshotUrl && (
                    <div className="mt-2">
                        <a
                            href={alert.screenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline border border-slate-200 dark:border-slate-700"
                        >
                            <ExternalLink size={12} />
                            View Violation Screenshot
                        </a>
                    </div>
                )}

                <div className="flex items-center gap-2 mt-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>{alert.team}</span>
                    <span>•</span>
                    <span>{alert.type}</span>
                    <span>•</span>
                    <span>{alert.date}</span>
                </div>
            </div>

            {!alert.read && (
                <button
                    onClick={() => onDismiss(alert.id)}
                    title="Dismiss alert"
                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
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
    const [activeTab, setActiveTab] = useState('Overview'); // 'Overview' | 'Rules' | 'Logs'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [rules, setRules] = useState([]);
    const [rulesLoading, setRulesLoading] = useState(false);

    const loadRules = useCallback(async () => {
        setRulesLoading(true);
        try {
            const data = await alertService.getAlertRules();
            setRules(Array.isArray(data) ? data : (data?.data || []));
        } catch (err) {
            console.error('Failed to load alert rules:', err);
        } finally {
            setRulesLoading(false);
        }
    }, []);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        Alerts & Incidents
                        {unreadCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-bold">
                                {unreadCount} Active
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Real-time violation detection for attendance, excessive idle time, and prohibited applications.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    {unreadCount > 0 && (
                        <button
                            onClick={dismissAllAlerts}
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                            <CheckCheck size={14} /> Mark All Read
                        </button>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer"
                    >
                        <Plus size={14} />
                        <span>New Alert Rule</span>
                    </button>
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                {[
                    { label: 'Critical', count: bySeverity.critical, color: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60', icon: AlertOctagon },
                    { label: 'Warning',  count: bySeverity.warning,  color: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60', icon: AlertTriangle },
                    { label: 'Info',     count: bySeverity.info,     color: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60', icon: Info },
                ].map(card => {
                    const isSelected = filterType === card.label.toLowerCase();
                    const CardIcon = card.icon;
                    return (
                        <button
                            key={card.label}
                            onClick={() => setFilterType(isSelected ? 'all' : card.label.toLowerCase())}
                            className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-left ${
                                isSelected
                                    ? 'ring-2 ring-primary-500 border-primary-500 bg-white dark:bg-slate-900'
                                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                            }`}
                        >
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    {card.label} Severity
                                </span>
                                <p className={`text-2xl font-bold mt-0.5 ${card.color}`}>
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
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-1">
                    {[
                        { id: 'Overview', label: 'Live Alerts', icon: Bell, count: unreadCount },
                        { id: 'Rules', label: 'Alert Rules', icon: SlidersHorizontal, count: rules.length },
                        { id: 'Logs', label: 'Audit History', icon: History, count: alerts.length },
                    ].map(tab => {
                        const TabIcon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold transition-all relative border-b-2 -mb-[2px] ${
                                    isActive
                                        ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
                                }`}
                            >
                                <TabIcon size={14} />
                                <span>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                        isActive ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'Rules' && (
                    <button
                        onClick={loadRules}
                        disabled={rulesLoading}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 pb-2"
                    >
                        <RefreshCw size={13} className={rulesLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                )}
            </div>

            {/* Search toolbar (for Overview & Logs) */}
            {activeTab !== 'Rules' && (
                <div className="flex items-center justify-between gap-4">
                    <div className="relative w-full md:w-80">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by employee, message..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm transition-all"
                        />
                    </div>
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
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
                                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200/80 dark:border-primary-800/80 flex items-center justify-center shrink-0">
                                                <RuleIcon size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                    {rule.name}
                                                </h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                                    Trigger: <strong className="text-slate-700 dark:text-slate-300">{rule.trigger}</strong>
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteRule(rule.id, rule.name)}
                                            title="Delete alert rule"
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                                        <span>Scope: <strong className="text-slate-600 dark:text-slate-300">{rule.scope || 'All Employees'}</strong></span>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[9px]">
                                            Active
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {rules.length === 0 && (
                        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
                            <SlidersHorizontal size={36} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-sm font-bold text-slate-800 dark:text-white">No custom alert rules configured</p>
                            <p className="text-xs text-slate-400 mt-1">Create rules to monitor employee thresholds.</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="mt-4 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold"
                            >
                                Add Alert Rule
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                /* ─── LIVE ALERTS & AUDIT HISTORY TABS ────────── */
                <div className="space-y-3">
                    {filteredAlerts.length === 0 ? (
                        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <Bell size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-base font-bold text-slate-900 dark:text-white">
                                {activeTab === 'Overview' ? 'No active alerts' : 'No audit history found'}
                            </p>
                            <p className="text-xs text-slate-500 font-medium mt-1">
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
