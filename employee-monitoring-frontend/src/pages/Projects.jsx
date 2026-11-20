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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative group w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={16} className="text-[#777367] dark:text-[#B8B3A7] group-focus-within:text-[#B9955B] transition-colors" strokeWidth={2.5} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search projects by name..."
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        className="w-full h-11 bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] rounded-xl pl-11 pr-4 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] focus:ring-2 focus:ring-[#B9955B]/20 focus:border-[#B9955B] outline-none transition-all placeholder:text-[#777367] dark:placeholder:text-[#888173] shadow-warm-xs"
                    />
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                    {role !== 'EMPLOYEE' && (
                        <button
                            onClick={handleDownload}
                            title="Download CSV report"
                            className="h-11 px-4 flex items-center justify-center gap-2 bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] dark:hover:bg-[#2E362A] transition-all rounded-xl shadow-warm-xs active:scale-95 cursor-pointer text-xs font-semibold"
                        >
                            <Download size={14} className="text-[#B9955B]" />
                            <span className="uppercase tracking-wider">Export Report</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-4">
                    {/* Table Layout (Hidden on Mobile) */}
                    <div className="hidden lg:block bg-[#F5F1E9]/40 dark:bg-[#1E2419]/60 rounded-xl border border-[#E5DED2] dark:border-[#384232]">
                        <div className="grid grid-cols-12 px-6 py-3 text-[11px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-wider text-center">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 md:gap-4 lg:gap-0 lg:space-y-2.5">
                        {(() => {
                            if (loading) return <div className="text-center py-20 font-semibold text-xs text-[#777367] dark:text-[#B8B3A7] animate-pulse">Fetching project data...</div>;

                                const filtered = projects.filter(p => (p.projectName || p.name || '').toLowerCase().includes(projectSearch.toLowerCase()));
                                if (filtered.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center py-20 text-center col-span-full bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] p-8">
                                            <div className="h-16 w-16 rounded-full bg-[#EEE8DD] dark:bg-[#1E2419] flex items-center justify-center mb-3">
                                                <Search size={24} className="text-[#B9955B]" />
                                            </div>
                                            <h3 className="text-base font-serif font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                                {role === 'EMPLOYEE' && !projectSearch
                                                    ? 'No Projects Assigned'
                                                    : 'No Projects Found'}
                                            </h3>
                                            <p className="text-xs text-[#777367] dark:text-[#B8B3A7] mt-1">
                                                {role === 'EMPLOYEE' && !projectSearch
                                                    ? 'No projects assigned to you yet. Contact your manager.'
                                                    : 'Try adjusting your search'}
                                            </p>
                                        </div>
                                    );
                                }
                                return filtered.map((project, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setViewingProject(project)}
                                        className="bg-[#FBF9F5] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] rounded-2xl p-4 sm:p-5 hover:shadow-warm-md hover:border-[#B9955B]/40 transition-all group lg:grid lg:grid-cols-12 lg:items-center cursor-pointer shadow-warm-xs"
                                    >
                                        {/* Desktop-only hidden / Mobile visible labels */}
                                        <div className="lg:col-span-4 flex items-center gap-3.5 mb-3 lg:mb-0">
                                            <div className="h-10 w-10 rounded-xl bg-[#30382B] text-[#D3B98D] flex items-center justify-center text-xs font-bold font-serif shadow-xs transition-transform group-hover:scale-105 shrink-0">
                                                {(project.projectName || project.name || 'PR').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <span className="text-xs sm:text-sm font-bold text-[#29291F] dark:text-[#F5F1E9] truncate">{project.projectName || project.name}</span>
                                                <span className="lg:hidden text-[10px] text-[#777367] dark:text-[#B8B3A7]">{project.tasks} Tasks active</span>
                                            </div>
                                        </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4 lg:gap-0 lg:col-span-8 items-center">
                                        {/* Assignees */}
                                        <div className="flex flex-col lg:items-center gap-0.5 lg:col-span-2">
                                            <span className="lg:hidden text-[9px] font-bold text-[#777367] uppercase tracking-wider">Assignees</span>
                                            <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">{project.assignees}</span>
                                        </div>
                                        {/* Tasks */}
                                        <div className="hidden lg:flex flex-col lg:items-center gap-0.5 lg:col-span-2">
                                            <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">{project.tasks}</span>
                                        </div>
                                        {role !== 'EMPLOYEE' ? (
                                            <>
                                                {/* Bill Rate */}
                                                <div className="flex flex-col lg:items-center gap-0.5 lg:col-span-1">
                                                    <span className="lg:hidden text-[9px] font-bold text-[#5E7D64] uppercase tracking-wider">Rate</span>
                                                    <span className="text-xs font-bold text-[#5E7D64] dark:text-[#8BB394]">${project.billRate}</span>
                                                </div>
                                                {/* Total Costs */}
                                                <div className="flex flex-col lg:items-center gap-0.5 lg:col-span-1">
                                                    <span className="lg:hidden text-[9px] font-bold text-[#B9955B] uppercase tracking-wider">Costs</span>
                                                    <span className="text-xs font-bold text-[#B9955B]">${project.totalCosts}</span>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center justify-center gap-2 lg:col-span-2">
                                                    <button
                                                        onClick={(e) => {
                                                             e.stopPropagation();
                                                             setViewingProject(project);
                                                        }}
                                                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#EEE8DD] dark:bg-[#1E2419] text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] border border-[#D6CDBC] dark:border-[#384232] transition-all cursor-pointer"
                                                        title="View Project Details"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingProject(project);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#EEE8DD] dark:bg-[#1E2419] text-[#B9955B] hover:text-[#A17D45] border border-[#D6CDBC] dark:border-[#384232] transition-all cursor-pointer"
                                                        title="Edit Project"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    {role === 'ADMIN' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm('Are you sure you want to delete this project?')) {
                                                                    deleteProject(project.id);
                                                                }
                                                            }}
                                                            className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#FAF3F2] dark:bg-[#3D2525] text-[#A84B4B] hover:bg-[#A84B4B] hover:text-white border border-[#E8CECE] dark:border-[#522929] transition-all cursor-pointer"
                                                            title="Delete Project"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 lg:col-span-4">
                                                    <span className="text-[10px] font-bold text-[#5E7D64] dark:text-[#8BB394] bg-[#5E7D64]/15 px-3 py-1 rounded-full border border-[#5E7D64]/30">
                                                        Active Project
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setViewingProject(project);
                                                        }}
                                                        className="h-7 px-3 flex items-center gap-1 rounded-xl bg-[#EEE8DD] dark:bg-[#1E2419] text-[#B9955B] hover:bg-[#B9955B] hover:text-white border border-[#D6CDBC] dark:border-[#384232] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                                        title="View Project Tasks"
                                                    >
                                                        <Eye size={12} />
                                                        <span>View</span>
                                                    </button>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            ));
                        })()}
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
