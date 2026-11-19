import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
    ClipboardList,
    Building,
    LineChart,
    UserCircle,
    Search,
    ChevronRight
} from 'lucide-react';

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

    const rolePath = role ? `/${role.toLowerCase()}` : '/admin';

    const settingItemsData = [
        {
            icon: LineChart,
            title: "Productivity",
            description: "Manage your productivity labels on an organization, team and individual level.",
            path: "/settings/productivity/apps",
            badge: "Core",
            iconBg: "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border-primary-200/80 dark:border-primary-800/80"
        },
        {
            icon: Building,
            title: "Organization",
            description: "View and update basic info about your company, industry, and organizational branding.",
            path: "/settings/organization",
            iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/80"
        },
        {
            icon: UserCircle,
            title: "Personal Settings",
            description: "Manage your personal information, profile avatar, credentials and localization preferences.",
            path: "/settings/personal",
            iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-800/80"
        },
        {
            icon: ClipboardList,
            title: "Audit Logs",
            description: "View and inspect immutable administrative actions and authentication access events.",
            path: "/settings/audit-logs",
            iconBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
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
            const matchesSearch = !searchQuery.trim() ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [settingItems, searchQuery]);

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
                            onClick={() => setSearchQuery('')}
                            className="mt-3 text-xs font-bold text-primary-600 hover:underline"
                        >
                            Reset search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Settings;
