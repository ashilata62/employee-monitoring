import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, Menu, CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
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
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#E5DED2] bg-[#F5F1E9]/95 px-2.5 sm:px-4 md:px-8 backdrop-blur-md dark:border-[#384232] dark:bg-[#1A1F18]/95 transition-colors">
            <div className="flex items-center gap-2 sm:gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl text-[#777367] hover:bg-[#EEE8DD] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:bg-[#283025] transition-colors cursor-pointer"
                >
                    <Menu size={22} />
                </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3.5">
                <HeaderTaskTimer />
                <WebTrackerAgent />

                <button
                    onClick={toggleTheme}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-[#777367] hover:bg-[#EEE8DD] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:bg-[#283025] transition-all active:scale-95"
                    title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {theme === 'dark' ? <Sun size={18} className="text-[#D3B98D]" /> : <Moon size={18} className="text-[#777367]" />}
                </button>

                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={clsx(
                            "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer",
                            showNotifications
                                ? "bg-[#B9955B] text-white"
                                : "text-[#777367] hover:bg-[#EEE8DD] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:bg-[#283025]"
                        )}
                        title="Notifications & Alerts"
                    >
                        <Bell size={18} className={unreadCount > 0 ? "text-[#C98A3C] dark:text-[#D3B98D]" : ""} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#A84B4B] text-[9px] font-bold text-white shadow-sm ring-2 ring-[#F5F1E9] dark:ring-[#1A1F18]">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="fixed left-4 right-4 top-[4.5rem] w-auto md:absolute md:right-0 md:top-full md:left-auto md:w-96 md:mt-2 origin-top-right rounded-2xl border border-[#E5DED2] bg-[#FBF9F5] shadow-2xl dark:border-[#384232] dark:bg-[#252B20] animate-in fade-in slide-in-from-top-1 z-50 overflow-hidden">
                            <div className="flex items-center justify-between border-b border-[#E5DED2] px-4 py-3 dark:border-[#384232]">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-[#29291F] dark:text-[#F5F1E9]">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-[#A84B4B]/15 text-[#A84B4B] text-[10px] font-bold">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={markAllNotificationsRead}
                                    className="text-xs font-semibold text-[#B9955B] hover:text-[#A17D45] transition-colors cursor-pointer"
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
                                                "group relative flex gap-3 px-4 py-3 hover:bg-[#EEE8DD]/60 dark:hover:bg-[#2E362A] transition-colors cursor-pointer",
                                                n.unread && "bg-[#EEE8DD]/40 dark:bg-[#2E362A]/50"
                                            )}
                                        >
                                            <div className={clsx(
                                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5",
                                                (n.type === 'alert' || n.type === 'error') && "bg-[#FAF3F2] text-[#A84B4B] dark:bg-[#3D2525] dark:text-[#E58B8B]",
                                                (n.type === 'warning' || n.type === 'idle') && "bg-[#FAF0E1] text-[#C98A3C] dark:bg-[#332717] dark:text-[#E5B56D]",
                                                n.type === 'success' && "bg-[#F4F7F4] text-[#5E7D64] dark:bg-[#1E2B20] dark:text-[#8BB394]",
                                                (n.type === 'info' || !n.type) && "bg-[#F8F2E4] text-[#B9955B] dark:bg-[#2C2417] dark:text-[#D3B98D]"
                                            )}>
                                                {(n.type === 'alert' || n.type === 'error') && <AlertCircle size={16} />}
                                                {(n.type === 'warning' || n.type === 'idle') && <AlertTriangle size={16} />}
                                                {n.type === 'success' && <CheckCircle2 size={16} />}
                                                {(n.type === 'info' || !n.type) && <Info size={16} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <p className={clsx("text-xs transition-colors", n.unread ? "font-bold text-[#29291F] dark:text-[#F5F1E9]" : "text-[#777367] dark:text-[#B8B3A7]")}>
                                                        {n.title}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-[#B9955B]"></span>}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(n.id);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#E5DED2] dark:hover:bg-[#384232] rounded-md text-[#777367] transition-all"
                                                            title="Delete notification"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {n.description ? (
                                                    <p className="text-[11px] text-[#777367] dark:text-[#B8B3A7] line-clamp-2 mt-0.5">{n.description}</p>
                                                ) : null}
                                                <p className="mt-1 text-[9px] font-bold text-[#9E988A] uppercase tracking-wider">{n.time || 'Just now'}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center text-xs text-[#777367]">
                                        No new notifications
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-[#E5DED2] dark:border-[#384232] p-2.5 text-center bg-[#EEE8DD]/50 dark:bg-[#1E2419]">
                                <button
                                    onClick={() => {
                                        setShowNotifications(false);
                                        navigate(resolveRolePath('/notifications'));
                                    }}
                                    className="text-xs font-semibold text-[#B9955B] hover:text-[#A17D45] transition-colors w-full py-0.5 block"
                                >
                                    View All Notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-5 w-px bg-[#E5DED2] dark:bg-[#384232] mx-1"></div>

                <ProfileDropdown />
            </div>
        </header>
    );
}
