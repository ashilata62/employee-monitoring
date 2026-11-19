import React from 'react';
import { Monitor } from 'lucide-react';
import { TagBadge } from './TagBadge';
import { cn } from '../../utils/cn';

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24">
            <div className="h-24 w-24 mb-6 text-slate-200 dark:text-slate-700">
                <svg viewBox="0 0 96 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="88" height="56" rx="6" stroke="currentColor" strokeWidth="3" fill="none"/>
                    <path d="M36 68h24M48 60v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <circle cx="32" cy="28" r="5" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                    <circle cx="64" cy="28" r="5" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                    <path d="M38 42 Q48 35 58 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Results Found</h3>
            <p className="text-sm font-medium text-slate-400">
                We can't find any item matching your <span className="text-primary-600 font-bold">search</span>.
            </p>
        </div>
    );
}

export function AppsTable({ apps, tags, onSelectAll, onSelectApp, onChangeTag, thresholdEnabled, thresholdHours }) {
    const allSelected = apps.length > 0 && apps.every((a) => a.selected);
    const someSelected = apps.some((a) => a.selected);

    const getTag = (tagId) => tags.find((t) => t.id === tagId) ?? null;

    if (apps.length === 0) return <EmptyState />;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-4 w-10">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                onChange={(e) => onSelectAll(e.target.checked)}
                                className="w-4 h-4 rounded accent-primary-600 cursor-pointer"
                            />
                        </th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                            App / Website
                        </th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                            <span className="flex items-center gap-1">
                                Total Usage [h]
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                            </span>
                        </th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                            Category
                        </th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                            Productivity
                        </th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-primary-600 bg-slate-50/50 dark:bg-slate-900/50">
                            Label
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {apps.map((app) => {
                        const tag = getTag(app.tagId);
                        const isLow = thresholdEnabled && app.totalUsage < thresholdHours;
                        return (
                            <tr
                                key={app.id || app.appName}
                                className={cn(
                                    'group hover:bg-primary-50/30 dark:hover:bg-primary-950/30 transition-all duration-200',
                                    app.selected && 'bg-primary-50/50 dark:bg-primary-950/40'
                                )}
                            >
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={app.selected}
                                        onChange={() => onSelectApp(app.id || app.appName)}
                                        className="w-4 h-4 rounded accent-primary-600 cursor-pointer"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                                            <Monitor size={14} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-slate-900 dark:text-white">{app.appName || app.name}</p>
                                                {app.isTeamSpecific ? (
                                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800/40">
                                                        Dept Override
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                                                        Global
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-400">{app.domain}</p>
                                        </div>
                                        {isLow && (
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
                                                Low usage
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                        {app.totalUsage.toFixed(1)} h
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{app.category}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        'text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg',
                                        app.productivity === 'PRODUCTIVE' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30',
                                        app.productivity === 'UNPRODUCTIVE' && 'bg-rose-50 text-rose-600 dark:bg-rose-900/30',
                                        app.productivity !== 'PRODUCTIVE' && app.productivity !== 'UNPRODUCTIVE' && 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                    )}>
                                        {app.productivity === 'PRODUCTIVE' ? 'Productive' : app.productivity === 'UNPRODUCTIVE' ? 'Unproductive' : 'Neutral'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <TagBadge
                                        tag={tag}
                                        onClick={() => onChangeTag(app.id || app.appName)}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
