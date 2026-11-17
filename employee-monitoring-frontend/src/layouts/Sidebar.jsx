import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Clock,
    Activity,
    CheckSquare,
    BarChart3,
    CreditCard,
    Users,
    Settings,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Monitor,
    Zap,
    X,
    Layers
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuthStore } from '../store/authStore';

const cn = (...inputs) => twMerge(clsx(inputs));

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', key: 'dashboard' },
    { name: 'Monitoring Agents', icon: Monitor, path: '/agents', key: 'agents' },
    { name: 'Real-time Insights', icon: Zap, path: '/real-time', key: 'realtime' },
    { name: 'Employees', icon: Users, path: '/employees', key: 'employees' },
    { name: 'Teams', icon: Users, path: '/teams', key: 'teams' },
    { name: 'Screenshots', icon: Monitor, path: '/screenshots', key: 'screenshots' },
    { name: 'Time & Attendance', icon: Clock, path: '/time-attendance', key: 'timeAttendance' },
    { name: 'Activities', icon: Activity, path: '/activities', key: 'activity' },
    { name: 'Projects', icon: CheckSquare, path: '/projects', key: 'projects' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks', key: 'tasks' },
    { name: 'Payroll', icon: CreditCard, path: '/payroll', key: 'payroll' },
    { name: 'Compliance', icon: ShieldCheck, path: '/compliance', key: 'compliance' },
    { name: 'Settings', icon: Settings, path: '/settings', key: 'settings' },
];

const reportSubItems = [
    { name: 'Work Type', path: '/reports/work-type' },
    { name: 'Schedule Adherence', path: '/reports/schedule-adherence' },
    { name: 'Workload Distribution', path: '/reports/workload-distribution' },
    { name: 'Apps & Websites', path: '/reports/apps-websites' },
    { name: 'Office vs Remote', path: '/reports/location-insights' },
    { name: 'Process Mining', path: '/reports/process-mining' },
];

export function Sidebar({ collapsed, setCollapsed, onMobileClose }) {
    const [reportsOpen, setReportsOpen] = React.useState(false);
    const { hasAccess, role } = useAuthStore();

    const rolePath = role ? `/${role.toLowerCase()}` : '';

    // Filter nav items based on RBAC and inject role path
    const allowedNavItems = navItems
        .filter(item => hasAccess(item.key))
        .map(item => ({
            ...item,
            path: `${rolePath}${item.path === '/' ? '' : item.path}`
        }));

    const allowedReportSubItems = reportSubItems.map(item => ({
        ...item,
        path: `${rolePath}${item.path}`
    }));

    React.useEffect(() => {
        if (window.location.pathname.includes('/reports')) {
            setReportsOpen(true);
        }
    }, []);

    return (
        <aside
            className={cn(
                "h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-all duration-300 ease-in-out relative flex flex-col",
                "w-[80vw] max-w-[280px] lg:max-w-none shadow-xl lg:shadow-none",
                collapsed ? "lg:w-20" : "lg:w-64"
            )}
        >
            {/* Header Brand Section */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 min-h-[72px]">
                {!collapsed ? (
                    <div className="flex items-center gap-3 animate-in fade-in duration-300">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                            <Layers size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                                Employee Performance
                            </span>
                            <span className="text-[10px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase leading-tight mt-0.5">
                                Software
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto flex items-center justify-center">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                            <span className="text-sm font-black">EPS</span>
                        </div>
                    </div>
                )}

                <button
                    onClick={onMobileClose}
                    className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    aria-label="Close menu"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Navigation List */}
            <nav className="flex-1 mt-4 flex flex-col gap-1 px-3 overflow-y-auto scrollbar-thin pb-8">
                {allowedNavItems.map((item) => {
                    const isReportsAllowed = hasAccess('reports');
                    const isLastItemInGroup = item.key === 'tasks';

                    return (
                        <React.Fragment key={item.key}>
                            <NavLink
                                to={item.path}
                                onClick={onMobileClose}
                                className={({ isActive }) => cn(
                                    "group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-200",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 shadow-xs font-bold"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                                    collapsed && "justify-center px-0"
                                )}
                                title={collapsed ? item.name : ""}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon
                                            size={19}
                                            className={cn(
                                                "shrink-0 transition-transform duration-200 group-hover:scale-105",
                                                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                                            )}
                                        />
                                        {!collapsed && (
                                            <span className="tracking-tight">{item.name}</span>
                                        )}
                                        {isActive && !collapsed && (
                                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                                        )}
                                    </>
                                )}
                            </NavLink>

                            {/* Reports Collapsible Accordion */}
                            {isLastItemInGroup && isReportsAllowed && (
                                <div className="space-y-1 my-0.5">
                                    <button
                                        onClick={() => {
                                            if (collapsed) setCollapsed(false);
                                            setReportsOpen(!reportsOpen);
                                        }}
                                        className={cn(
                                            "group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-200",
                                            window.location.pathname.includes('/reports')
                                                ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold"
                                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                                            collapsed && "justify-center px-0"
                                        )}
                                        title={collapsed ? "Reports" : ""}
                                    >
                                        <BarChart3
                                            size={19}
                                            className="shrink-0 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:scale-105"
                                        />
                                        {!collapsed && <span className="tracking-tight">Reports</span>}
                                        {!collapsed && (
                                            <ChevronRight
                                                size={15}
                                                className={cn(
                                                    "ml-auto text-slate-400 transition-transform duration-200",
                                                    reportsOpen && "rotate-90 text-indigo-600 dark:text-indigo-400"
                                                )}
                                            />
                                        )}
                                    </button>

                                    {reportsOpen && !collapsed && (
                                        <div className="ml-5 flex flex-col gap-1 border-l-2 border-slate-100 dark:border-slate-800 pl-3 py-1 my-1 animate-in slide-in-from-left-2 duration-200">
                                            {allowedReportSubItems.map((subItem) => (
                                                <NavLink
                                                    key={subItem.path}
                                                    to={subItem.path}
                                                    onClick={onMobileClose}
                                                    className={({ isActive }) => cn(
                                                        "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150",
                                                        isActive
                                                            ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 font-bold"
                                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60"
                                                    )}
                                                >
                                                    {subItem.name}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </nav>

            {/* Collapse/Expand Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-md transition-all hover:scale-110 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white z-50 cursor-pointer"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
        </aside>
    );
}
