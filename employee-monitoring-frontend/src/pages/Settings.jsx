import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
    Bell,
    Key,
    ClipboardList,
    CreditCard,
    Mail,
    Puzzle,
    Clock,
    Building,
    Shield,
    LineChart,
    PieChart,
    Users,
    UserCircle,
    Calculator,
    Laptop,
    Search,
    ChevronRight,
    Sparkles
} from 'lucide-react';

const CATEGORIES = [
    'All',
    'Productivity & Tracking',
    'Administration',
    'Security & Governance',
    'Reports & Analytics',
    'Integrations & API'
];

const SettingCard = ({ icon: Icon, title, description, badge, iconBg, onClick }) => (
    <div
        onClick={onClick}
        className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer min-w-0"
    >
        <div className="flex items-start gap-3.5">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${iconBg || 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                <Icon size={20} strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                        {title}
                    </h3>
                    {badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 shrink-0">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 mt-1">
                    {description}
                </p>
            </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            <span>Configure settings</span>
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
    </div>
);

export function Settings() {
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const rolePath = role ? `/${role.toLowerCase()}` : '/admin';

    const settingItemsData = [
        {
            icon: LineChart,
            title: "Productivity",
            description: "Manage your productivity labels on an organization, team and individual level.",
            path: "/settings/productivity/apps",
            category: "Productivity & Tracking",
            badge: "Core",
            iconBg: "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border-primary-200/80 dark:border-primary-800/80"
        },
        {
            icon: Laptop,
            title: "Tracking Settings",
            description: "View and configure Insightful Agent settings, screenshots and tracking scenarios.",
            path: "/settings/tracking",
            category: "Productivity & Tracking",
            badge: "Agent",
            iconBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/80"
        },
        {
            icon: Users,
            title: "User Management",
            description: "View, invite and manage user roles, permissions and team assignees in your company.",
            path: "/settings/user-management/users",
            category: "Administration",
            iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/80"
        },
        {
            icon: Building,
            title: "Organization",
            description: "View and update basic info about your company, industry, and organizational branding.",
            path: "/settings/organization",
            category: "Administration",
            iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/80"
        },
        {
            icon: UserCircle,
            title: "Personal Settings",
            description: "Manage your personal information, profile avatar, credentials and localization preferences.",
            path: "/settings/personal",
            category: "Administration",
            iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-800/80"
        },
        {
            icon: Bell,
            title: "Alerts & Notifications",
            description: "Configure automated triggers related to attendance, idle time, and shift scheduling.",
            path: "/settings/alerts",
            category: "Productivity & Tracking",
            iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/80"
        },
        {
            icon: Shield,
            title: "Privacy & Compliance",
            description: "Manage employee consent, screen blurring levels, PHI protection and retention policies.",
            path: "/settings/privacy",
            category: "Security & Governance",
            badge: "GDPR",
            iconBg: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200/80 dark:border-teal-800/80"
        },
        {
            icon: Key,
            title: "Security & Identity",
            description: "Configure enterprise SSO authentication, SAML 2.0 integration and 2FA credentials.",
            path: "/settings/security",
            category: "Security & Governance",
            iconBg: "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border-primary-200/80 dark:border-primary-800/80"
        },
        {
            icon: Clock,
            title: "Manual Time",
            description: "Manage manual time entry permissions, approval workflows, and activity type definitions.",
            path: "/settings/manual-time",
            category: "Productivity & Tracking",
            iconBg: "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 border-yellow-200/80 dark:border-yellow-800/80"
        },
        {
            icon: ClipboardList,
            title: "Audit Logs",
            description: "View and inspect immutable administrative actions and authentication access events.",
            path: "/settings/audit-logs",
            category: "Security & Governance",
            iconBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
        },
        {
            icon: PieChart,
            title: "Workload Distribution",
            description: "Configure optimal employee workload bands, burnout thresholds, and capacity rules.",
            path: "/settings/reports/workload-distribution",
            category: "Reports & Analytics",
            iconBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/80"
        },
        {
            icon: Building,
            title: "Location Insights",
            description: "Manage office geofences, work zones, coordinates, and on-site attendance thresholds.",
            path: "/settings/reports/location-insights",
            category: "Reports & Analytics",
            iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/80"
        },
        {
            icon: Puzzle,
            title: "Integrations",
            description: "Connect with Jira, Slack, GitHub, Asana, Google Workspace and enterprise identity apps.",
            path: "/settings/integrations",
            category: "Integrations & API",
            iconBg: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200/80 dark:border-orange-800/80"
        },
        {
            icon: CreditCard,
            title: "Billing & Subscriptions",
            description: "Manage your company plans, seat licenses, payment methods, and invoices.",
            path: "/settings/billing",
            category: "Administration",
            iconBg: "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border-green-200/80 dark:border-green-800/80"
        },
        {
            icon: Key,
            title: "API Tokens",
            description: "Create and revoke secure access tokens for custom developer webhooks and data pipelines.",
            path: "/settings/api-tokens",
            category: "Integrations & API",
            iconBg: "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border-primary-200/80 dark:border-primary-800/80"
        },
        {
            icon: Mail,
            title: "Email Reports",
            description: "Configure automated scheduled summaries, digest delivery and executive distribution lists.",
            path: "/settings/email-reports",
            category: "Reports & Analytics",
            iconBg: "bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-200/80 dark:border-pink-800/80"
        },
        {
            icon: Calculator,
            title: "Utilization",
            description: "Manage organizational capacity calculations, effective work ratios and targets.",
            path: "/settings/utilization",
            category: "Reports & Analytics",
            iconBg: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200/80 dark:border-cyan-800/80"
        }
    ];

    const settingItems = useMemo(() => {
        return settingItemsData.map(item => ({
            ...item,
            fullPath: `${rolePath}${item.path}`
        }));
    }, [rolePath]);

    const filteredItems = useMemo(() => {
        return settingItems.filter(item => {
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            const matchesSearch = !searchQuery.trim() ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [settingItems, selectedCategory, searchQuery]);

    return (
        <div className="w-full space-y-6 animate-fade-in pb-16">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Configure organizational policies, productivity labels, compliance rules and tracking settings.
                    </p>
                </div>

                <div className="relative group w-full md:w-72">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search settings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            selectedCategory === category
                                ? 'bg-[#30382B] text-[#FDFBF7] dark:bg-[#B9955B] dark:text-white shadow-warm-xs'
                                : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/50'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Settings Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {filteredItems.length > 0 ? (
                    filteredItems.map((item, idx) => (
                        <SettingCard
                            key={idx}
                            {...item}
                            onClick={() => item.fullPath && navigate(item.fullPath)}
                        />
                    ))
                ) : (
                    <div className="col-span-full py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <p className="text-sm font-semibold text-slate-500">No settings found matching &ldquo;{searchQuery}&rdquo;</p>
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                            className="mt-3 text-xs font-bold text-primary-600 hover:underline"
                        >
                            Reset filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Settings;
