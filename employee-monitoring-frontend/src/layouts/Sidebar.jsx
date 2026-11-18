import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Clock,
    CalendarCheck,
    Activity,
    MapPin,
    CheckSquare,
    BarChart3,
    CreditCard,
    Bell,
    Users,
    Settings,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Monitor,
    Zap,
    X,
    Sparkles
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
                "h-full border-r border-[#3C4536] bg-[#30382B] text-[#F5F1E9] transition-all duration-300 ease-in-out relative flex flex-col",
                "w-[80vw] max-w-[280px] md:max-w-none shadow-2xl md:shadow-none",
                collapsed ? "md:w-20" : "md:w-60"
            )}
        >
            {/* Header Brand Section */}
            <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-[#3C4536]/80 min-h-[76px]">
                {!collapsed ? (
                    <div className="flex items-center gap-3 animate-in fade-in duration-300">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#B9955B] to-[#8C6D38] flex items-center justify-center text-white shadow-md shadow-black/20 shrink-0">
                            <Sparkles size={18} className="text-[#FDFBF7]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-serif text-[18px] font-semibold text-[#FBF9F5] tracking-tight leading-tight">
                                Employee
                            </span>
                            <span className="text-[9px] font-bold tracking-[0.22em] text-[#D3B98D] uppercase leading-tight mt-0.5">
                                Monitoring Center
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto flex items-center justify-center">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#B9955B] to-[#8C6D38] flex items-center justify-center text-white shadow-md shadow-black/20">
                            <span className="font-serif text-lg font-bold text-[#FDFBF7]">P</span>
                        </div>
                    </div>
                )}

                <button
                    onClick={onMobileClose}
                    className="md:hidden p-2 text-[#C5CEBF] hover:text-white hover:bg-[#3C4536] rounded-lg transition-colors"
                    aria-label="Close menu"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Navigation List */}
            <nav className="flex-1 mt-4 flex flex-col gap-1.5 px-3 overflow-y-auto scrollbar-thin pb-8">
                {allowedNavItems.map((item) => {
                    const isReportsAllowed = hasAccess('reports');
                    const isLastItemInGroup = item.key === 'tasks';

                    return (
                        <React.Fragment key={item.key}>
                            <NavLink
                                to={item.path}
                                onClick={onMobileClose}
                                className={({ isActive }) => cn(
                                    "group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-[#B9955B] text-white shadow-sm shadow-black/15 font-semibold"
                                        : "text-[#D2DACB] hover:bg-[#3C4536] hover:text-[#FFFFFF]",
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
                                                isActive ? "text-white" : "text-[#B9C6B1] group-hover:text-white"
                                            )}
                                        />
                                        {!collapsed && (
                                            <span className="tracking-tight">{item.name}</span>
                                        )}
                                        {isActive && !collapsed && (
                                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/90 shadow-xs" />
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
                                            "group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200",
                                            window.location.pathname.includes('/reports')
                                                ? "bg-[#3C4536] text-[#D3B98D] font-semibold"
                                                : "text-[#D2DACB] hover:bg-[#3C4536] hover:text-[#FFFFFF]",
                                            collapsed && "justify-center px-0"
                                        )}
                                        title={collapsed ? "Reports" : ""}
                                    >
                                        <BarChart3
                                            size={19}
                                            className="shrink-0 text-[#B9C6B1] group-hover:text-white transition-transform group-hover:scale-105"
                                        />
                                        {!collapsed && <span className="tracking-tight">Reports</span>}
                                        {!collapsed && (
                                            <ChevronRight
                                                size={15}
                                                className={cn(
                                                    "ml-auto text-[#B9C6B1] transition-transform duration-200",
                                                    reportsOpen && "rotate-90 text-[#D3B98D]"
                                                )}
                                            />
                                        )}
                                    </button>

                                    {reportsOpen && !collapsed && (
                                        <div className="ml-5 flex flex-col gap-1 border-l border-[#3C4536] pl-3 py-1 my-1 animate-in slide-in-from-left-2 duration-200">
                                            {allowedReportSubItems.map((subItem) => (
                                                <NavLink
                                                    key={subItem.path}
                                                    to={subItem.path}
                                                    onClick={onMobileClose}
                                                    className={({ isActive }) => cn(
                                                        "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                                                        isActive
                                                            ? "text-[#D3B98D] bg-[#3C4536]/80 font-semibold"
                                                            : "text-[#B9C6B1] hover:text-white hover:bg-[#3C4536]/50"
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

            {/* Collapse/Expand Toggle Pill Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-[#3C4536] bg-[#30382B] text-[#D3B98D] shadow-lg transition-all hover:scale-110 hover:bg-[#B9955B] hover:text-white hover:border-[#B9955B] z-50 cursor-pointer"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
        </aside>
    );
}
