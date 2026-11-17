import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, Menu, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';
import { ProfileDropdown } from '../components/header/ProfileDropdown';
import { HeaderTaskTimer } from '../components/header/HeaderTaskTimer';
import { useRealTime } from '../hooks/RealTimeContext';
import { WebTrackerAgent } from '../components/agent/WebTrackerAgent';

export function Header({ onMenuClick }) {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const { notifications: liveNotifications, markAllNotificationsRead, markNotificationAsRead, deleteNotification } = useRealTime();
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    const rolePath = role?.toLowerCase() || 'admin';
    const resolveRolePath = (path) => {
        if (!path) return `/${rolePath}/notifications`;
        const clean = path.startsWith('/') ? path.slice(1) : path;
        if (clean.startsWith('admin/') || clean.startsWith('manager/') || clean.startsWith('employee/')) {
            return `/${clean}`;
        }
        return `/${rolePath}/${clean}`;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = liveNotifications.filter(n => n.unread).length;

    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                >
                    <Menu size={22} />
                </button>
            </div>

            <div className="flex items-center gap-2 md:gap-3.5">
                <HeaderTaskTimer />
                <WebTrackerAgent />

                <button
                    onClick={toggleTheme}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-all active:scale-95"
                    title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
                </button>

                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={clsx(
                            "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-95",
                            showNotifications
                                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        )}
                        title="Notifications"
                    >
                        <Bell size={18} className={unreadCount > 0 ? "animate-pulse" : ""} />
                        {unreadCount > 0 && (
                            <span className="absolute right-2 top-2 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="fixed left-4 right-4 top-[4.5rem] w-auto md:absolute md:right-0 md:top-full md:left-auto md:w-80 md:mt-2 origin-top-right rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-1 z-50 overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                                <button
                                    onClick={markAllNotificationsRead}
                                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
                                >
                                    Mark all as read
                                </button>
                            </div>
                            <div className="max-h-96 overflow-y-auto py-1 scrollbar-thin">
                                {liveNotifications.length > 0 ? (
                                    liveNotifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => {
                                                markNotificationAsRead(n.id);
                                                if (n.link) {
                                                    setShowNotifications(false);
                                                    navigate(resolveRolePath(n.link));
                                                }
                                            }}
                                            className={clsx(
                                                "group relative flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer",
                                                n.unread && "bg-indigo-50/40 dark:bg-indigo-950/20"
                                            )}
                                        >
                                            <div className={clsx(
                                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5",
                                                n.type === 'alert' && "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
                                                n.type === 'success' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
                                                n.type === 'info' && "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                                            )}>
                                                {n.type === 'alert' && <AlertCircle size={16} />}
                                                {n.type === 'success' && <CheckCircle2 size={16} />}
                                                {n.type === 'info' && <Info size={16} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <p className={clsx("text-xs transition-colors", n.unread ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300")}>
                                                        {n.title}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(n.id);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 transition-all"
                                                            title="Delete notification"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.description}</p>
                                                <p className="mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">{n.time || 'Just now'}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center text-xs text-slate-400">
                                        No new notifications
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-slate-100 dark:border-slate-800 p-2.5 text-center bg-slate-50 dark:bg-slate-850">
                                <button
                                    onClick={() => {
                                        setShowNotifications(false);
                                        navigate(resolveRolePath('/notifications'));
                                    }}
                                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors w-full py-0.5 block"
                                >
                                    View All Notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <ProfileDropdown />
            </div>
        </header>
    );
}
