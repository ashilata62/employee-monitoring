import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Activity, Globe, Monitor } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function InsightfulModuleSwitcher({ activeTab = 'trends' }) {
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const rolePrefix = `/${(role || 'manager').toLowerCase()}`;

    const tabs = [
        {
            id: 'trends',
            label: 'Productivity Trends',
            icon: Zap,
            color: 'text-[#B9955B]',
            path: rolePrefix
        },
        {
            id: 'activities',
            label: 'Activities Timeline',
            icon: Activity,
            color: 'text-[#B9955B]',
            path: `${rolePrefix}/activities`
        },
        ...(role !== 'EMPLOYEE' ? [
            {
                id: 'location',
                label: 'Office vs Remote',
                icon: Globe,
                color: 'text-[#5E7D64]',
                path: `${rolePrefix}/reports/location-insights`
            },
            {
                id: 'apps',
                label: 'Apps & Websites Usage',
                icon: Monitor,
                color: 'text-[#30382B] dark:text-[#D3B98D]',
                path: `${rolePrefix}/reports/apps-websites`
            }
        ] : [])
    ];

    return (
        <div className="flex items-center gap-2.5 mb-6 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.path)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-all shadow-warm-xs cursor-pointer ${
                            isActive
                                ? 'font-semibold bg-[#30382B] text-[#FDFBF7]'
                                : 'font-medium bg-[#EEE8DD] dark:bg-[#252B20] text-[#29291F] dark:text-[#F5F1E9] border border-[#D6CDBC] dark:border-[#384232] hover:bg-[#E5DDCF]'
                        }`}
                    >
                        <Icon size={14} className={isActive ? 'text-[#D3B98D]' : tab.color} />
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export default InsightfulModuleSwitcher;
