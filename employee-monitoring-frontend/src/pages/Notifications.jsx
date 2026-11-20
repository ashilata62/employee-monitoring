import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    Trash2,
    CheckCheck,
    Search,
    ArrowLeft,
    RefreshCw,
    ExternalLink,
    X,
    Clock,
    ShieldAlert,
    Check
} from 'lucide-react';
import { clsx } from 'clsx';
import { useRealTime } from '../hooks/RealTimeContext';
import { useAuthStore } from '../store/authStore';

export function Notifications() {
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const {
        notifications = [],
        markAllNotificationsRead,
        markNotificationAsRead,
        deleteNotification,
        deleteAllNotifications,
        syncNotifications
    } = useRealTime();

    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const rolePath = role?.toLowerCase() || 'admin';
    const resolveRolePath = useCallback((path) => {
        if (!path) return `/${rolePath}/dashboard`;
        if (role === 'EMPLOYEE' && path.includes('alerts')) {
            return `/${rolePath}/notifications`;
        }
        const clean = path.startsWith('/') ? path.slice(1) : path;
        if (clean.startsWith('admin/') || clean.startsWith('manager/') || clean.startsWith('employee/')) {
            return `/${clean}`;
        }
        return `/${rolePath}/${clean}`;
    }, [role, rolePath]);

    // Dynamic Category Resolver
    const getCategoryDetails = useCallback((n) => {
        const title = (n.title || '').toLowerCase();
        const type = (n.type || '').toLowerCase();

        if (title.includes('late') || title.includes('shift arrival')) {
            return {
                label: 'Attendance Alert',
                badgeStyle: 'bg-[#A84B4B]/10 text-[#A84B4B] border-[#A84B4B]/30 dark:bg-[#A84B4B]/20 dark:text-[#E58B8B]',
                icon: Clock,
                iconBg: 'bg-[#FAF3F2] text-[#A84B4B] dark:bg-[#3D2525] dark:text-[#E58B8B]'
            };
        }
        if (title.includes('idle') || title.includes('inactivity')) {
            return {
                label: 'Inactivity Alert',
                badgeStyle: 'bg-[#C98A3C]/10 text-[#C98A3C] border-[#C98A3C]/30 dark:bg-[#C98A3C]/20 dark:text-[#E5B56D]',
                icon: AlertTriangle,
                iconBg: 'bg-[#FAF0E1] text-[#C98A3C] dark:bg-[#332717] dark:text-[#E5B56D]'
            };
        }
        if (title.includes('prohibited') || title.includes('violation') || title.includes('security')) {
            return {
                label: 'Security Violation',
                badgeStyle: 'bg-[#A84B4B]/10 text-[#A84B4B] border-[#A84B4B]/30 dark:bg-[#A84B4B]/20 dark:text-[#E58B8B]',
                icon: ShieldAlert,
                iconBg: 'bg-[#FAF3F2] text-[#A84B4B] dark:bg-[#3D2525] dark:text-[#E58B8B]'
            };
        }
        if (title.includes('work session') || title.includes('clock') || title.includes('break')) {
            return {
                label: 'Attendance Event',
                badgeStyle: 'bg-[#5E7D64]/10 text-[#5E7D64] border-[#5E7D64]/30 dark:bg-[#5E7D64]/20 dark:text-[#8BB394]',
                icon: CheckCircle2,
                iconBg: 'bg-[#F4F7F4] text-[#5E7D64] dark:bg-[#1E2B20] dark:text-[#8BB394]'
            };
        }
        if (title.includes('task')) {
            return {
                label: 'Task & Workflow',
                badgeStyle: 'bg-[#B9955B]/10 text-[#B9955B] border-[#B9955B]/30 dark:bg-[#B9955B]/20 dark:text-[#D3B98D]',
                icon: Info,
                iconBg: 'bg-[#F8F2E4] text-[#B9955B] dark:bg-[#2C2417] dark:text-[#D3B98D]'
            };
        }
        if (title.includes('screenshot')) {
            return {
                label: 'Screenshot Activity',
                badgeStyle: 'bg-[#5E7D64]/10 text-[#5E7D64] border-[#5E7D64]/30 dark:bg-[#5E7D64]/20 dark:text-[#8BB394]',
                icon: Info,
                iconBg: 'bg-[#F4F7F4] text-[#5E7D64] dark:bg-[#1E2B20] dark:text-[#8BB394]'
            };
        }
        if (type === 'alert' || type === 'critical' || type === 'error') {
            return {
                label: 'System Alert',
                badgeStyle: 'bg-[#A84B4B]/10 text-[#A84B4B] border-[#A84B4B]/30 dark:bg-[#A84B4B]/20 dark:text-[#E58B8B]',
                icon: AlertCircle,
                iconBg: 'bg-[#FAF3F2] text-[#A84B4B] dark:bg-[#3D2525] dark:text-[#E58B8B]'
            };
        }
        if (type === 'warning') {
            return {
                label: 'Warning',
                badgeStyle: 'bg-[#C98A3C]/10 text-[#C98A3C] border-[#C98A3C]/30 dark:bg-[#C98A3C]/20 dark:text-[#E5B56D]',
                icon: AlertTriangle,
                iconBg: 'bg-[#FAF0E1] text-[#C98A3C] dark:bg-[#332717] dark:text-[#E5B56D]'
            };
        }
        if (type === 'success') {
            return {
                label: 'Success Event',
                badgeStyle: 'bg-[#5E7D64]/10 text-[#5E7D64] border-[#5E7D64]/30 dark:bg-[#5E7D64]/20 dark:text-[#8BB394]',
                icon: CheckCircle2,
                iconBg: 'bg-[#F4F7F4] text-[#5E7D64] dark:bg-[#1E2B20] dark:text-[#8BB394]'
            };
        }
        return {
            label: 'System Notice',
            badgeStyle: 'bg-[#B9955B]/10 text-[#B9955B] border-[#B9955B]/30 dark:bg-[#B9955B]/20 dark:text-[#D3B98D]',
            icon: Info,
            iconBg: 'bg-[#F8F2E4] text-[#B9955B] dark:bg-[#2C2417] dark:text-[#D3B98D]'
        };
    }, []);

    // Dynamic Timestamp Formatter
    const formatTimestamp = (n) => {
        if (!n.createdAt) return n.time || 'Just now';
        try {
            const dateObj = new Date(n.createdAt);
            const now = new Date();
            const isToday = dateObj.toDateString() === now.toDateString();
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (isToday) {
                return `Today at ${timeStr}`;
            }
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (dateObj.toDateString() === yesterday.toDateString()) {
                return `Yesterday at ${timeStr}`;
            }
            return `${dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${timeStr}`;
        } catch (e) {
            return n.time || 'Just now';
        }
    };

    // Dynamic Filter Counts
    const counts = useMemo(() => {
        const total = notifications.length;
        const unread = notifications.filter(n => n.unread).length;
        const alerts = notifications.filter(n => {
            const t = (n.type || '').toLowerCase();
            return t === 'alert' || t === 'warning' || t === 'critical' || t === 'error';
        }).length;
        const success = notifications.filter(n => (n.type || '').toLowerCase() === 'success').length;
        const info = notifications.filter(n => {
            const t = (n.type || '').toLowerCase();
            return t === 'info' || t === 'general' || t === 'announcement' || !t;
        }).length;
        return { total, unread, alerts, success, info };
    }, [notifications]);

    // Filter Navigation Tabs
    const filterTabs = [
        { id: 'all', label: 'All Notifications', icon: Bell, count: counts.total },
        { id: 'unread', label: 'Unread Only', icon: Bell, count: counts.unread },
        { id: 'alerts', label: 'Alerts & Warnings', icon: AlertCircle, count: counts.alerts },
        { id: 'success', label: 'Success Events', icon: CheckCircle2, count: counts.success },
        { id: 'info', label: 'System Notices', icon: Info, count: counts.info },
    ];

    // Filter & Search Logic
    const filteredNotifications = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return notifications.filter(n => {
            const type = (n.type || '').toLowerCase();
            const matchesFilter =
                activeFilter === 'all' ||
                (activeFilter === 'unread' && n.unread) ||
                (activeFilter === 'alerts' && (type === 'alert' || type === 'warning' || type === 'critical' || type === 'error')) ||
                (activeFilter === 'success' && type === 'success') ||
                (activeFilter === 'info' && (type === 'info' || type === 'general' || type === 'announcement' || !type));

            if (!matchesFilter) return false;

            if (!query) return true;

            const titleMatch = (n.title || '').toLowerCase().includes(query);
            const descMatch = (n.description || '').toLowerCase().includes(query);
            const typeMatch = (n.type || '').toLowerCase().includes(query);
            let metaMatch = false;
            if (n.metadata) {
                const metaStr = typeof n.metadata === 'string' ? n.metadata : JSON.stringify(n.metadata);
                metaMatch = metaStr.toLowerCase().includes(query);
            }

            return titleMatch || descMatch || typeMatch || metaMatch;
        });
    }, [notifications, activeFilter, searchQuery]);

    // Handle Manual Refresh
    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            if (typeof syncNotifications === 'function') {
                await syncNotifications();
            }
        } finally {
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    // Handle Click on Notification Item
    const handleNotificationClick = (n) => {
        if (n.unread) {
            markNotificationAsRead(n.id);
        }
        if (n.link && !(role === 'EMPLOYEE' && n.link.includes('alerts'))) {
            navigate(resolveRolePath(n.link));
        }
    };

    // Handle Delete All
    const handleDeleteAll = () => {
        if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
            deleteAllNotifications();
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(resolveRolePath('/dashboard'))}
                    className="group flex items-center gap-2 text-[#777367] hover:text-[#B9955B] dark:text-[#B8B3A7] dark:hover:text-[#D3B98D] transition-colors font-bold text-sm cursor-pointer"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBF9F5] dark:bg-[#252B20] border border-[#E5DED2] dark:border-[#384232] shadow-xs group-hover:border-[#B9955B] transition-all">
                        <ArrowLeft size={16} />
                    </div>
                    <span>Back to Dashboard</span>
                </button>

                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5DED2] dark:border-[#384232] bg-[#FBF9F5] dark:bg-[#252B20] text-xs font-semibold text-[#777367] dark:text-[#B8B3A7] hover:text-[#29291F] dark:hover:text-[#F5F1E9] transition-all cursor-pointer shadow-xs"
                    title="Refresh notifications"
                >
                    <RefreshCw size={14} className={clsx(isRefreshing && "animate-spin text-[#B9955B]")} />
                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
            </div>

            {/* Title & Bulk Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DED2] dark:border-[#384232] pb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#29291F] dark:text-[#F5F1E9] uppercase">
                        Notifications & Alerts
                    </h1>
                    <p className="text-xs sm:text-sm text-[#777367] dark:text-[#B8B3A7] font-medium mt-1">
                        {counts.unread > 0 ? (
                            <span>You have <strong className="text-[#A84B4B] dark:text-[#E58B8B] font-bold">{counts.unread} unread</strong> notifications across {counts.total} total items.</span>
                        ) : (
                            <span>All notifications are up to date ({counts.total} total items).</span>
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={markAllNotificationsRead}
                        disabled={counts.unread === 0}
                        className={clsx(
                            "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer",
                            counts.unread > 0
                                ? "bg-[#FBF9F5] dark:bg-[#252B20] border-[#E5DED2] dark:border-[#384232] text-[#B9955B] hover:bg-[#EEE8DD]/60 dark:hover:bg-[#2E362A]"
                                : "opacity-40 cursor-not-allowed bg-transparent border-[#E5DED2] dark:border-[#384232] text-[#777367]"
                        )}
                    >
                        <CheckCheck size={16} />
                        <span>Mark all as read</span>
                    </button>
                    <button
                        onClick={handleDeleteAll}
                        disabled={counts.total === 0}
                        className={clsx(
                            "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer",
                            counts.total > 0
                                ? "bg-[#FAF3F2] dark:bg-[#3D2525]/30 border-[#A84B4B]/30 text-[#A84B4B] hover:bg-[#A84B4B]/15"
                                : "opacity-40 cursor-not-allowed bg-transparent border-[#E5DED2] dark:border-[#384232] text-[#777367]"
                        )}
                    >
                        <Trash2 size={16} />
                        <span>Clear All</span>
                    </button>
                </div>
            </div>

            {/* Main Content: Sidebar Tabs + Notification Feed */}
            <div className="grid gap-6 md:grid-cols-[250px_1fr]">
                {/* Left Filter Navigation */}
                <aside className="space-y-4">
                    <div className="bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border border-[#E5DED2] dark:border-[#384232] p-3 shadow-xs">
                        <div className="flex items-center justify-between mb-2 px-2 py-1">
                            <span className="text-[11px] font-black uppercase tracking-wider text-[#9E988A] dark:text-[#8A8F82]">
                                Filter Category
                            </span>
                            <span className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7]">
                                {counts.total} items
                            </span>
                        </div>
                        <nav className="space-y-1">
                            {filterTabs.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeFilter === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveFilter(item.id)}
                                        className={clsx(
                                            "w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-all font-semibold text-xs cursor-pointer",
                                            isActive
                                                ? "bg-[#B9955B] text-white shadow-xs font-bold"
                                                : "text-[#777367] dark:text-[#B8B3A7] hover:bg-[#EEE8DD]/60 dark:hover:bg-[#2E362A] hover:text-[#29291F] dark:hover:text-[#F5F1E9]"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Icon size={16} />
                                            <span>{item.label}</span>
                                        </div>
                                        <span className={clsx(
                                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                            isActive
                                                ? "bg-white/20 text-white"
                                                : (item.id === 'unread' && item.count > 0)
                                                    ? "bg-[#A84B4B]/15 text-[#A84B4B] dark:text-[#E58B8B]"
                                                    : "bg-[#EEE8DD] dark:bg-[#2E362A] text-[#777367] dark:text-[#B8B3A7]"
                                        )}>
                                            {item.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Quick Role Context Info */}
                    <div className="rounded-2xl border border-[#E5DED2] dark:border-[#384232] bg-[#FBF9F5] dark:bg-[#252B20] p-4 text-xs text-[#777367] dark:text-[#B8B3A7] space-y-1 shadow-xs hidden md:block">
                        <p className="font-bold text-[#29291F] dark:text-[#F5F1E9]">Role-Scoped Feed</p>
                        <p className="text-[11px] leading-relaxed">
                            {role === 'ADMIN' && 'As Administrator, you have full access to all organizational alerts, check-ins, and compliance notices.'}
                            {role === 'MANAGER' && 'As Manager, your feed displays alerts and attendance events for members of your assigned team.'}
                            {role === 'EMPLOYEE' && 'As Employee, your feed displays your personal schedule, task updates, and general broadcasts.'}
                        </p>
                    </div>
                </aside>

                {/* Right Notification Stream */}
                <div className="space-y-4">
                    {/* Search Input Bar */}
                    <div className="relative group">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E988A] group-focus-within:text-[#B9955B] transition-colors"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search notifications by title, details or event..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-2xl border border-[#E5DED2] bg-[#FBF9F5] dark:bg-[#252B20] dark:border-[#384232] pl-11 pr-10 py-3 text-xs sm:text-sm font-medium text-[#29291F] dark:text-[#F5F1E9] placeholder-[#9E988A] dark:placeholder-[#8A8F82] focus:border-[#B9955B] focus:ring-2 focus:ring-[#B9955B]/20 outline-none transition-all shadow-xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E988A] hover:text-[#29291F] dark:hover:text-[#F5F1E9] p-1 rounded-lg transition-colors cursor-pointer"
                                title="Clear search"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Results Meta Info */}
                    <div className="flex items-center justify-between px-1 text-xs text-[#777367] dark:text-[#B8B3A7]">
                        <span>
                            Showing <strong className="text-[#29291F] dark:text-[#F5F1E9]">{filteredNotifications.length}</strong> of {notifications.length} notifications
                        </span>
                        {(activeFilter !== 'all' || searchQuery) && (
                            <button
                                onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                                className="text-xs font-semibold text-[#B9955B] hover:text-[#A17D45] transition-colors cursor-pointer"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>

                    {/* Notification Cards List */}
                    <div className="space-y-3">
                        {filteredNotifications.length > 0 ? (
                            filteredNotifications.map((n) => {
                                const cat = getCategoryDetails(n);
                                const CategoryIcon = cat.icon;
                                const isUnread = !!n.unread;

                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={clsx(
                                            "group relative flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer",
                                            isUnread
                                                ? "bg-[#FBF9F5] dark:bg-[#252B20] border-[#B9955B]/60 dark:border-[#B9955B]/50 ring-1 ring-[#B9955B]/15"
                                                : "bg-[#FBF9F5]/80 dark:bg-[#252B20]/80 border-[#E5DED2] dark:border-[#384232] hover:bg-[#FBF9F5] dark:hover:bg-[#252B20]"
                                        )}
                                    >
                                        {/* Icon Container */}
                                        <div className={clsx(
                                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform group-hover:scale-105",
                                            cat.iconBg
                                        )}>
                                            <CategoryIcon size={20} />
                                        </div>

                                        {/* Notification Text Content */}
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={clsx(
                                                    "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border",
                                                    cat.badgeStyle
                                                )}>
                                                    {cat.label}
                                                </span>
                                                <span className="text-[11px] font-semibold text-[#9E988A] dark:text-[#8A8F82]">
                                                    {formatTimestamp(n)}
                                                </span>
                                                {isUnread && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#A84B4B] dark:text-[#E58B8B]">
                                                        <span className="h-2 w-2 rounded-full bg-[#A84B4B] ring-2 ring-[#A84B4B]/20 animate-pulse"></span>
                                                        New
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className={clsx(
                                                "text-sm sm:text-base font-bold tracking-tight transition-colors leading-snug",
                                                isUnread ? "text-[#29291F] dark:text-[#F5F1E9]" : "text-[#777367] dark:text-[#B8B3A7]"
                                            )}>
                                                {n.title}
                                            </h3>

                                            {n.description && (
                                                <p className="text-xs sm:text-sm text-[#777367] dark:text-[#B8B3A7] leading-relaxed font-normal">
                                                    {n.description}
                                                </p>
                                            )}

                                            {/* Action Link Indicator */}
                                            {n.link && !(role === 'EMPLOYEE' && n.link.includes('alerts')) && (
                                                <div className="pt-1">
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B9955B] group-hover:underline">
                                                        <span>View Details</span>
                                                        <ExternalLink size={12} />
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Actions (Mark read & Delete) */}
                                        <div className="flex sm:flex-col items-center justify-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5DED2]/60 dark:border-[#384232]/60">
                                            {isUnread && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markNotificationAsRead(n.id);
                                                    }}
                                                    className="p-1.5 text-[#777367] hover:text-[#5E7D64] hover:bg-[#5E7D64]/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Mark as read"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(n.id);
                                                }}
                                                className="p-1.5 text-[#777367] hover:text-[#A84B4B] hover:bg-[#A84B4B]/10 rounded-lg transition-colors cursor-pointer"
                                                title="Delete notification"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border border-dashed border-[#E5DED2] dark:border-[#384232] text-center">
                                <div className="h-14 w-14 rounded-2xl bg-[#EEE8DD]/60 dark:bg-[#2E362A] flex items-center justify-center text-[#777367] dark:text-[#B8B3A7] mb-3">
                                    <Bell size={28} />
                                </div>
                                <h3 className="text-base font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                    No notifications found
                                </h3>
                                <p className="text-xs text-[#777367] dark:text-[#B8B3A7] max-w-sm mt-1">
                                    {searchQuery
                                        ? `No notification matched "${searchQuery}". Try a different keyword.`
                                        : activeFilter === 'unread'
                                            ? 'You are all caught up! No unread notifications.'
                                            : 'No notifications in this category yet.'}
                                </p>
                                {(activeFilter !== 'all' || searchQuery) && (
                                    <button
                                        onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                                        className="mt-4 px-4 py-2 rounded-xl bg-[#B9955B] text-white text-xs font-bold hover:bg-[#A17D45] transition-colors cursor-pointer shadow-xs"
                                    >
                                        Reset to all notifications
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Notifications;
