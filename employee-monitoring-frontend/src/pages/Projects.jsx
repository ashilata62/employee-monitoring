import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Calendar,
    Search,
    Info,
    Plus,
    LayoutGrid,
    Download,
    Edit3,
    Trash2,
    Eye
} from 'lucide-react';
import { NewProjectModal } from '../components/NewProjectModal';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import { FilterDropdown } from '../components/FilterDropdown';
import { GlobalCalendar } from '../components/GlobalCalendar';
import { useRealTime } from '../hooks/RealTimeContext';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { cn } from '../utils/cn';

export function Projects() {
    const navigate = useNavigate();
    const { employees, teams } = useRealTime();
    const { projects, fetchProjects, loading, deleteProject } = useProjectStore();
    const { role } = useAuthStore();
    const [editingProject, setEditingProject] = useState(null);
    const [viewingProject, setViewingProject] = useState(null);
    const rolePath = role ? `/${role.toLowerCase()}` : '';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');
    const [isGridView, setIsGridView] = useState(false);

    useEffect(() => {
        fetchProjects();

        const interval = setInterval(() => {
            fetchProjects();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchProjects]);

    const handleDownload = () => {
        const rows = [
            ['Project Name', 'Assignees', 'Tasks', 'Bill Rate', 'Total Costs'],
            ...projects.map(p => [
                p.projectName, p.assignees, p.tasks, `$${p.billRate}`, `$${p.totalCosts}`
            ])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'projects.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const tableHeaders = [
        'Project Name', 'Assignees', 'Tasks', 'Bill Rate', 'Total Costs'
    ];

    return (
        <div className="w-full space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="font-serif text-3xl font-normal text-[#29291F] dark:text-[#F5F1E9] tracking-tight">Projects</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {(role === 'ADMIN' || role === 'MANAGER') && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] px-6 py-2.5 rounded-xl text-xs font-semibold shadow-warm-sm transition-all uppercase tracking-wider active:scale-95 cursor-pointer"
                        >
                            <Plus size={15} className="text-[#D3B98D]" />
                            <span>Add New Project</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="relative group w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400 group-focus-within:text-primary-500 transition-colors" strokeWidth={2.5} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search projects by name..."
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl pl-12 pr-4 text-[13px] font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
                    />
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                    {role !== 'EMPLOYEE' && (
                        <button
                            onClick={handleDownload}
                            title="Download CSV report"
                            className="h-12 px-5 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all rounded-2xl shadow-sm group hover:scale-[1.02] active:scale-95"
                        >
                            <Download size={18} strokeWidth={2.5} className="group-hover:translate-y-0.5 transition-transform" />
                            <span className="text-[11px] font-black uppercase tracking-wider">Export Report</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                    {/* Table Layout (Hidden on Mobile) */}
                    <div className="hidden lg:block">
                        <div className="grid grid-cols-12 px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center border-b border-slate-100 dark:border-slate-800">
                            <div className="text-left col-span-4">Project Name</div>
                            <div className="col-span-2">Assignees</div>
                            <div className="col-span-2">Tasks</div>
                            {role !== 'EMPLOYEE' ? (
                                <>
                                    <div className="col-span-1">Rate</div>
                                    <div className="col-span-1">Costs</div>
                                    <div className="col-span-2 text-center">Actions</div>
                                </>
                            ) : (
                                <div className="col-span-4 text-center">Status</div>
                            )}
                        </div>
                    </div>

                    {/* Product Rows / Mobile Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6 lg:gap-0 lg:space-y-3">
                        {(() => {
                            if (loading) return <div className="text-center py-20 font-bold text-slate-400 animate-pulse">Fetching project data...</div>;

                                const filtered = projects.filter(p => (p.projectName || p.name || '').toLowerCase().includes(projectSearch.toLowerCase()));
                                if (filtered.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
                                            <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                                                <Search size={32} className="text-slate-200 dark:text-slate-800" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-300 dark:text-slate-800 select-none">
                                                {role === 'EMPLOYEE' && !projectSearch
                                                    ? 'No Projects Assigned'
                                                    : 'No Projects Found'}
                                            </h3>
                                            <p className="text-xs font-bold text-slate-400 mt-2">
                                                {role === 'EMPLOYEE' && !projectSearch
                                                    ? 'No projects assigned to you yet. Contact your manager.'
                                                    : 'Try adjusting your search or filters'}
                                            </p>
                                        </div>
                                    );
                                }
                                return filtered.map((project, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setViewingProject(project)}
                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] lg:rounded-2xl p-5 md:p-6 lg:p-4 hover:shadow-xl hover:border-primary-100 dark:hover:border-primary-900/30 transition-all group lg:grid lg:grid-cols-12 lg:items-center cursor-pointer"
                                    >
                                        {/* Desktop-only hidden / Mobile visible labels */}
                                        <div className="lg:col-span-4 flex items-center gap-4 mb-4 lg:mb-0">
                                            <div className="h-12 w-12 lg:h-9 lg:lg:w-9 rounded-2xl lg:rounded-xl bg-primary-600 flex items-center justify-center text-xs lg:text-[10px] font-black text-white shadow-lg shadow-primary-200 dark:shadow-none transition-transform group-hover:scale-105">
                                                {(project.projectName || project.name || 'PR').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col lg:flex-row lg:items-center gap-0.5 lg:gap-0">
                                                <span className="text-sm lg:text-xs font-black text-slate-900 dark:text-slate-100">{project.projectName || project.name}</span>
                                                <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider">{project.tasks} Tasks active</span>
                                            </div>
                                        </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4 lg:gap-0 lg:col-span-8 items-center">
                                        {/* Assignees */}
                                        <div className="flex flex-col lg:items-center gap-1 lg:col-span-2">
                                            <span className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest">Assignees</span>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{project.assignees}</span>
                                        </div>
                                        {/* Tasks */}
                                        <div className="hidden lg:flex flex-col lg:items-center gap-1 lg:col-span-2">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{project.tasks}</span>
                                        </div>
                                        {role !== 'EMPLOYEE' ? (
                                            <>
                                                {/* Bill Rate */}
                                                <div className="flex flex-col lg:items-center gap-1 lg:col-span-1">
                                                    <span className="lg:hidden text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">Rate</span>
                                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">${project.billRate}</span>
                                                </div>
                                                {/* Total Costs */}
                                                <div className="flex flex-col lg:items-center gap-1 lg:col-span-1">
                                                    <span className="lg:hidden text-[9px] font-black text-primary-500/70 uppercase tracking-widest">Costs</span>
                                                    <span className="text-sm lg:text-xs font-black text-primary-600 dark:text-primary-400">${project.totalCosts}</span>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center justify-center gap-2 lg:col-span-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setViewingProject(project);
                                                        }}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm"
                                                        title="View Project Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingProject(project);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all shadow-sm"
                                                        title="Edit Project"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    {role === 'ADMIN' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm('Are you sure you want to delete this project?')) {
                                                                    deleteProject(project.id);
                                                                }
                                                            }}
                                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all shadow-sm"
                                                            title="Delete Project"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 lg:col-span-4">
                                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                        Active Project
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setViewingProject(project);
                                                        }}
                                                        className="h-7 px-2.5 flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-[10px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                                                        title="View Project Tasks"
                                                    >
                                                        <Eye size={13} />
                                                        <span>View</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ));
                            })() }
                        </div>
                    </div>

            <NewProjectModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingProject(null);
                }}
                initialData={editingProject}
                employees={employees}
                teams={teams}
            />

            <ProjectDetailModal
                isOpen={!!viewingProject}
                onClose={() => setViewingProject(null)}
                project={viewingProject}
            />
        </div>
    );
}
