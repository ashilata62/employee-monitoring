import React from 'react';
import { 
    X, 
    Briefcase, 
    Users, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    DollarSign,
    Target
} from 'lucide-react';
import { cn } from '../utils/cn';

export function ProjectDetailModal({ isOpen, onClose, project }) {
    if (!isOpen || !project) return null;

    const taskStatusColors = {
        'BACKLOG': 'text-[#8C8270] dark:text-[#9E9789] bg-[#EEE8DD]/70 dark:bg-[#1E2419] border-[#D6CDBC] dark:border-[#384232]',
        'IN_OPERATIONS': 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
        'QUALITY_ASSURANCE': 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
        'FINALIZED': 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
        'DONE': 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
        'COMPLETED': 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
        'TODO': 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
        'IN_PROGRESS': 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
        'IN_REVIEW': 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
        'CANCELLED': 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md transition-opacity duration-300" 
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-3xl bg-[#FBF9F5] dark:bg-[#252B20] text-[#29291F] dark:text-[#F5F1E9] rounded-2xl shadow-warm-xl overflow-hidden border border-[#D6CDBC] dark:border-[#384232] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-[#D6CDBC] dark:border-[#384232] flex items-center justify-between bg-[#F5F1E9]/70 dark:bg-[#1E2419]/80 sticky top-0 z-10 backdrop-blur-xs">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#30382B] text-[#D3B98D] border border-[#384232] flex items-center justify-center text-sm font-black shadow-xs">
                            {(project.projectName || project.name || 'PR').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-black text-[#29291F] dark:text-[#F5F1E9] leading-tight font-serif">
                                {project.projectName || project.name}
                            </h2>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#8C8270] dark:text-[#9E9789] uppercase tracking-wider">
                                    {project.tasks || (project.tasksData?.length) || 0} Tasks
                                </span>
                                <span className="h-1 w-1 rounded-full bg-[#D6CDBC] dark:bg-[#384232]" />
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#8C8270] dark:text-[#9E9789] uppercase tracking-wider">
                                    {project.assignees || 0} Assignees
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-[#EEE8DD] dark:hover:bg-[#30382B] rounded-lg text-[#8C8270] dark:text-[#9E9789] hover:text-[#29291F] dark:hover:text-white transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 overflow-y-auto scrollbar-thin flex-1">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-[#EEE8DD]/50 dark:bg-[#1E2419] p-4 rounded-xl border border-[#D6CDBC] dark:border-[#384232]">
                            <span className="text-[9px] font-black text-[#8C8270] dark:text-[#9E9789] uppercase tracking-widest block mb-1">Budget</span>
                            <div className="flex items-end gap-1">
                                <span className="text-xl font-black text-[#29291F] dark:text-[#F5F1E9]">${project.totalCosts || 0}</span>
                                <span className="text-[10px] font-bold text-[#8C8270] dark:text-[#9E9789] mb-0.5">Total</span>
                            </div>
                        </div>
                        <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
                            <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest block mb-1">Bill Rate</span>
                            <div className="flex items-end gap-1">
                                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">${project.billRate || 0}</span>
                                <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 mb-0.5">/ hour</span>
                            </div>
                        </div>
                        <div className="bg-[#EEE8DD]/50 dark:bg-[#1E2419] p-4 rounded-xl border border-[#D6CDBC] dark:border-[#384232]">
                            <span className="text-[9px] font-black text-[#B9955B] dark:text-[#D3B98D] uppercase tracking-widest block mb-1">Description</span>
                            <p className="text-[11px] font-bold text-[#6B6355] dark:text-[#C5BEB0] line-clamp-2 leading-relaxed">
                                {project.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    {/* Content Tabs Header */}
                    <div className="flex items-center gap-8 mb-6 border-b border-[#D6CDBC] dark:border-[#384232]">
                        <button className="pb-4 text-[10px] font-black text-[#B9955B] dark:text-[#D3B98D] uppercase tracking-widest relative">
                            Project Tasks
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B9955B] dark:bg-[#D3B98D]" />
                        </button>
                    </div>

                    {/* Tasks Table */}
                    <div className="space-y-4">
                        {(project.tasksData || []).length > 0 ? (
                            <div className="border border-[#D6CDBC] dark:border-[#384232] rounded-2xl overflow-hidden bg-white/40 dark:bg-[#1E2419]/40">
                                <table className="w-full text-left">
                                    <thead className="bg-[#EEE8DD]/60 dark:bg-[#1E2419] border-b border-[#D6CDBC] dark:border-[#384232]">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-[#8C8270] dark:text-[#9E9789] uppercase tracking-widest">Task Name</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[#8C8270] dark:text-[#9E9789] uppercase tracking-widest">Assignee</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[#8C8270] dark:text-[#9E9789] uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[#8C8270] dark:text-[#9E9789] uppercase tracking-widest">Priority</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[#8C8270] dark:text-[#9E9789] uppercase tracking-widest">Est. Hours</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-[#8C8270] dark:text-[#9E9789] uppercase tracking-widest">Actual Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5DED2] dark:divide-[#384232]">
                                        {(project.tasksData || []).map((task, idx) => (
                                            <tr key={idx} className="hover:bg-[#EEE8DD]/30 dark:hover:bg-[#30382B]/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-[13px] font-bold text-[#29291F] dark:text-[#F5F1E9]">{task.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {task.employee ? (
                                                            <>
                                                                <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-black text-white overflow-hidden shadow-xs">
                                                                    {task.employee.avatar ? (
                                                                        <img src={task.employee.avatar} alt="" className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        task.employee.fullName?.substring(0, 2).toUpperCase()
                                                                    )}
                                                                </div>
                                                                <span className="text-[12px] font-bold text-[#575043] dark:text-[#C5BEB0]">{task.employee.fullName}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-[11px] font-bold text-[#9E9789] italic">Unassigned</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={cn(
                                                        "inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border shadow-2xs",
                                                        taskStatusColors[task.status] || 'text-[#8C8270] dark:text-[#9E9789] bg-[#EEE8DD]/70 dark:bg-[#1E2419] border-[#D6CDBC] dark:border-[#384232]'
                                                    )}>
                                                        {task.status ? task.status.replace(/_/g, ' ') : 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest",
                                                        task.priority === 'HIGH' ? 'text-rose-600 dark:text-rose-400' : 
                                                        task.priority === 'MEDIUM' ? 'text-[#B9955B] dark:text-[#D3B98D]' : 'text-blue-600 dark:text-blue-400'
                                                    )}>
                                                        {task.priority || 'NORMAL'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-[12px] font-bold text-[#575043] dark:text-[#C5BEB0]">
                                                        {task.estimatedHours ? `${task.estimatedHours}h` : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-[12px] font-bold text-[#575043] dark:text-[#C5BEB0]">
                                                        {task.actualHours ? `${task.actualHours}h` : (task.timeSpent || '-')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-12 text-center bg-[#EEE8DD]/30 dark:bg-[#1E2419]/40 rounded-3xl border border-dashed border-[#D6CDBC] dark:border-[#384232]">
                                <AlertCircle className="mx-auto text-[#8C8270] dark:text-[#9E9789] mb-2" size={32} />
                                <h4 className="text-sm font-black text-[#8C8270] dark:text-[#9E9789] uppercase tracking-widest">No tasks found</h4>
                                <p className="text-[11px] font-bold text-[#9E9789] dark:text-[#6B6355] mt-1">There are no tasks associated with this project yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#F5F1E9]/70 dark:bg-[#1E2419]/80 border-t border-[#D6CDBC] dark:border-[#384232] flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-8 py-2.5 bg-[#EEE8DD] hover:bg-[#E5DED2] dark:bg-[#30382B] dark:hover:bg-[#384232] border border-[#D6CDBC] dark:border-[#384232] text-[#29291F] dark:text-[#F5F1E9] rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
