import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Activity, Globe, Monitor } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function InsightfulModuleSwitcher({ activeTab = 'trends' }) {
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const rolePrefix = role === 'EMPLOYEE' ? '/employee' : '/admin';

    const tabs = [
        {
            id: 'trends',
            label: 'Productivity Trends',
            icon: Zap,
            color: 'text-amber-500',
            path: rolePrefix
        },
        {
            id: 'activities',
            label: 'Activities Timeline',
            icon: Activity,
            color: 'text-purple-500',
            path: `${rolePrefix}/activities`
        },
        ...(role !== 'EMPLOYEE' ? [
            {
                id: 'location',
                label: 'Office vs Remote',
                icon: Globe,
                color: 'text-sky-500',
                path: `${rolePrefix}/reports/location-insights`
            },
            {
                id: 'apps',
                label: 'Apps & Websites Usage',
                icon: Monitor,
                color: 'text-emerald-500',
                path: `${rolePrefix}/reports/apps-websites`
            }
        ] : [])
    ];

    return (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.path)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-all shadow-sm ${
                            isActive
                                ? 'font-black bg-primary-600 text-white shadow-primary-500/20'
                                : 'font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                        }`}
                    >
                        <Icon size={14} className={isActive ? 'text-white' : tab.color} />
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export default InsightfulModuleSwitcher;