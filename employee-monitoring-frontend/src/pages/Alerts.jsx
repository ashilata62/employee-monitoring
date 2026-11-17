import React, { useState, useMemo } from 'react';
import { Bell, Search, X, CheckCheck, AlertTriangle, Info, AlertOctagon, Plus } from 'lucide-react';
import { CreateAlertModal } from '../components/CreateAlertModal';
import { useRealTime } from '../hooks/RealTimeContext';

const SEVERITY_CONFIG = {
    critical: { label: 'Critical', cls: 'bg-[#FAF3F2] text-[#A84B4B] border-[#F2D6D3] dark:bg-[#2E1E1E] dark:text-[#E8A5A5] dark:border-[#5C2B2B]', icon: AlertOctagon, dot: 'bg-[#A84B4B]' },
    warning:  { label: 'Warning',  cls: 'bg-[#FDFBF5] text-[#C98A3C] border-[#F5E6CC] dark:bg-[#2E281C] dark:text-[#E8C28D] dark:border-[#5C4D2E]', icon: AlertTriangle, dot: 'bg-[#C98A3C]' },
    info:     { label: 'Info',     cls: 'bg-[#EEE8DD] text-[#30382B] border-[#E5DED2] dark:bg-[#1E2419] dark:text-[#D3B98D] dark:border-[#384232]', icon: Info, dot: 'bg-[#B9955B]' },
};

const TYPE_LABELS = { idle: 'Idle Alert', unproductive: 'Low Productivity', late_login: 'Late Login' };

