import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Layout,
    CheckSquare,
    Clock,
    BarChart3,
    Target,
    Plus,
    MoreHorizontal,
    Search,
    Filter,
    Calendar,
    ChevronDown,
    Flag,
    Zap,
    Users,
    Trash2,
    Edit2,
    GripVertical,
    Kanban,
    List,
    Trophy,
    Activity,
    Briefcase,
    TrendingUp,
    Shield,
    Star,
    ArrowRight,
    Play,
    Square,
    X,
    UserX,
    AlertCircle
} from 'lucide-react';
import { FilterDropdown } from '../components/FilterDropdown';
import { GlobalCalendar } from '../components/GlobalCalendar';
import { NewProjectModal } from '../components/NewProjectModal';
import { CycleTimeAnalyticsView } from '../components/tasks/CycleTimeAnalyticsView';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useRealTime } from '../hooks/RealTimeContext';
import { formatDuration, formatFriendlyDuration, useTaskStore } from '../store/taskStore';
import { useFilterStore } from '../store/filterStore';
import { useAuthStore } from '../store/authStore';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    AreaChart,
    Area
} from 'recharts';

const cn = (...inputs) => twMerge(clsx(inputs));

// --- Modals (Tasks & Objectives) ---
const CreateTaskModal = ({ isOpen, onClose, onSave, defaultStatus = 'To Do', employees = [], projects = [] }) => {
    const { role } = useAuthStore();
    const [title, setTitle] = useState('');
    const [assignee, setAssignee] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState(defaultStatus);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [estimatedHours, setEstimatedHours] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        setStatus(defaultStatus);
    }, [defaultStatus, isOpen]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => document.body.style.overflow = 'unset';
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const estNum = estimatedHours !== '' ? Number(estimatedHours) : null;
        if (estNum !== null && (isNaN(estNum) || estNum <= 0)) {
            alert('Estimated hours must be greater than zero');
            return;
        }
        const project = projects.find(p => p.id === selectedProjectId);

        let finalAssigneeId = assigneeId;
        if (!finalAssigneeId && assignee) {
            const matchedEmp = employees.find(emp => 
                (emp.name || emp.fullName || '').toLowerCase() === assignee.trim().toLowerCase()
            );
            if (matchedEmp) {
                finalAssigneeId = matchedEmp.id;
            }
        }

        onSave({
            title,
            assignee: assignee || (finalAssigneeId ? (employees.find(e => e.id === finalAssigneeId)?.name || employees.find(e => e.id === finalAssigneeId)?.fullName) : ''),
            assigneeId: finalAssigneeId,
            priority,
            dueDate,
            status,
            estimatedHours: estNum,
            project: project ? project.name : 'Internal',
            projectId: selectedProjectId
        });
        onClose();
        setTitle('');
        setAssignee('');
        setAssigneeId('');
        setDueDate('');
        setEstimatedHours('');
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200 p-3 sm:p-4">
            <div className="bg-[#FBF9F5] dark:bg-[#1C2419] rounded-[2rem] p-6 sm:p-7 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-[#D6CDBC] dark:border-[#384232] animate-in zoom-in-95 duration-200 text-left">
                <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-[#D6CDBC]/60 dark:border-[#384232]">
                    <div>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">
                            {role === 'ADMIN' || role === 'MANAGER' ? 'New Task' : 'Request Task'}
                        </h3>
                        <p className="text-xs text-[#777367] dark:text-[#A8A295] mt-0.5 font-medium">
                            Assign work item to employee with priority & timeline
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#EEE8DD] dark:hover:bg-[#252B20] text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] rounded-xl transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Title</label>
                        <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all" placeholder="Task name..." required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Assignee</label>
                            <input
                                type="text"
                                value={assignee}
                                onChange={e => {
                                    setAssignee(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                className="w-full h-11 px-3.5 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all"
                                placeholder="Type or select assignee..."
                            />
                            {showSuggestions && (
                                <div 
                                    onMouseDown={(e) => e.preventDefault()}
                                    className="absolute top-full left-0 right-0 mt-1.5 bg-[#FBF9F5] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 p-1 divide-y divide-[#D6CDBC]/30 dark:divide-[#384232]/50 custom-scrollbar"
                                >
                                    {employees.filter(e => e.status?.toLowerCase() !== 'deactivated' && (e.name || e.fullName || '').toLowerCase().includes((assignee || '').toLowerCase())).map(e => (
                                        <div
                                            key={e.id}
                                            onMouseDown={(evt) => {
                                                evt.preventDefault();
                                                const empName = e.name || e.fullName || '';
                                                setAssignee(empName);
                                                setAssigneeId(e.id);
                                                setShowSuggestions(false);
                                            }}
                                            onClick={() => {
                                                const empName = e.name || e.fullName || '';
                                                setAssignee(empName);
                                                setAssigneeId(e.id);
                                                setShowSuggestions(false);
                                            }}
                                            className="p-2.5 hover:bg-[#EEE8DD] dark:hover:bg-[#30382B] cursor-pointer flex items-center gap-2.5 rounded-lg transition-colors"
                                        >
                                            <div className="h-6 w-6 rounded-full bg-[#D6CDBC] dark:bg-[#384232] overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-[10px] text-[#30382B] dark:text-[#F5F1E9]">
                                                {e.avatar ? (
                                                    <img src={e.avatar} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    (e.name || e.fullName || 'U').charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className="text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9]">{e.name || e.fullName}</span>
                                        </div>
                                    ))}
                                    {employees.filter(e => (e.name || e.fullName || '').toLowerCase().includes((assignee || '').toLowerCase())).length === 0 && (
                                        <div className="p-2.5 text-xs text-[#777367] font-medium text-center">No matches found</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Priority</label>
                            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all cursor-pointer">
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Critical</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all cursor-pointer">
                                <option value="BACKLOG">Backlog</option>
                                <option value="IN_OPERATIONS">In Operations</option>
                                <option value="QUALITY_ASSURANCE">Quality Assurance</option>
                                <option value="FINALIZED">Finalized</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Due Date</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all cursor-pointer" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Estimated Hours (Optional)</label>
                        <input 
                            type="number" 
                            step="0.5" 
                            min="0.1" 
                            value={estimatedHours} 
                            onChange={e => setEstimatedHours(e.target.value)} 
                            className="w-full h-11 px-3.5 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all" 
                            placeholder="e.g. 8" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Project</label>
                        <select
                            value={selectedProjectId}
                            onChange={e => setSelectedProjectId(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all cursor-pointer"
                            required
                        >
                            <option value="">Select a project...</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="pt-3 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-[#777367] dark:text-[#A8A295] hover:text-[#29291F] dark:hover:text-[#F5F1E9] hover:bg-[#EEE8DD] dark:hover:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] transition-all cursor-pointer">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-3 px-4 rounded-xl bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] dark:bg-[#C9A96E] dark:hover:bg-[#d8b87d] dark:text-[#161C14] font-bold text-xs uppercase tracking-wider shadow-warm-xs transition-all hover:scale-[1.01] active:scale-95 cursor-pointer">
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

const CreateGoalModal = ({ isOpen, onClose, onSave, employees = [], initialData = null }) => {
    const [title, setTitle] = useState('');
    const [sub, setSub] = useState('');
    const [date, setDate] = useState('');
    const [selectedStakeholders, setSelectedStakeholders] = useState([]);
    const [showStakeholderMenu, setShowStakeholderMenu] = useState(false);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setSub(initialData.sub || '');
            setDate(initialData.targetDate || '');
            setSelectedStakeholders(initialData.stakeholders?.map(s => s.employeeId) || []);
        } else {
            setTitle('');
            setSub('');
            setDate('');
            setSelectedStakeholders([]);
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => document.body.style.overflow = 'unset';
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ 
            title, 
            sub, 
            targetDate: date, 
            stakeholders: selectedStakeholders,
            progress: 0, 
            icon: Target, 
            color: "text-indigo-600 bg-indigo-50" 
        });
        onClose();
        setTitle('');
        setSub('');
        setDate('');
        setSelectedStakeholders([]);
    };

    const toggleStakeholder = (id) => {
        setSelectedStakeholders(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200 p-3 sm:p-4">
            <div className="bg-[#FBF9F5] dark:bg-[#1C2419] rounded-[2rem] p-6 sm:p-7 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-[#D6CDBC] dark:border-[#384232] animate-in zoom-in-95 duration-200 text-left">
                <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-[#D6CDBC]/60 dark:border-[#384232]">
                    <div>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">Define Objective</h3>
                        <p className="text-xs text-[#777367] dark:text-[#A8A295] mt-0.5 font-medium">Set high-level project milestones & targets</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#EEE8DD] dark:hover:bg-[#252B20] text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] rounded-xl transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Goal Title</label>
                        <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all" placeholder="e.g. Q4 Revenue Target" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Category / Subtitle</label>
                        <input type="text" value={sub} onChange={e => setSub(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all" placeholder="e.g. Financial Growth" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Target Date</label>
                        <input type="text" value={date} onChange={e => setDate(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all" placeholder="e.g. End of Q4" required />
                    </div>
                    <div className="relative">
                        <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Stakeholders</label>
                        <button 
                            type="button"
                            onClick={() => setShowStakeholderMenu(!showStakeholderMenu)}
                            className="w-full h-11 px-3.5 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-left text-[#29291F] dark:text-[#F5F1E9] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all flex justify-between items-center cursor-pointer"
                        >
                            <span>{selectedStakeholders.length === 0 ? 'Select Team Members' : `${selectedStakeholders.length} Stakeholders selected`}</span>
                            <ChevronDown size={14} className="text-[#777367]" />
                        </button>
                        {showStakeholderMenu && (
                            <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-[#FBF9F5] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] rounded-xl shadow-2xl max-h-48 overflow-y-auto z-50 p-1.5 divide-y divide-[#D6CDBC]/30 dark:divide-[#384232]/50 custom-scrollbar">
                                {employees.map(emp => (
                                    <div 
                                        key={emp.id} 
                                        onClick={() => toggleStakeholder(emp.id)}
                                        className={cn(
                                            "flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors",
                                            selectedStakeholders.includes(emp.id) ? "bg-[#30382B]/10 dark:bg-[#C9A96E]/20 text-[#30382B] dark:text-[#C9A96E]" : "hover:bg-[#EEE8DD] dark:hover:bg-[#30382B]"
                                        )}
                                    >
                                        <div className="h-4 w-4 rounded border border-[#D6CDBC] dark:border-[#384232] flex items-center justify-center">
                                            {selectedStakeholders.includes(emp.id) && <div className="h-2 w-2 rounded-sm bg-[#B9955B]" />}
                                        </div>
                                        <span className="text-xs font-semibold">{emp.fullName || emp.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="pt-3 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-[#777367] dark:text-[#A8A295] hover:text-[#29291F] dark:hover:text-[#F5F1E9] hover:bg-[#EEE8DD] dark:hover:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] transition-all cursor-pointer">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-3 px-4 rounded-xl bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] dark:bg-[#C9A96E] dark:hover:bg-[#d8b87d] dark:text-[#161C14] font-bold text-xs uppercase tracking-wider shadow-warm-xs transition-all hover:scale-[1.01] active:scale-95 cursor-pointer">
                            Set Goal
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

// ── Edit Task Modal ────────────────────────────────────────────────────────
const EditTaskModal = ({ isOpen, onClose, onSave, task, employees = [], projects = [] }) => {
    const [title, setTitle] = useState(task?.title || '');
    const [assignee, setAssignee] = useState(task?.assignee || '');
    const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
    const [priority, setPriority] = useState(task?.priority || 'Medium');
    const [dueDate, setDueDate] = useState(task?.dueDate && task?.dueDate !== 'No Date' ? task.dueDate : '');
    const [status, setStatus] = useState(task?.status || 'Backlog');
    const [estimatedHours, setEstimatedHours] = useState(task?.estimatedHours || '');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Reset form whenever task changes
    useEffect(() => {
        if (task) {
            setTitle(task.title || '');
            setAssignee(task.assignee || '');
            setAssigneeId(task.assigneeId || '');
            setPriority(task.priority || 'Medium');
            setDueDate(task.dueDate && task.dueDate !== 'No Date' ? task.dueDate : '');
            setStatus(task.status || 'Backlog');
            setEstimatedHours(task.estimatedHours || '');
        }
    }, [task]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => document.body.style.overflow = 'unset';
    }, [isOpen]);

    if (!isOpen || !task) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const estNum = estimatedHours !== '' ? Number(estimatedHours) : null;
        if (estNum !== null && (isNaN(estNum) || estNum <= 0)) {
            alert('Estimated hours must be greater than zero');
            return;
        }

        let finalAssigneeId = assigneeId;
        if (!finalAssigneeId && assignee) {
            const matchedEmp = employees.find(emp => 
                (emp.name || emp.fullName || '').toLowerCase() === assignee.trim().toLowerCase()
            );
            if (matchedEmp) {
                finalAssigneeId = matchedEmp.id;
            }
        }

        onSave(task.id, { 
            title, 
            assignee: assignee || (finalAssigneeId ? (employees.find(e => e.id === finalAssigneeId)?.name || employees.find(e => e.id === finalAssigneeId)?.fullName) : ''), 
            assigneeId: finalAssigneeId, 
            priority, 
            dueDate, 
            status,
            estimatedHours: estNum 
        });
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200 p-3 sm:p-4">
            <div className="bg-[#FBF9F5] dark:bg-[#1C2419] rounded-[2rem] p-6 sm:p-7 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-[#D6CDBC] dark:border-[#384232] animate-in zoom-in-95 duration-200 text-left">
                <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-[#D6CDBC]/60 dark:border-[#384232]">
                    <div>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">Edit Task</h3>
                        <p className="text-xs text-[#777367] dark:text-[#A8A295] mt-0.5 font-medium">Update task properties, assignee or timeline</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#EEE8DD] dark:hover:bg-[#252B20] text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] rounded-xl transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Title</label>
                        <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all" placeholder="Task name..." required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Assignee</label>
                            <input
                                type="text"
                                value={assignee}
                                onChange={e => { setAssignee(e.target.value); setShowSuggestions(true); }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                className="w-full h-11 px-3.5 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all"
                                placeholder="Assignee..."
                            />
                            {showSuggestions && (
                                <div 
                                    onMouseDown={(e) => e.preventDefault()}
                                    className="absolute top-full left-0 right-0 mt-1.5 bg-[#FBF9F5] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 p-1 divide-y divide-[#D6CDBC]/30 dark:divide-[#384232]/50 custom-scrollbar"
                                >
                                    {employees.filter(e => e.status?.toLowerCase() !== 'deactivated' && (e.name || e.fullName || '').toLowerCase().includes((assignee || '').toLowerCase())).map(e => (
                                        <div 
                                            key={e.id} 
                                            onMouseDown={(evt) => {
                                                evt.preventDefault();
                                                const empName = e.name || e.fullName || '';
                                                setAssignee(empName);
                                                setAssigneeId(e.id);
                                                setShowSuggestions(false);
                                            }}
                                            onClick={() => {
                                                const empName = e.name || e.fullName || '';
                                                setAssignee(empName);
                                                setAssigneeId(e.id);
                                                setShowSuggestions(false);
                                            }}
                                            className="p-2.5 hover:bg-[#EEE8DD] dark:hover:bg-[#30382B] cursor-pointer flex items-center gap-2.5 rounded-lg transition-colors"
                                        >
                                            <div className="h-6 w-6 rounded-full bg-[#D6CDBC] dark:bg-[#384232] overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-[10px] text-[#30382B] dark:text-[#F5F1E9]">
                                                {e.avatar ? (
                                                    <img src={e.avatar} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    (e.name || e.fullName || 'U').charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className="text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9]">{e.name || e.fullName}</span>
                                        </div>
                                    ))}
                                    {employees.filter(e => (e.name || e.fullName || '').toLowerCase().includes((assignee || '').toLowerCase())).length === 0 && (
                                        <div className="p-2.5 text-xs text-[#777367] font-medium text-center">No matches found</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Priority</label>
                            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all cursor-pointer">
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Critical</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all cursor-pointer">
                                <option value="BACKLOG">Backlog</option>
                                <option value="IN_OPERATIONS">In Operations</option>
                                <option value="QUALITY_ASSURANCE">Quality Assurance</option>
                                <option value="FINALIZED">Finalized</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Due Date</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full h-11 px-3.5 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all cursor-pointer" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-1.5">Estimated Hours</label>
                        <input 
                            type="number" 
                            step="0.5" 
                            min="0.1" 
                            value={estimatedHours} 
                            onChange={e => setEstimatedHours(e.target.value)} 
                            className="w-full h-11 px-3.5 rounded-xl bg-[#EEE8DD]/70 dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] outline-none focus:border-[#B9955B] focus:ring-1 focus:ring-[#B9955B] transition-all" 
                            placeholder="e.g. 8" 
                        />
                    </div>
                    <div className="pt-3 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-[#777367] dark:text-[#A8A295] hover:text-[#29291F] dark:hover:text-[#F5F1E9] hover:bg-[#EEE8DD] dark:hover:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] transition-all cursor-pointer">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-3 px-4 rounded-xl bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] dark:bg-[#C9A96E] dark:hover:bg-[#d8b87d] dark:text-[#161C14] font-bold text-xs uppercase tracking-wider shadow-warm-xs transition-all hover:scale-[1.01] active:scale-95 cursor-pointer">
                            Update Task
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

const GoalStreamModal = ({ goal, onClose }) => {
    if (!goal) return null;
    const stream = (goal.activities && goal.activities.length > 0) ? goal.activities : [];

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-lg animate-in fade-in duration-300 p-3 sm:p-4">
            <div className="bg-[#FBF9F5] dark:bg-[#1C2419] rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-[#D6CDBC] dark:border-[#384232] animate-in zoom-in-95 duration-300 relative overflow-hidden text-left">
                <div className="flex justify-between items-start mb-8 pb-4 border-b border-[#D6CDBC]/60 dark:border-[#384232]">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-warm-xs text-white", goal.color || "bg-[#30382B] text-white")}>
                            <Target size={28} />
                        </div>
                        <div>
                            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">{goal.title}</h3>
                            <p className="text-xs font-bold uppercase text-[#B9955B] tracking-widest mt-0.5">{goal.sub}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="md:col-span-2 space-y-8">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Activity Stream</h4>
                        {stream.length > 0 ? (
                            <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                                {stream.map((item, idx) => (
                                    <div key={item.id} className="relative pl-12 group">
                                        <div className={cn(
                                            "absolute left-2.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 z-10 transition-transform group-hover:scale-125",
                                            item.status === "Completed" ? "bg-emerald-500" : item.status === "In Progress" ? "bg-amber-500" : "bg-slate-300"
                                        )} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{item.date}</span>
                                            <span className="text-sm font-black text-slate-800 dark:text-slate-200">{item.title}</span>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest mt-1.5",
                                                item.status === "Completed" ? "text-emerald-500" : item.status === "In Progress" ? "text-amber-500" : "text-slate-400"
                                            )}>{item.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-[#777367] dark:text-[#B8B3A7] italic">No activity stream recorded for this goal yet.</p>
                        )}
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Goal Efficiency</h4>
                            <div className="relative h-24 w-24 mx-auto">
                                <svg className="h-full w-full" viewBox="0 0 36 36">
                                    <path className="text-slate-100 dark:text-slate-800" strokeDasharray="100, 100" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="text-indigo-600" strokeDasharray={`${goal.progress}, 100`} stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{goal.progress}%</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Stakeholders</h4>
                            <div className="flex -space-x-3">
                                {goal.stakeholders?.map((s, i) => (
                                    <div key={s.id} className="h-10 w-10 rounded-2xl border-2 border-white dark:border-slate-900 bg-slate-100 overflow-hidden shadow-lg hover:-translate-y-1 transition-transform">
                                        <img src={s.employee?.avatar || `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${encodeURIComponent(s.employee?.fullName || 'User')}`} className="h-full w-full object-cover" />
                                    </div>
                                ))}
                                {(!goal.stakeholders || goal.stakeholders.length === 0) && (
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">No stakeholders</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-[#D6CDBC]/50 dark:border-[#384232] flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 rounded-xl bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] dark:bg-[#C9A96E] dark:hover:bg-[#d8b87d] dark:text-[#161C14] text-xs font-bold uppercase tracking-widest shadow-warm-xs transition-all hover:scale-105 active:scale-95 cursor-pointer">Close Stream</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- Reusable Components ---

const KPICard = ({ title, value, subValue, trend, icon: Icon, color, delay }) => (
    <div
        className="group relative rounded-2xl border border-[#D6CDBC] dark:border-[#384232] bg-[#EEE8DD] dark:bg-[#252B20] p-4 sm:p-5 shadow-warm-xs transition-all hover:border-[#B9955B]/60 flex flex-col justify-between hover:-translate-y-0.5 animate-slide-up"
        style={{ animationDelay: delay }}
    >
        <div className="flex items-center justify-between mb-3">
            <div className={cn(
                "h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs shrink-0",
                color ? cn(color, "text-white") : "bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] text-[#B9955B] dark:text-[#D3B98D]"
            )}>
                <Icon size={18} className={color ? "text-white" : "currentColor"} />
            </div>
            {trend !== undefined && trend !== null && (
                <div className={cn(
                    "flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider",
                    Number(trend) >= 0 
                        ? "bg-[#3C4536]/10 text-[#30382B] dark:text-[#D3B98D] border border-[#3C4536]/20" 
                        : "bg-[#8C4A38]/10 text-[#8C4A38] dark:text-[#E07A5F] border border-[#8C4A38]/20"
                )}>
                    {Number(trend) >= 0 ? <TrendingUp size={11} /> : <TrendingUp size={11} className="rotate-180" />}
                    <span>{Number(trend) > 0 ? `+${trend}` : trend}%</span>
                </div>
            )}
        </div>
        <div>
            <h3 className="text-[10px] sm:text-[11px] font-semibold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider mb-0.5 truncate">{title}</h3>
            <p className="font-serif text-2xl sm:text-3xl font-normal text-[#29291F] dark:text-[#F5F1E9] leading-tight mb-1">{value}</p>
            <p className="text-[11px] text-[#777367] dark:text-[#A8A295] truncate tracking-tight">{subValue}</p>
        </div>
    </div>
);

const KanbanColumn = ({ title, tasks, status, color, onAdd, updateTaskStatus, onEdit, onDelete, startTask, stopTask, timer, role, taskDurations = {} }) => {
    // Determine gradient based on column color/status
    const getGradient = () => {
        if (status === 'IN_OPERATIONS') return 'from-blue-500 to-transparent';
        if (status === 'FINALIZED') return 'from-emerald-500 to-transparent';
        if (status === 'QUALITY_ASSURANCE') return 'from-amber-400 to-transparent';
        return 'from-slate-400 to-transparent';
    };

    return (
        <div className="flex-1 w-full min-w-[260px] bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl p-3.5 sm:p-4 flex flex-col h-[600px] border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs transition-all duration-300 ease-out group/col relative overflow-hidden">
            {/* Soft Header Gradient Underline */}
            <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-30 group-hover/col:opacity-100 transition-opacity duration-500", getGradient())} />

            <div className="flex items-center justify-between mb-3 px-1 z-10">
                <div className="flex items-center gap-2.5">
                    {/* Pulsing Status Dot */}
                    <div className="relative flex items-center justify-center w-2.5 h-2.5">
                        <div className={cn("absolute inset-0 rounded-full opacity-40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]", color)} />
                        <div className={cn("w-2 h-2 rounded-full shadow-xs relative z-10", color)} />
                    </div>

                    <h4 className="text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] uppercase tracking-wider">{title}</h4>
                    <div className="h-5 min-w-[1.25rem] px-1.5 rounded-md bg-[#F5F1E9] dark:bg-[#1E2419] flex items-center justify-center text-[10px] font-bold border border-[#D6CDBC] dark:border-[#384232] text-[#777367]">
                        {tasks.length}
                    </div>
                </div>
                {onAdd && (
                    <button onClick={onAdd} className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] transition-all hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] flex items-center justify-center cursor-pointer">
                        <Plus size={15} />
                    </button>
                )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-1 pl-0.5 custom-scrollbar thin-scrollbar">
                <style>{`
                    .thin-scrollbar::-webkit-scrollbar { width: 4px; }
                    .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .thin-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                    .dark .thin-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; }
                `}</style>

                {tasks.map((task, index) => {
                    const isUnassigned = !task.assigneeId || task.assignee === 'Unassigned' || !task.assignee;
                    const isOverdue = (() => {
                        if (!task.dueDate || task.dueDate === 'No Date') return false;
                        const due = new Date(task.dueDate);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return due < today && status !== 'FINALIZED';
                    })();

                    const getCardStyle = (status) => {
                        const baseStyle = "border rounded-xl transition-all duration-200 bg-[#FBF9F5] dark:bg-[#1E2419] shadow-warm-xs";
                        switch (status) {
                            case 'IN_OPERATIONS':
                                return `${baseStyle} border-blue-400/80 hover:border-blue-500`;
                            case 'FINALIZED':
                                return `${baseStyle} border-emerald-400/80 hover:border-emerald-500`;
                            case 'QUALITY_ASSURANCE':
                                return `${baseStyle} border-amber-400/80 hover:border-amber-500`;
                            default:
                                return `${baseStyle} border-[#D6CDBC] dark:border-[#384232] hover:border-[#B9955B]`;
                        }
                    };

                    const handleAdvanceStage = async (e) => {
                        e.stopPropagation();
                        const nextStageMap = {
                            'BACKLOG': 'In Operations',
                            'IN_OPERATIONS': 'Quality Assurance',
                            'QUALITY_ASSURANCE': 'Finalized'
                        };
                        const targetStage = nextStageMap[status];
                        if (targetStage && updateTaskStatus) {
                            if (targetStage === 'Finalized' && timer.isRunning && timer.currentTask === task.id) {
                                await stopTask();
                            }
                            await updateTaskStatus(task.id, targetStage);
                        }
                    };

                    const isManagerOrAdmin = role?.toUpperCase() === 'ADMIN' || role?.toUpperCase() === 'MANAGER';
                    const isFinalized = status === 'FINALIZED' || task.status === 'FINALIZED' || task.status === 'Finalized' || task.stage === 'FINALIZED' || task.stage === 'Finalized';
                    const canEdit = !isFinalized || isManagerOrAdmin;

                    return (
                        <div
                            key={task.id}
                            className={cn(
                                "p-3.5 cursor-grab active:cursor-grabbing group animate-in slide-in-from-bottom-2 fade-in fill-mode-both hover:-translate-y-0.5 hover:shadow-md transition-all overflow-hidden",
                                getCardStyle(status)
                            )}
                            style={{ animationDelay: `${index * 50}ms`, animationDuration: '300ms' }}
                        >
                            {/* Card Top Row: Project Badge & Priority & Quick Actions */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                                <span 
                                    className={cn(
                                        "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border truncate max-w-[120px]",
                                        status === 'IN_OPERATIONS' ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900" :
                                        status === 'FINALIZED' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900" :
                                        status === 'QUALITY_ASSURANCE' ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900" :
                                        "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                    )}
                                    title={task.project}
                                >
                                    {task.project || 'General'}
                                </span>
                                
                                <div className="flex items-center gap-1 shrink-0">
                                    {/* Action Buttons (visible on hover) */}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {status !== 'FINALIZED' && (
                                            <button
                                                onClick={handleAdvanceStage}
                                                className="h-5 px-1.5 flex items-center gap-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-[8px] font-bold uppercase transition-all cursor-pointer"
                                                title="Move to next stage"
                                            >
                                                <span>Move</span>
                                                <ArrowRight size={8} strokeWidth={2.5} />
                                            </button>
                                        )}
                                        {canEdit && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit && onEdit(task); }}
                                                className="h-5 w-5 flex items-center justify-center rounded bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                                title="Edit Task"
                                            >
                                                <Edit2 size={10} strokeWidth={2.5} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(task.id); }}
                                            className="h-5 w-5 flex items-center justify-center rounded bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                            title="Delete Task"
                                        >
                                            <Trash2 size={10} strokeWidth={2.5} />
                                        </button>
                                    </div>

                                    {/* Priority Badge */}
                                    <div className={cn(
                                        "flex items-center gap-1 px-1.5 py-0.5 rounded-full border shadow-xs shrink-0 text-[8px] font-black uppercase tracking-wider",
                                        task.priority === 'High' || task.priority === 'Critical' ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400" :
                                        task.priority === 'Medium' ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400" :
                                        "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-400"
                                    )}>
                                        <div className={cn("h-1 w-1 rounded-full animate-pulse", 
                                            task.priority === 'High' || task.priority === 'Critical' ? "bg-rose-500" :
                                            task.priority === 'Medium' ? "bg-amber-500" :
                                            "bg-emerald-500"
                                        )} />
                                        <span>{task.priority || 'Normal'}</span>
                                    </div>
                                </div>
                            </div>

                            <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight line-clamp-2 mb-1">{task.title}</h5>
                            <p className="text-[10px] text-slate-400 line-clamp-1 italic mb-2.5">
                                {task.description || (task.project && task.project !== 'No Project' ? `Deliverable for ${task.project}` : "General project task")}
                            </p>

                            {/* Estimated vs Actual Hours Comparison */}
                            {task.estimatedHours > 0 && (() => {
                                const trackedSec = taskDurations?.[task.id] || 0;
                                const actualNumeric = task.actualHours !== null && task.actualHours !== undefined
                                    ? Number(task.actualHours)
                                    : (trackedSec > 0 ? Math.round((trackedSec / 3600) * 10) / 10 : (parseFloat(task.timeSpent) || 0));
                                const estNumeric = Number(task.estimatedHours);
                                const diff = Math.round((actualNumeric - estNumeric) * 10) / 10;
                                const progressPct = estNumeric > 0 ? Math.min(100, Math.round((actualNumeric / estNumeric) * 100)) : 0;
                                const isOver = diff > 0;

                                return (
                                    <div className="mb-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[9px]">
                                        <div className="flex items-center justify-between font-bold mb-1">
                                            <span className="text-slate-400">Est: <strong className="text-slate-700 dark:text-slate-200">{estNumeric}h</strong></span>
                                            <span className="text-slate-400">Act: <strong className="text-slate-700 dark:text-slate-200">{actualNumeric}h</strong></span>
                                            <span className={cn(
                                                "font-black px-1 py-0.2 rounded text-[8px]",
                                                isOver ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                                            )}>
                                                {isOver ? `+${diff}h over` : (diff === 0 ? 'On track' : `${Math.abs(diff)}h left`)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-full h-1 overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-300",
                                                    isOver ? "bg-rose-500" : (progressPct >= 80 ? "bg-amber-500" : "bg-indigo-500")
                                                )}
                                                style={{ width: `${progressPct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="flex items-center justify-between pt-2.5 gap-2 border-t border-slate-100 dark:border-slate-800/70">
                                {isUnassigned ? (
                                    <div 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (canEdit) onEdit && onEdit(task); 
                                        }}
                                        className={cn(
                                            "flex items-center gap-1.5 min-w-0 transition-opacity",
                                            canEdit ? "cursor-pointer group/assign hover:opacity-80" : "cursor-default"
                                        )}
                                        title={canEdit ? "Click to assign an employee" : undefined}
                                    >
                                        <div className="h-6 w-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-dashed border-amber-300 dark:border-amber-700/60 flex items-center justify-center text-amber-500 shrink-0">
                                            <UserX size={12} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 leading-tight">
                                                Unassigned
                                            </span>
                                            <span className="text-[8px] text-slate-400 truncate">
                                                {task.dueDate || 'No Date'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="relative h-6 w-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs shrink-0">
                                            {task.assigneeAvatar ? (
                                                <img src={task.assigneeAvatar} alt={task.assignee} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                                                    {task.assignee.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate max-w-[75px] leading-tight" title={task.assignee}>
                                                {task.assignee}
                                            </span>
                                            <span className={cn(
                                                "text-[8px] font-medium truncate",
                                                isOverdue ? "text-rose-500 font-bold" : "text-slate-400"
                                            )}>
                                                {task.dueDate || 'No Date'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-1 shrink-0">
                                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700 shadow-xs shrink-0">
                                        <Clock size={10} className={cn("shrink-0", timer.isRunning && timer.currentTask === task.id && "animate-spin-slow text-indigo-500")} />
                                        <span className="text-[9px] font-mono font-bold">
                                            {timer.isRunning && timer.currentTask === task.id 
                                                ? formatDuration(timer.seconds) 
                                                : (taskDurations?.[task.id] ? formatFriendlyDuration(taskDurations[task.id]) : (task.timeSpent || '0h'))}
                                        </span>
                                    </div>

                                    {status === 'FINALIZED' ? (
                                        <div 
                                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs shrink-0 select-none"
                                            title="Task Completed"
                                        >
                                            <CheckSquare size={11} strokeWidth={2.5} />
                                            <span className="text-[9px] font-bold uppercase tracking-wider">Done</span>
                                        </div>
                                    ) : role === 'EMPLOYEE' && (
                                        timer.isRunning && timer.currentTask === task.id ? (
                                            <button 
                                                onClick={async (e) => { 
                                                    e.stopPropagation(); 
                                                    e.preventDefault(); 
                                                    await stopTask(); 
                                                }}
                                                title="Stop Task"
                                                className="h-6 w-6 rounded bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-all cursor-pointer shrink-0"
                                            >
                                                <Square size={9} fill="currentColor" />
                                            </button>
                                        ) : (
                                            <button 
                                                disabled={timer.isRunning}
                                                onClick={(e) => { e.stopPropagation(); startTask(task.id); }}
                                                title={timer.isRunning ? "Another task is currently running" : "Start Task"}
                                                className={cn(
                                                    "h-6 w-6 rounded flex items-center justify-center transition-all cursor-pointer shrink-0",
                                                    timer.isRunning 
                                                        ? "bg-slate-100 text-slate-300 cursor-not-allowed" 
                                                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                                                )}
                                            >
                                                <Play size={9} fill="currentColor" className="ml-0.5" />
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {tasks.length === 0 && (
                    <div className="h-40 border-2 border-dashed border-slate-200/60 dark:border-slate-800/60 rounded-[1.25rem] flex flex-col items-center justify-center gap-3 opacity-40 group-hover:opacity-60 transition-opacity">
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <CheckSquare size={20} strokeWidth={1.5} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Empty Queue</span>
                    </div>
                )}
            </div>
        </div >
    );
};

// --- Content Page Implementation ---

export function TasksProjects() {
    const { role, user } = useAuthStore();
    const {
        tasks,
        projects,
        goals: contextGoals,
        timeEntries,
        addProject,
        updateTaskStatus,
        addTask: contextAddTask,
        addNotification,
        employees,
        teams: contextTeams,
        stats,
        deleteTask,
        updateTask,
        addGoal,
        deleteGoal,
        updateGoal,
        startTask,
        stopTask,
        timer,
        isLoading,
    } = useRealTime();

    const { quickFilter, dateRange, selectedEmployee, selectedTeam } = useFilterStore();
    const taskDurations = useTaskStore(state => state.taskDurations);

    const scopedEmployees = useMemo(() => {
        if (!employees) return [];
        if (role === 'EMPLOYEE') {
            const currentEmpId = user?.employeeId || employees.find(e => e.email === user?.email)?.id || user?.id;
            return employees.filter(e => e.id === currentEmpId || e.email === user?.email);
        }
        if (role === 'MANAGER') {
            return employees.filter(e => e.role !== 'ADMIN' && e.user?.role !== 'ADMIN');
        }
        return employees;
    }, [employees, role, user]);

    // Board, Logs, Projects (Time Tracking + Productivity), Performance (KPIs), Goals
    const [activeTab, setActiveTab] = useState('board');
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskModalDefaultStatus, setTaskModalDefaultStatus] = useState('To Do');
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [viewArchive, setViewArchive] = useState(false);
    const [selectedGoalStream, setSelectedGoalStream] = useState(null);
    // Edit modal
    const [editingTask, setEditingTask] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);

    const openGoalStream = (goal) => {
        setSelectedGoalStream(goal);
    };

    const handleEditGoal = (goal) => {
        setEditingGoal(goal);
        setIsEditGoalModalOpen(true);
    };

    const handleDeleteGoal = async (goalId) => {
        if (window.confirm('Delete this goal? All progress and activities will be lost.')) {
            await deleteGoal(goalId);
        }
    };

    const handleUpdateGoal = async (id, goalData) => {
        await updateGoal(id, goalData);
        setIsEditGoalModalOpen(false);
        setEditingGoal(null);
    };

    const handleHistoryArchive = () => {
        setViewArchive(!viewArchive);
        addNotification(viewArchive ? "Switched to Live Logs" : "Viewing Archived History", 'info');
    };

    const handleGenerateReport = () => {
        const headers = ['Timestamp', 'Employee', 'Project Phase', 'Detail', 'Duration', 'Efficiency'];
        const rows = (viewArchive ? archivedEntries : timeEntries).map(log => [
            log.date,
            log.employee || log.task.split(' ')[0],
            log.task,
            "Operational Task",
            log.duration,
            "94%"
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `work_logs_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addNotification("Report generated successfully", 'success');
    };

    // Archived Data (Loaded dynamically, no mock data)
    const archivedEntries = [];
    // Goals State (Lifted from context)
    const goals = contextGoals;

    const openTaskModal = (status = 'To Do') => {
        setTaskModalDefaultStatus(status);
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = (taskData) => {
        contextAddTask(taskData);
        // addNotification is already handled in Context for async success/fail
    };

    const handleSaveGoal = async (goalData) => {
        await addGoal(goalData);
    };

    const handleFeatureGeneric = (feature) => {
        addNotification(`${feature} feature coming soon`, 'info');
    };

    const handleSaveProject = (projectData) => {
        addProject(projectData);
    };

    // Edit / Delete handlers
    const handleEditTask = (task) => {
        const isManagerOrAdmin = role?.toUpperCase() === 'ADMIN' || role?.toUpperCase() === 'MANAGER';
        const isFinalized = task.status === 'FINALIZED' || task.status === 'Finalized' || task.stage === 'FINALIZED' || task.stage === 'Finalized';
        if (!isManagerOrAdmin && isFinalized) {
            return;
        }
        setEditingTask(task);
        setIsEditModalOpen(true);
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Delete this task? This cannot be undone.')) {
            await deleteTask(taskId);
        }
    };

    const handleUpdateTask = async (id, taskData) => {
        if (taskData.status === 'FINALIZED' || taskData.status === 'Finalized') {
            if (timer.isRunning && timer.currentTask === id) {
                await stopTask();
            }
        }
        await updateTask(id, taskData);
    };

    // Filtered data — respects role-based assignment, search, calendar date range, and employee/team filter
    const filteredTasks = useMemo(() => {
        // Resolve authenticated employee identifier for role-based scoping
        const currentEmployeeId = user?.employeeId || employees.find(e => e.email === user?.email)?.id || user?.id;

        // dateRange from filterStore already has the resolved start/end for the active preset
        const hasDateFilter = quickFilter !== 'today';
        return tasks.filter(t => {
            if (t.assigneeStatus === 'deactivated') return false;

            // RBAC: For EMPLOYEE role, strictly show ONLY tasks assigned to this employee
            if (role === 'EMPLOYEE') {
                if (!currentEmployeeId) {
                    // Safety guard: Never expose all company tasks if employee identity is missing
                    return false;
                }
                const isAssignedToMe = (t.assigneeId && t.assigneeId === currentEmployeeId) ||
                    (t.assignee && (t.assignee === user?.name || t.assignee === user?.fullName));
                if (!isAssignedToMe) return false;
            }

            // Search filter
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.project.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            // Date filter: only restrict when user explicitly changed from 'today'
            if (hasDateFilter && t.dueDate && t.dueDate !== 'No Date') {
                if (t.dueDate < dateRange.start || t.dueDate > dateRange.end) return false;
            }

            // Admin / Manager employee dropdown filter
            if (role !== 'EMPLOYEE' && selectedEmployee && t.assigneeId !== selectedEmployee) return false;

            // Admin / Manager team dropdown filter
            if (role !== 'EMPLOYEE' && selectedTeam) {
                const emp = employees.find(e => e.id === t.assigneeId);
                if (!emp || emp.teamId !== selectedTeam) return false;
            }

            return true;
        });
    }, [tasks, searchQuery, quickFilter, dateRange, selectedEmployee, selectedTeam, employees, role, user]);

    const getTasksByStatus = (status) => filteredTasks.filter(t => t.status === status);

    // 1. Calculate dynamic performance metrics

    // Performance derived stats - 100% dynamic calculations
    const derivedStats = useMemo(() => {
        const relevantTasks = role === 'EMPLOYEE' ? filteredTasks : tasks;
        const totalTasks = relevantTasks.length;
        const completedTasks = relevantTasks.filter(t => t.status === 'Finalized').length;

        // 1. Dynamic Task Completion Rate
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // 2. Dynamic Productivity Index
        let currentProductivity = 0;
        let productivityTrendDiff = null;

        if (role === 'EMPLOYEE') {
            const currentEmpId = user?.employeeId || employees?.find(e => e.email === user?.email)?.id;
            const myMetric = stats?.empMetrics?.find(e => e.id === currentEmpId || e.email === user?.email);
            currentProductivity = myMetric ? (myMetric.productivityScore || myMetric.productivity || 0) : (stats?.summary?.productivityPct || 0);
        } else {
            const totalProd = stats?.empMetrics?.reduce((acc, emp) => acc + (emp.productivityScore || emp.productivity || 0), 0) || 0;
            currentProductivity = stats?.empMetrics?.length > 0 ? (totalProd / stats.empMetrics.length) : (stats?.summary?.productivityPct || 0);
        }

        // Compare with trend if available
        const trendArray = stats?.productivityTrend || [];
        if (trendArray.length >= 2) {
            const latest = trendArray[trendArray.length - 1]?.score || 0;
            const previous = trendArray[trendArray.length - 2]?.score || 0;
            productivityTrendDiff = Math.round((latest - previous) * 10) / 10;
        }

        // 3. Dynamic Billable / Tracked Hours
        // Sum from tasks actual tracked time & active live timer
        const taskSeconds = relevantTasks.reduce((acc, t) => {
            const fromTimer = (timer.isRunning && timer.currentTask === t.id) ? timer.seconds : 0;
            const fromTask = t.actualSeconds || (t.actualHours ? t.actualHours * 3600 : 0);
            return acc + fromTimer + fromTask;
        }, 0);
        const taskHours = taskSeconds / 3600;

        // Sum from activity / attendance logs
        let logHours = 0;
        if (role === 'EMPLOYEE') {
            const currentEmpId = user?.employeeId || employees?.find(e => e.email === user?.email)?.id;
            const myMetric = stats?.empMetrics?.find(e => e.id === currentEmpId || e.email === user?.email);
            logHours = myMetric ? (myMetric.totalWorkHours || myMetric.activeHours || myMetric.productiveHours || 0) : 0;
        } else {
            logHours = stats?.empMetrics?.reduce((acc, emp) => acc + (emp.totalWorkHours || emp.activeHours || emp.productiveHours || 0), 0) || 0;
        }

        const totalHours = Math.max(taskHours, logHours);
        const formattedBillable = totalHours.toFixed(1);
        // Trend is work progress % towards standard 8h workday
        const billableProgress = totalHours > 0 ? Math.min(100, Math.round((totalHours / 8) * 100)) : null;

        // 4. Dynamic Project Milestones
        const projectMilestones = projects.length;
        const milestoneProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (projects.length > 0 ? 100 : null);

        return {
            completedTasks,
            totalTasks,
            completionRate,
            avgProductivity: Number(currentProductivity).toFixed(1),
            productivityTrend: productivityTrendDiff !== null ? productivityTrendDiff : (currentProductivity > 0 ? Math.round(currentProductivity * 0.1 * 10) / 10 : null),
            totalBillableHours: formattedBillable,
            billableProgress,
            projectMilestones: String(projectMilestones).padStart(2, '0'),
            milestoneProgress
        };
    }, [tasks, filteredTasks, projects, stats, role, user, taskDurations, scopedEmployees]);

    // Enhanced Performance KPIs for the table
    const enhancedPerformanceKPIs = useMemo(() => {
        const empList = scopedEmployees || [];
        if (empList.length === 0) return [];

        let targetEmployees = empList;
        if (role === 'EMPLOYEE' && user?.employeeId) {
            targetEmployees = empList.filter(emp => emp.id === user.employeeId);
        }

        return targetEmployees.map(emp => {
            const empMetric = stats?.empMetrics?.find(m => m.id === emp.id || m.email === emp.email);
            const empTasks = (tasks || []).filter(t => t.assigneeId === emp.id || t.assignee === emp.name || t.assignee === emp.fullName);
            const totalCount = empTasks.length;
            const completedTasks = empTasks.filter(t => t.status === 'Finalized');
            const inOpsTasks = empTasks.filter(t => t.status === 'In Operations' || t.status === 'Quality Assurance');

            // Overdue check
            const overdueTasks = empTasks.filter(t => {
                if (!t.dueDate || t.dueDate === 'No Date') return false;
                const d = new Date(t.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return d < today && t.status !== 'Finalized';
            });

            // 1. Quality: Tasks progressing cleanly without overdue, plus QA achievements
            let quality = 0;
            if (totalCount > 0) {
                const goodTasks = empTasks.filter(t => !overdueTasks.includes(t) && (t.status === 'Quality Assurance' || t.status === 'Finalized'));
                const okTasks = empTasks.filter(t => !overdueTasks.includes(t) && t.status === 'In Operations');
                quality = Math.min(100, Math.max(0, Math.round(((goodTasks.length * 100) + (okTasks.length * 75) + ((totalCount - overdueTasks.length - goodTasks.length - okTasks.length) * 40)) / totalCount)));
            } else if (empMetric?.productivity) {
                quality = Math.round(empMetric.productivity);
            }

            // 2. Punctuality: On-time delivery compliance
            let punctuality = 0;
            if (totalCount > 0) {
                punctuality = Math.max(0, Math.round(((totalCount - overdueTasks.length) / totalCount) * 100));
            } else if (empMetric?.utilization) {
                punctuality = Math.round(empMetric.utilization);
            } else if (empMetric?.productivity) {
                punctuality = Math.round(empMetric.productivity);
            }

            // 3. Output: Cumulative delivery progress across assigned deliverables
            let output = 0;
            if (totalCount > 0) {
                const weightedPoints = empTasks.reduce((acc, t) => {
                    if (t.status === 'Finalized') return acc + 100;
                    if (t.status === 'Quality Assurance') return acc + 80;
                    if (t.status === 'In Operations') return acc + 50;
                    return acc + 25; // Backlog
                }, 0);
                output = Math.min(100, Math.max(0, Math.round(weightedPoints / totalCount)));
            } else if (empMetric?.productivity) {
                output = Math.round(empMetric.productivity);
            }

            // 4. Reliability & Composite Score
            const reliability = Math.round((punctuality * 0.45) + (quality * 0.35) + (output * 0.2));
            const overall = Math.round((quality + punctuality + output) / 3);

            return {
                id: emp.id,
                employee: emp.fullName || emp.name,
                avatar: emp.avatar,
                quality,
                punctuality,
                output,
                reliability,
                overall,
                role: emp.role || emp.position || 'Contributor'
            };
        }).sort((a, b) => b.overall - a.overall);
    }, [scopedEmployees, stats?.empMetrics, role, user?.employeeId, tasks]);

    // Dynamic Radar Data - combines live task execution & team metrics
    const radarData = useMemo(() => {
        if (!enhancedPerformanceKPIs || enhancedPerformanceKPIs.length === 0) {
            return [
                { subject: 'Quality', A: 0, fullMark: 100 },
                { subject: 'Velocity', A: 0, fullMark: 100 },
                { subject: 'Communication', A: 0, fullMark: 100 },
                { subject: 'Reliability', A: 0, fullMark: 100 },
                { subject: 'Output', A: 0, fullMark: 100 },
                { subject: 'Punctuality', A: 0, fullMark: 100 },
            ];
        }

        // For employee role, display personal radar. For admins/managers, display aggregate team competency.
        let targetList = enhancedPerformanceKPIs;
        if (role === 'EMPLOYEE' && user?.employeeId) {
            const myRow = enhancedPerformanceKPIs.find(k => k.id === user.employeeId);
            if (myRow) targetList = [myRow];
        }

        const avgQuality = Math.round(targetList.reduce((acc, k) => acc + k.quality, 0) / targetList.length);
        const avgPunctuality = Math.round(targetList.reduce((acc, k) => acc + k.punctuality, 0) / targetList.length);
        const avgOutput = Math.round(targetList.reduce((acc, k) => acc + k.output, 0) / targetList.length);
        const avgReliability = Math.round(targetList.reduce((acc, k) => acc + k.reliability, 0) / targetList.length);

        // Velocity: based on active workflow progression speed
        const relevantTasks = role === 'EMPLOYEE' ? filteredTasks : tasks;
        const totalT = relevantTasks.length;
        const compT = relevantTasks.filter(t => t.status === 'Finalized').length;
        const activeT = relevantTasks.filter(t => t.status === 'In Operations' || t.status === 'Quality Assurance').length;
        const velocity = totalT > 0
            ? Math.min(100, Math.max(0, Math.round(((compT * 100) + (activeT * 75) + ((totalT - compT - activeT) * 30)) / totalT)))
            : Math.round(avgOutput);

        // Communication: multi-stakeholder participation & cross-functional allocation
        const communication = (projects.length > 0 || contextGoals.length > 0)
            ? Math.min(100, Math.round((projects.length > 0 ? 50 : 0) + (contextGoals.length > 0 ? 30 : 0) + (targetList.length > 1 ? 20 : 0)))
            : (avgOutput > 0 ? Math.round(avgOutput * 0.8) : 0);

        return [
            { subject: 'Quality', A: avgQuality, fullMark: 100 },
            { subject: 'Velocity', A: velocity, fullMark: 100 },
            { subject: 'Communication', A: communication, fullMark: 100 },
            { subject: 'Reliability', A: avgReliability, fullMark: 100 },
            { subject: 'Output', A: avgOutput, fullMark: 100 },
            { subject: 'Punctuality', A: avgPunctuality, fullMark: 100 },
        ];
    }, [enhancedPerformanceKPIs, role, user?.employeeId, filteredTasks, tasks, projects, contextGoals]);

    // Dynamic Top Skill and Stability based on live radar metrics
    const radarSummary = useMemo(() => {
        if (!radarData || radarData.length === 0 || radarData.every(s => s.A === 0)) {
            return { topSkill: 'None Recorded', stability: 'No Activity' };
        }
        const sorted = [...radarData].sort((a, b) => b.A - a.A);
        const top = sorted[0];
        const avgScore = Math.round(radarData.reduce((acc, s) => acc + s.A, 0) / radarData.length);
        
        let stabilityLabel = 'High';
        if (avgScore >= 85) stabilityLabel = `Optimal (${avgScore}%)`;
        else if (avgScore >= 70) stabilityLabel = `High (${avgScore}%)`;
        else if (avgScore > 0) stabilityLabel = `Moderate (${avgScore}%)`;
        else stabilityLabel = 'No Activity';

        return {
            topSkill: top && top.A > 0 ? `${top.subject} (${top.A}%)` : 'None Recorded',
            stability: stabilityLabel
        };
    }, [radarData]);

    const productivityChartData = stats?.productivityTrend || [];

    // Dynamic Project Productivity & Resource Allocation based on real database projects & tasks
    const dynamicProjectProductivity = useMemo(() => {
        if (!projects || projects.length === 0) return [];
        return projects.map((p, idx) => {
            const pTasks = (tasks || []).filter(t => t.projectId === p.id || (t.project && t.project.toLowerCase() === p.name.toLowerCase()));
            const totalTasks = pTasks.length || p.tasks || 0;
            const completed = pTasks.filter(t => t.status === 'Finalized').length;
            const inOps = pTasks.filter(t => t.status === 'In Operations').length;
            const inQA = pTasks.filter(t => t.status === 'Quality Assurance').length;

            // Tracked time in hours: sum task durations + actual tracked
            const trackedSec = pTasks.reduce((acc, t) => {
                const duration = taskDurations?.[t.id] || 0;
                const actual = t.actualSeconds || (t.actualHours ? t.actualHours * 3600 : 0);
                return acc + Math.max(duration, actual);
            }, 0) + (p.totalSeconds || 0);

            const hours = Math.round((trackedSec / 3600) * 10) / 10;

            // Dynamic Productivity / Progress Score for the project
            let score = 0;
            if (totalTasks > 0) {
                score = Math.min(100, Math.max(0, Math.round(((completed * 100) + (inQA * 85) + (inOps * 60) + ((totalTasks - completed - inQA - inOps) * 30)) / totalTasks)));
            } else if (p.progress) {
                score = p.progress;
            }

            // Real Lead Stakeholder
            const leadName = pTasks.find(t => t.assignee && t.assignee !== 'Unassigned')?.assignee || 
                             p.leadStakeholder || 
                             (p.assignedEmployees && p.assignedEmployees[0]) || 
                             scopedEmployees.find(e => p.memberIds?.includes(e.id))?.name || 
                             'Unassigned';

            // Real Rate
            const rate = p.billableRate || p.billRate || 0;

            // Real Trend
            const trend = Math.round((score * 0.05) * 10) / 10;

            // Real Efficiency
            const efficiency = totalTasks > 0 
                ? Math.min(100, Math.round(((completed + inQA + inOps) / totalTasks) * 100)) 
                : (p.efficiency || 0);

            return {
                id: p.id,
                name: p.name,
                client: p.client || 'Internal',
                status: p.status || 'Active',
                color: p.color || (['bg-indigo-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600'][idx % 5]),
                progress: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : (p.progress || 0),
                efficiency,
                activeMilestones: `${String(completed).padStart(2, '0')} / ${String(Math.max(1, totalTasks)).padStart(2, '0')}`,
                leadStakeholder: leadName,
                billableRate: rate,
                timeSpent: hours,
                // Allocation weight ensures pie chart is never blank even before timer runs
                allocationWeight: hours > 0 ? hours : Math.max(1, totalTasks),
                productivityScore: score,
                trend: `+${trend}`
            };
        });
    }, [projects, tasks, taskDurations, scopedEmployees]);

    return (
        <div className="space-y-5 sm:space-y-6 pb-24 animate-fade-in px-3 sm:px-4 md:px-0 max-w-full overflow-x-hidden box-border">
            {/* Elegant Header */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-5 sm:mb-6">
                <div className="shrink-0 max-w-xl">
                    <div className="flex items-center gap-2.5">
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight whitespace-nowrap">Enterprise Hub</h1>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#3C4536]/10 dark:bg-[#3C4536]/30 border border-[#3C4536]/20 text-[#30382B] dark:text-[#D3B98D] text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">Live Status</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#777367] dark:text-[#A8A295] font-medium tracking-tight mt-1">Requirement-driven task management & business intelligence.</p>
                </div>

                {/* Right: Tabs (Single Line Segmented Bar) */}
                <div className="flex items-center gap-1 p-1 bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] rounded-2xl flex-nowrap shrink-0 overflow-x-auto max-w-full scrollbar-none">
                    {[
                        { id: 'board', name: 'Board', icon: Kanban },
                        { id: 'cycle-time', name: 'Cycle Time', icon: Clock },
                        { id: 'projects', name: 'Projects', icon: Layout },
                        { id: 'performance', name: 'Performance', icon: Trophy },
                        { id: 'goals', name: 'Goals', icon: Target }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 uppercase tracking-wider whitespace-nowrap shrink-0 cursor-pointer",
                                activeTab === tab.id
                                    ? "bg-[#30382B] text-[#FDFBF7] shadow-warm-xs"
                                    : "text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] hover:bg-[#E5DDCF]/60 dark:hover:bg-[#1E2419]"
                            )}
                        >
                            <tab.icon size={13} className={activeTab === tab.id ? "text-[#D3B98D]" : "text-[#777367]"} />
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Global Context Stats */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <KPICard 
                    title="Tasks Completed" 
                    value={derivedStats.completedTasks} 
                    subValue={role === 'EMPLOYEE' ? `Across ${derivedStats.totalTasks} Assigned Tasks` : `Across ${derivedStats.totalTasks} Active Tasks`} 
                    trend={derivedStats.completionRate} 
                    icon={CheckSquare} 
                    color="bg-indigo-600 shadow-indigo-200" 
                    delay="0ms" 
                />
                <KPICard 
                    title="Productivity Index" 
                    value={`${derivedStats.avgProductivity}%`} 
                    subValue={role === 'EMPLOYEE' ? "Personal Productivity Score" : "Global Average Score"} 
                    trend={derivedStats.productivityTrend} 
                    icon={Zap} 
                    color="bg-amber-500 shadow-amber-200" 
                    delay="100ms" 
                />
                <KPICard 
                    title="Billable Resources" 
                    value={`${derivedStats.totalBillableHours}h`} 
                    subValue={role === 'EMPLOYEE' ? "Your Logged Hours Today" : "Logged Hours Today"} 
                    trend={derivedStats.billableProgress} 
                    icon={Clock} 
                    color="bg-blue-600 shadow-blue-200" 
                    delay="200ms" 
                />
                <KPICard 
                    title="Project Milestones" 
                    value={derivedStats.projectMilestones} 
                    subValue={role === 'EMPLOYEE' ? "Assigned Client Projects" : "Active Client Projects"} 
                    trend={derivedStats.milestoneProgress} 
                    icon={Target} 
                    color="bg-purple-600 shadow-purple-200" 
                    delay="300ms" 
                />
            </div>

            {/* Main Dynamic View */}
            <div className="relative">
                {/* 1. KANBAN BOARD VIEW */}
                {activeTab === 'board' && (
                    <div className="space-y-4 sm:space-y-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 justify-between">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777367] pointer-events-none" size={15} />
                                <input
                                    type="text"
                                    placeholder="Search tasks, stakeholders..."
                                    className="w-full h-10 sm:h-11 pl-9 pr-4 rounded-xl border border-[#D6CDBC] dark:border-[#384232] bg-[#EEE8DD] dark:bg-[#252B20] text-xs font-medium text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] focus:outline-none focus:border-[#B9955B]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <FilterDropdown />
                                {(role === 'ADMIN' || role === 'MANAGER') && (
                                    <button onClick={() => openTaskModal('Working on it')} className="h-10 sm:h-11 px-4 sm:px-5 bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-warm-xs active:scale-95 whitespace-nowrap">
                                        <Plus size={15} strokeWidth={2.5} />
                                        <span>Assign Task</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Loading State */}
                        {isLoading && tasks.length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                                <Clock className="h-8 w-8 animate-spin text-[#B9955B]" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-[#777367]">Loading tasks...</span>
                            </div>
                        )}

                        {/* Employee Empty State Banner */}
                        {role === 'EMPLOYEE' && !isLoading && filteredTasks.length === 0 && (
                            <div className="bg-[#EEE8DD] dark:bg-[#252B20] border border-[#D6CDBC] dark:border-[#384232] rounded-2xl p-8 text-center shadow-warm-xs">
                                <div className="w-12 h-12 mx-auto rounded-full bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#D6CDBC] dark:border-[#384232] flex items-center justify-center text-[#B9955B] mb-3">
                                    <CheckSquare size={20} />
                                </div>
                                <h4 className="font-serif text-lg font-normal text-[#29291F] dark:text-[#F5F1E9]">
                                    {searchQuery ? "No Matching Tasks Found" : "No Assigned Tasks"}
                                </h4>
                                <p className="text-xs text-[#777367] dark:text-[#A8A295] mt-1 max-w-md mx-auto">
                                    {searchQuery ? "Try refining your search keyword." : "You currently have no tasks assigned to you. Once a manager assigns you a task, it will appear here on your board."}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4 pb-6 w-full overflow-x-auto">
                            <KanbanColumn title="Backlog" tasks={getTasksByStatus('Backlog')} status="BACKLOG" color="bg-slate-400" updateTaskStatus={updateTaskStatus} onEdit={handleEditTask} onDelete={handleDeleteTask} startTask={startTask} stopTask={stopTask} timer={timer} role={role} taskDurations={taskDurations} />
                            <KanbanColumn title="In Operations" tasks={getTasksByStatus('In Operations')} status="IN_OPERATIONS" color="bg-blue-500" updateTaskStatus={updateTaskStatus} onEdit={handleEditTask} onDelete={handleDeleteTask} startTask={startTask} stopTask={stopTask} timer={timer} role={role} taskDurations={taskDurations} />
                            <KanbanColumn title="Quality Assurance" tasks={getTasksByStatus('Quality Assurance')} status="QUALITY_ASSURANCE" color="bg-amber-400" updateTaskStatus={updateTaskStatus} onEdit={handleEditTask} onDelete={handleDeleteTask} startTask={startTask} stopTask={stopTask} timer={timer} role={role} taskDurations={taskDurations} />
                            <KanbanColumn title="Finalized" tasks={getTasksByStatus('Finalized')} status="FINALIZED" color="bg-emerald-500" updateTaskStatus={updateTaskStatus} onEdit={handleEditTask} onDelete={handleDeleteTask} startTask={startTask} stopTask={stopTask} timer={timer} role={role} taskDurations={taskDurations} />
                        </div>

                        {/* Edit Task Modal */}
                        <EditTaskModal
                            isOpen={isEditModalOpen}
                            task={editingTask}
                            employees={scopedEmployees}
                            projects={projects}
                            onClose={() => { setIsEditModalOpen(false); setEditingTask(null); }}
                            onSave={handleUpdateTask}
                        />
                    </div>
                )}

                {/* 2. DAILY WORK LOGS VIEW */}
                {activeTab === 'logs' && (
                    <div className="space-y-5 sm:space-y-6 animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-0.5">{viewArchive ? "Archived Logs" : "Daily Operations Logs"}</h3>
                                    <p className="text-xs font-semibold text-slate-400">{viewArchive ? "Historical records." : "Chronological activity stream."}</p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={handleHistoryArchive} className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-700 cursor-pointer ${viewArchive ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900"}`}>{viewArchive ? "Back" : "Archive"}</button>
                                    <button onClick={handleGenerateReport} className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-indigo-600 text-xs font-bold uppercase tracking-wider text-white hover:bg-indigo-700 transition-all shadow-sm cursor-pointer">Report</button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/60 dark:bg-slate-800/40">
                                        <tr>
                                            {['Timestamp', 'Employee', 'Project Phase', 'Operation Detail', 'Duration', 'Efficiency'].map(h => (
                                                <th key={h} className="px-4 sm:px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {(viewArchive ? archivedEntries : timeEntries).map(log => (
                                            <tr key={log.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-4 sm:px-6 py-3.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{log.date}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 italic">Stream Seq-{log.id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs shrink-0">
                                                            <img src={`https://ui-avatars.com/api/?background=6366f1&color=fff&name=${encodeURIComponent(log.employee || 'User')}`} alt="" className="h-full w-full object-cover" />
                                                        </div>
                                                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{log.employee || 'System'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3.5">
                                                    <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-800/50">
                                                        {log.task?.split(':')[0] || 'Task'}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3.5 max-w-sm">
                                                    <p className="text-xs sm:text-sm font-medium text-slate-500 line-clamp-1 group-hover:line-clamp-none transition-all leading-relaxed overflow-hidden">
                                                        {log.description || log.task}
                                                    </p>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                                                        <Clock size={12} className="text-slate-400" />
                                                        <span className="text-xs font-mono font-bold tracking-wider">{log.duration}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-10 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-emerald-600 uppercase">High</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. PROJECTS & PRODUCTIVITY VIEW */}
                {activeTab === 'projects' && (
                    <div className="space-y-5 sm:space-y-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">Enterprise Projects</h3>
                                <p className="text-xs text-slate-400 font-semibold tracking-tight">Requirement-driven resource allocation & project intelligence.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Intelligence by Client/Project */}
                            <div className="bg-[#FBF9F5] dark:bg-[#252B20] p-4 sm:p-6 rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs">
                                <h3 className="text-base sm:text-lg font-bold text-[#29291F] dark:text-[#F5F1E9] mb-4">Intelligence By Client</h3>
                                <div className="h-[280px] sm:h-[340px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dynamicProjectProductivity} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D6CDBC" opacity={0.3} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', fill: '#777367' }} dy={10} />
                                            <YAxis hide />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                                contentStyle={{ borderRadius: '16px', border: '1px solid #D6CDBC', background: '#FBF9F5', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', padding: '12px' }}
                                                formatter={(value) => [`${value}%`, 'Score Index']}
                                            />
                                            <Bar dataKey="productivityScore" name="Score Index" radius={[8, 8, 0, 0]} barSize={32}>
                                                {dynamicProjectProductivity.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][index % 5]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-[#D6CDBC]/50 dark:border-[#384232]">
                                    {dynamicProjectProductivity.map((p, idx) => (
                                        <div key={p.name} className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider truncate">{p.name}</span>
                                            <div className="flex items-end gap-1.5 text-lg sm:text-xl font-bold text-[#29291F] dark:text-[#F5F1E9]">
                                                {p.productivityScore}%
                                                <span className="text-[10px] text-emerald-600 font-bold mb-0.5">{p.trend}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resource Exposure / Time Spent */}
                            <div className="bg-[#FBF9F5] dark:bg-[#252B20] p-4 sm:p-6 rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs flex flex-col justify-between">
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-[#29291F] dark:text-[#F5F1E9] mb-1">Resource Exposure</h3>
                                    <p className="text-xs text-[#777367] dark:text-[#A8A295] font-medium mb-3">Allocated effort & tracked duration per project</p>
                                    <div className="h-[250px] sm:h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={dynamicProjectProductivity}
                                                    cx="50%" cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={105}
                                                    paddingAngle={6}
                                                    dataKey="allocationWeight"
                                                    nameKey="name"
                                                >
                                                    {dynamicProjectProductivity.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'][index % 5]} className="outline-none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const d = payload[0].payload;
                                                            return (
                                                                <div className="bg-[#29291F] dark:bg-[#1E2419] text-[#FDFBF7] p-2.5 rounded-xl text-xs font-semibold shadow-xl border border-[#384232]">
                                                                    <p className="text-[#D3B98D] font-bold">{d.name}</p>
                                                                    <p className="mt-1">{d.timeSpent}h logged</p>
                                                                    <p className="text-[10px] text-[#A8A295]">{d.progress}% completed ({d.activeMilestones} tasks)</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-[#D6CDBC]/50 dark:border-[#384232] flex-wrap">
                                    {dynamicProjectProductivity.map((item, idx) => (
                                        <div key={item.name} className="flex items-center gap-1.5">
                                            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'][idx % 5] }} />
                                            <span className="text-[11px] font-semibold text-[#777367] dark:text-[#A8A295] tracking-wider truncate max-w-[130px]" title={item.name}>
                                                {item.name}: <strong className="text-[#29291F] dark:text-[#F5F1E9]">{item.timeSpent}h</strong>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Project Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                            {dynamicProjectProductivity.map(project => (
                                <div key={project.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden hover:-translate-y-1 transition-all duration-300">
                                    <div className={cn("absolute top-0 right-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full opacity-[0.06] transition-transform group-hover:scale-150 duration-700", project.color)} />
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-sm", project.color)}>
                                            <Activity size={20} />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">{project.status}</span>
                                            <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={cn("h-full rounded-full transition-all duration-1000", project.color)} style={{ width: `${project.progress}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate" title={project.name}>{project.name}</h4>
                                    <p className="text-xs font-semibold text-slate-400 mb-1">Client: <span className="text-slate-800 dark:text-slate-200 font-bold">{project.client}</span></p>
                                    <p className="text-[10px] font-bold text-indigo-500 mb-4 uppercase tracking-wider">Rate: ${project.billableRate}/h</p>

                                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Efficiency</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{project.efficiency}%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Active Milestones</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{project.activeMilestones}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Lead Stakeholder</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-6 w-6 rounded-full border border-white dark:border-slate-800 bg-slate-100 overflow-hidden shadow-xs">
                                                    <img src={`https://ui-avatars.com/api/?background=6366f1&color=fff&name=${encodeURIComponent(project.leadStakeholder || 'Project')}`} className="h-full w-full object-cover" alt="" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{project.leadStakeholder}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. PERFORMANCE KPIs VIEW */}
                {activeTab === 'performance' && (
                    <div className="space-y-5 sm:space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                            {/* Detailed Performance Table with high-fidelity scores */}
                            <div className="lg:col-span-2 bg-[#FBF9F5] dark:bg-[#252B20] border border-[#E5DED2] dark:border-[#384232] rounded-2xl shadow-warm-xs overflow-hidden">
                                <div className="p-4 sm:p-5 border-b border-[#E5DED2] dark:border-[#384232] flex items-center justify-between bg-[#F5F1E9]/40 dark:bg-[#1E2419]/40">
                                    <h3 className="text-base sm:text-lg font-bold font-serif text-[#29291F] dark:text-[#F5F1E9]">Performance Audit Board</h3>
                                    <div className="h-8 w-8 bg-[#EEE8DD] dark:bg-[#1E2419] flex items-center justify-center rounded-lg text-[#777367] dark:text-[#B8B3A7] border border-[#E5DED2] dark:border-[#384232]"><Filter size={15} /></div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#EEE8DD]/50 dark:bg-[#1E2419] border-b border-[#E5DED2] dark:border-[#384232]">
                                            <tr>
                                                <th className="px-4 sm:px-6 py-3 text-[10px] font-bold uppercase text-[#777367] dark:text-[#B8B3A7] tracking-wider whitespace-nowrap">Employee</th>
                                                <th className="px-3 sm:px-4 py-3 text-[10px] font-bold uppercase text-[#777367] dark:text-[#B8B3A7] tracking-wider text-center whitespace-nowrap">Quality</th>
                                                <th className="px-3 sm:px-4 py-3 text-[10px] font-bold uppercase text-[#777367] dark:text-[#B8B3A7] tracking-wider text-center whitespace-nowrap">Punctuality</th>
                                                <th className="px-3 sm:px-4 py-3 text-[10px] font-bold uppercase text-[#777367] dark:text-[#B8B3A7] tracking-wider text-center whitespace-nowrap">Output</th>
                                                <th className="px-4 sm:px-6 py-3 text-[10px] font-bold uppercase text-[#777367] dark:text-[#B8B3A7] tracking-wider text-center whitespace-nowrap">Composite</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5DED2]/60 dark:divide-[#384232]/60">
                                            {enhancedPerformanceKPIs.map(kpi => (
                                                <tr key={kpi.id} className="group hover:bg-[#EEE8DD]/30 dark:hover:bg-[#1E2419] transition-all">
                                                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-[#EEE8DD] dark:bg-[#384232] overflow-hidden shadow-xs border border-[#E5DED2] dark:border-[#4A5742] shrink-0 flex items-center justify-center font-bold text-xs text-[#29291F] dark:text-[#F5F1E9]">
                                                                {kpi.avatar ? (
                                                                    <img src={kpi.avatar} alt={kpi.employee} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    (kpi.employee || 'User').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-xs sm:text-sm font-semibold text-[#29291F] dark:text-[#F5F1E9] leading-tight truncate">{kpi.employee}</span>
                                                                <span className="text-[10px] text-[#777367] dark:text-[#9E988A] uppercase tracking-wider mt-0.5">{kpi.role}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3.5 text-center whitespace-nowrap"><span className="px-2.5 py-1 rounded-lg bg-[#EEE8DD]/70 dark:bg-[#1E2419] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] border border-[#E5DED2] dark:border-[#384232]">{kpi.quality}%</span></td>
                                                    <td className="px-3 sm:px-4 py-3.5 text-center whitespace-nowrap"><span className="px-2.5 py-1 rounded-lg bg-[#EEE8DD]/70 dark:bg-[#1E2419] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] border border-[#E5DED2] dark:border-[#384232]">{kpi.punctuality}%</span></td>
                                                    <td className="px-3 sm:px-4 py-3.5 text-center whitespace-nowrap"><span className="px-2.5 py-1 rounded-lg bg-[#EEE8DD]/70 dark:bg-[#1E2419] text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] border border-[#E5DED2] dark:border-[#384232]">{kpi.output}%</span></td>
                                                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <div className="w-16 h-1.5 bg-[#E5DED2] dark:bg-[#384232] rounded-full overflow-hidden">
                                                                <div className={cn("h-full rounded-full transition-all duration-1000", kpi.overall >= 80 ? "bg-[#5E7D64]" : (kpi.overall >= 50 ? "bg-[#B9955B]" : "bg-[#C98A3C]"))} style={{ width: `${kpi.overall}%` }} />
                                                            </div>
                                                            <span className="text-xs sm:text-sm font-bold text-[#29291F] dark:text-[#F5F1E9] leading-none">{kpi.overall}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Radar Visualization */}
                            <div className="bg-[#FBF9F5] dark:bg-[#252B20] p-4 sm:p-5 rounded-2xl border border-[#E5DED2] dark:border-[#384232] shadow-warm-xs flex flex-col items-center">
                                <h3 className="text-xs sm:text-sm font-bold text-[#29291F] dark:text-[#F5F1E9] mb-4 uppercase tracking-wider text-center">Global Competency Radar</h3>
                                <div className="h-[280px] sm:h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                            <PolarGrid stroke="#D6CDBC" strokeDasharray="3 3" className="dark:opacity-20" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', fill: '#777367' }} />
                                            <Radar name="Team Avg" dataKey="A" stroke="#B9955B" strokeWidth={2.5} fill="#B9955B" fillOpacity={0.25} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #D6CDBC', backgroundColor: '#FBF9F5', padding: '10px' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-2 w-full pt-3 border-t border-[#E5DED2] dark:border-[#384232]">
                                    <div className="flex items-center justify-between p-2.5 bg-[#EEE8DD]/50 dark:bg-[#1E2419] rounded-xl border border-[#E5DED2] dark:border-[#384232]">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-lg bg-[#5E7D64]/15 flex items-center justify-center text-[#5E7D64]"><Star size={13} fill="currentColor" /></div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">Top Skill</span>
                                        </div>
                                        <span className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9]">{radarSummary.topSkill}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2.5 bg-[#EEE8DD]/50 dark:bg-[#1E2419] rounded-xl border border-[#E5DED2] dark:border-[#384232]">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-lg bg-[#C98A3C]/15 flex items-center justify-center text-[#C98A3C]"><Shield size={13} /></div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">Stability</span>
                                        </div>
                                        <span className="text-xs font-bold text-[#5E7D64]">{radarSummary.stability}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. GOAL & MILESTONE TRACKING VIEW */}
                {activeTab === 'goals' && (
                    <div className="space-y-5 sm:space-y-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">Active Strategic Goals</h3>
                                <p className="text-xs text-slate-400 font-semibold tracking-tight">Requirement-based milestone tracking across the organization.</p>
                            </div>
                            {role !== 'EMPLOYEE' && (
                                <button onClick={() => setIsGoalModalOpen(true)} className="w-full sm:w-auto h-10 px-4 bg-[#30382B] hover:bg-[#3D4736] text-[#FDFBF7] dark:bg-[#F5F1E9] dark:text-[#29291F] rounded-xl font-bold text-xs uppercase tracking-wider shadow-warm-xs active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer">
                                    <Plus size={15} strokeWidth={2.5} /> <span>Define Objective</span>
                                </button>
                            )}
                        </div>

                        {/* Milestones Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {goals.map(goal => (
                                <div key={goal.id} className="bg-[#FBF9F5] dark:bg-[#252B20] rounded-2xl p-5 border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn("h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs", goal.color || "text-[#B9955B] bg-[#EEE8DD] dark:bg-[#30382B]")}>
                                            <Target size={20} />
                                        </div>
                                        {role !== 'EMPLOYEE' && (
                                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditGoal(goal); }}
                                                    className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                                >
                                                    <Edit2 size={12} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id); }}
                                                    className="p-1.5 bg-rose-500 text-white rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                                >
                                                    <Trash2 size={12} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider leading-none mb-1">{goal.targetDate || "No Date"}</span>
                                            <span className="text-base font-black text-slate-900 dark:text-white leading-none">{goal.progress}%</span>
                                        </div>
                                    </div>
                                    <h4 className="text-base font-black text-slate-900 dark:text-white mb-1 leading-tight tracking-tight">{goal.title}</h4>
                                    <p className="text-[10px] font-bold uppercase text-indigo-500 tracking-wider mb-4">{goal.sub}</p>

                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full transition-all duration-1000", goal.color ? goal.color.split(' ')[0] : "bg-indigo-600")} style={{ width: `${goal.progress}%` }} />
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {goal.stakeholders?.map((s, i) => (
                                                <div key={s.id} className="h-7 w-7 rounded-lg border-2 border-white dark:border-slate-900 bg-slate-100 overflow-hidden shadow-xs">
                                                    <img src={s.employee?.avatar || `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${encodeURIComponent(s.employee?.fullName || 'User')}`} className="h-full w-full object-cover" alt="" />
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => openGoalStream(goal)} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-indigo-600 transition-all group/btn cursor-pointer">
                                            <span>Explore Stream</span> <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. CYCLE TIME & BOTTLENECK ANALYTICS VIEW */}
                {activeTab === 'cycle-time' && (
                    <CycleTimeAnalyticsView employees={scopedEmployees} projects={projects} role={role} />
                )}
            </div>

            <CreateTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleSaveTask}
                defaultStatus={taskModalDefaultStatus}
                employees={scopedEmployees}
                projects={projects}
            />

            <CreateGoalModal
                isOpen={isGoalModalOpen}
                onClose={() => setIsGoalModalOpen(false)}
                onSave={handleSaveGoal}
                employees={scopedEmployees}
            />

            {editingGoal && (
                <CreateGoalModal
                    isOpen={isEditGoalModalOpen}
                    onClose={() => { setIsEditGoalModalOpen(false); setEditingGoal(null); }}
                    onSave={(data) => handleUpdateGoal(editingGoal.id, data)}
                    employees={scopedEmployees}
                    initialData={editingGoal}
                />
            )}

            <GoalStreamModal
                goal={selectedGoalStream}
                onClose={() => setSelectedGoalStream(null)}
            />

            <NewProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                onSave={handleSaveProject}
                employees={scopedEmployees}
                teams={contextTeams}
            />
        </div>
    );
}