function AlertRow({ alert, onDismiss }) {
    const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
    const Icon = cfg.icon;
    return (
        <div className={`flex items-start gap-3.5 p-4 rounded-xl sm:rounded-2xl border transition-all ${alert.read ? 'opacity-50' : ''} bg-[#FBF9F5] dark:bg-[#252B20] border-[#E5DED2] dark:border-[#384232] shadow-warm-xs hover:border-[#B9955B]/60`}>
            <div className={`mt-0.5 p-2 rounded-xl border ${cfg.cls} shrink-0`}>
                <Icon size={15} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">{alert.employeeName}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${cfg.cls}`}>{cfg.label}</span>
                    {!alert.read && <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
                </div>
                <p className="text-xs font-medium text-[#777367] dark:text-[#B8B3A7] leading-relaxed">{alert.message}</p>
                {alert.screenshotUrl && (
                    <div className="mt-1.5">
                        <a href={alert.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B9955B] hover:underline">
                            View Violation Screenshot
                        </a>
                    </div>
                )}
                <div className="flex items-center gap-2.5 mt-2 text-[10px] font-semibold text-[#777367] dark:text-[#9E988A] uppercase tracking-wider">
                    <span>{alert.team}</span>
                    <span>•</span>
                    <span>{TYPE_LABELS[alert.type] || alert.type}</span>
                    <span>•</span>
                    <span>{alert.date}</span>
                </div>
            </div>
            {!alert.read && (
                <button
                    onClick={() => onDismiss(alert.id)}
                    className="shrink-0 p-1.5 rounded-lg text-[#777367] hover:text-[#A84B4B] hover:bg-[#FAF3F2] dark:hover:bg-[#2E1E1E] transition-all cursor-pointer"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}

export function Alerts() {
    const { alerts, dismissAlert, dismissAllAlerts } = useRealTime();
    const [activeTab, setActiveTab] = useState('Overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filtered = useMemo(() => {
        return alerts.filter(a => {
            if (filterType !== 'all' && a.severity !== filterType) return false;
            if (search && !a.message.toLowerCase().includes(search.toLowerCase()) && !a.employeeName.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [alerts, filterType, search]);

    const unreadCount = alerts.filter(a => !a.read).length;
    const bySeverity = {
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning:  alerts.filter(a => a.severity === 'warning').length,
        info:     alerts.filter(a => a.severity === 'info').length,
    };

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-normal text-[#29291F] dark:text-[#F5F1E9] tracking-tight flex items-center gap-3">
                        Alerts
                        {unreadCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#A84B4B] text-white text-[11px] font-bold">{unreadCount}</span>
                        )}
                    </h1>
                    <p className="text-xs font-medium text-[#777367] dark:text-[#B8B3A7] mt-0.5">Auto-generated from productivity monitoring</p>
                </div>
                <div className="flex items-center gap-2.5">
                    {unreadCount > 0 && (
                        <button
                            onClick={dismissAllAlerts}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5DED2] dark:border-[#384232] bg-[#FBF9F5] dark:bg-[#252B20] text-xs font-semibold text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] hover:bg-[#EEE8DD] transition-all cursor-pointer shadow-warm-xs"
                        >
                            <CheckCheck size={14} /> Mark All Read
                        </button>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-warm-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                        <Plus size={14} className="text-[#D3B98D]" />
                        <span>New Alert Rule</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3.5 sm:gap-4 mb-6">
                {[
                    { label: 'Critical', count: bySeverity.critical, color: 'text-[#A84B4B]', bg: 'bg-[#FBF9F5] dark:bg-[#252B20] border-[#E5DED2] dark:border-[#384232]' },
                    { label: 'Warning',  count: bySeverity.warning,  color: 'text-[#C98A3C]', bg: 'bg-[#FBF9F5] dark:bg-[#252B20] border-[#E5DED2] dark:border-[#384232]' },
                    { label: 'Info',     count: bySeverity.info,     color: 'text-[#777367]', bg: 'bg-[#FBF9F5] dark:bg-[#252B20] border-[#E5DED2] dark:border-[#384232]' },
                ].map(card => {
                    const isSelected = filterType === card.label.toLowerCase();
                    return (
                        <button
                            key={card.label}
                            onClick={() => setFilterType(isSelected ? 'all' : card.label.toLowerCase())}
                            className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all ${card.bg} ${isSelected ? 'ring-2 ring-[#B9955B] border-[#B9955B]' : 'hover:border-[#B9955B]/60 shadow-warm-xs'}`}
                        >
                            <p className={`font-serif text-2xl font-bold ${card.color}`}>{card.count}</p>
                            <p className="text-[10px] font-bold text-[#777367] uppercase tracking-[0.14em] mt-1">{card.label}</p>
                        </button>
                    );
                })}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-[#E5DED2] dark:border-[#384232]">
                {['Overview', 'Logs'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-xs uppercase tracking-wider font-bold transition-all relative cursor-pointer ${activeTab === tab ? 'text-[#B9955B]' : 'text-[#777367] hover:text-[#29291F]'}`}
                    >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#B9955B] rounded-full" />}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777367]" />
                    <input
                        type="text"
                        placeholder="Search alerts..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-[#FBF9F5] dark:bg-[#252B20] border border-[#E5DED2] dark:border-[#384232] rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] outline-none shadow-warm-xs focus:border-[#B9955B] transition-all"
                    />
                </div>
                {search && (
                    <button onClick={() => setSearch('')} className="text-xs font-semibold text-[#777367] hover:text-[#A84B4B] flex items-center gap-1 cursor-pointer">
                        <X size={12} /> Clear
                    </button>
                )}
            </div>

            {/* Alert List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="py-20 text-center bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border border-[#E5DED2] dark:border-[#384232] shadow-warm-xs">
                        <Bell size={36} className="mx-auto text-[#C5BEAF] dark:text-[#524B40] mb-3" />
                        <p className="font-serif text-lg font-normal text-[#29291F] dark:text-[#F5F1E9]">No alerts found</p>
                        <p className="text-xs text-[#777367] font-medium mt-1">All clear — no threshold violations detected</p>
                    </div>
                ) : (
                    filtered.map(alert => (
                        <AlertRow key={alert.id} alert={alert} onDismiss={dismissAlert} />
                    ))
                )}
            </div>

            <CreateAlertModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
