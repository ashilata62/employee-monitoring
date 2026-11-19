import React, { useState, useEffect, useMemo } from 'react';
import {
    Clock,
    AlertTriangle,
    TrendingUp,
    CheckCircle2,
    Layers,
    Filter,
    RefreshCw,
    ShieldAlert,
    ArrowRight,
    Zap,
    Hourglass,
    Loader2
} from 'lucide-react';
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
    Pie
} from 'recharts';
import taskService from '../../services/taskService';
import { ExportDropdown } from '../common/ExportDropdown';
import { cn } from '../../utils/cn';

const STAGE_COLORS = {
    BACKLOG: '#94a3b8',
    IN_OPERATIONS: '#6366f1',
    QUALITY_ASSURANCE: '#f59e0b',
    FINALIZED: '#10b981',
};

export function CycleTimeAnalyticsView({ employees = [], projects = [] }) {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (selectedProject) params.projectId = selectedProject;
            if (selectedEmployee) params.employeeId = selectedEmployee;
            if (selectedStatus) params.status = selectedStatus;

            const res = await taskService.getCycleTimeAnalytics(params);
            setAnalytics(res.data || null);
        } catch (err) {
            console.error('Failed to load cycle time analytics:', err);
            setError(err.message || 'Failed to load cycle time analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [selectedProject, selectedEmployee, selectedStatus]);

    const barChartData = useMemo(() => {
        if (!analytics?.averageStageDuration) return [];
        return analytics.averageStageDuration.map(s => ({
            name: s.label,
            stage: s.stage,
            days: s.days,
            hours: s.hours,
            tasks: s.tasksThroughStage,
            fill: STAGE_COLORS[s.stage] || '#6366f1'
        }));
    }, [analytics]);

    const pieChartData = useMemo(() => {
        if (!analytics?.stageDistribution) return [];
        return analytics.stageDistribution.map(s => ({
            name: s.label,
            value: s.percentage,
            hours: s.hours,
            fill: STAGE_COLORS[s.stage] || '#6366f1'
        }));
    }, [analytics]);

    const exportData = useMemo(() => {
        if (!analytics?.taskMetrics) return [];
        return analytics.taskMetrics.map(t => ({
            title: t.title,
            status: t.status,
            priority: t.priority,
            project: t.project,
            assignee: t.assignee,
            backlogDays: `${t.stageDurations.BACKLOG.days}d`,
            operationsDays: `${t.stageDurations.IN_OPERATIONS.days}d`,
            qaDays: `${t.stageDurations.QUALITY_ASSURANCE.days}d`,
            cycleTimeDays: `${t.cycleTime.days}d (${t.cycleTime.hours}h)`,
        }));
    }, [analytics]);

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Header / Filter Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50">
                        <Clock size={18} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                            Workflow Bottleneck & Cycle Time Analytics
                        </h2>
                        <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                            Track stage duration from Backlog through Operations, QA, to Finalization.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto">
                    {/* Project Filter */}
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="h-9 px-2.5 sm:px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none flex-1 sm:flex-none min-w-[120px] cursor-pointer"
                    >
                        <option value="">All Projects</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    {/* Employee Filter */}
                    <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="h-9 px-2.5 sm:px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none flex-1 sm:flex-none min-w-[120px] cursor-pointer"
                    >
                        <option value="">All Assignees</option>
                        {employees.map(e => (
                            <option key={e.id} value={e.id}>{e.name || e.fullName}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="h-9 px-2.5 sm:px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none flex-1 sm:flex-none min-w-[110px] cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        <option value="BACKLOG">Backlog</option>
                        <option value="IN_OPERATIONS">In Operations</option>
                        <option value="QUALITY_ASSURANCE">Quality Assurance</option>
                        <option value="FINALIZED">Finalized</option>
                    </select>

                    <button
                        onClick={fetchAnalytics}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                        title="Refresh analytics"
                    >
                        <RefreshCw size={14} />
                    </button>

                    <ExportDropdown
                        className="shrink-0"
                        data={exportData}
                        columns={[
                            { header: 'Task Name', key: 'title' },
                            { header: 'Current Status', key: 'status' },
                            { header: 'Priority', key: 'priority' },
                            { header: 'Project', key: 'project' },
                            { header: 'Assignee', key: 'assignee' },
                            { header: 'Backlog Duration', key: 'backlogDays' },
                            { header: 'Operations Duration', key: 'operationsDays' },
                            { header: 'QA Duration', key: 'qaDays' },
                            { header: 'Total Cycle Time', key: 'cycleTimeDays' },
                        ]}
                        fileName="workflow-cycle-time-analytics"
                        metadata={{
                            title: 'Workflow Cycle Time & Bottleneck Report',
                            dateRange: new Date().toLocaleDateString(),
                            filters: `Project: ${selectedProject || 'All'}, Assignee: ${selectedEmployee || 'All'}`
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : error ? (
                <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 rounded-[2rem] border border-rose-200 dark:border-rose-900/40 text-rose-600">
                    <AlertTriangle className="mx-auto mb-2" size={32} />
                    <p className="font-bold">{error}</p>
                </div>
            ) : (
                <>
                    {/* Top KPI Cards */}
                    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                        {/* Total Cycle Time */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Avg Cycle Time</span>
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                                    <Clock size={16} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                                    {analytics?.averageCycleTime?.days || 0}
                                </span>
                                <span className="text-xs font-semibold text-slate-400">days ({analytics?.averageCycleTime?.hours || 0}h)</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">Active start to completion</p>
                        </div>

                        {/* Bottleneck Stage */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Primary Bottleneck</span>
                                <div className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                                    <AlertTriangle size={16} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200 truncate">
                                    {analytics?.bottleneckStage?.label || 'None Detected'}
                                </span>
                            </div>
                            <p className="text-[10px] text-amber-700/80 dark:text-amber-400 font-medium mt-1 truncate">
                                Avg {analytics?.bottleneckStage?.days || 0} days spent in this stage
                            </p>
                        </div>

                        {/* Completed Tasks */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tasks Completed</span>
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 size={16} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                                    {analytics?.completedTasksCount || 0}
                                </span>
                                <span className="text-xs font-semibold text-slate-400">of {analytics?.tasksAnalyzed || 0} tasks</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">Finalized workflow items</p>
                        </div>

                        {/* Workflow Efficiency */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operations Focus</span>
                                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                    <TrendingUp size={16} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                                    {analytics?.stageDistribution?.find(s => s.stage === 'IN_OPERATIONS')?.percentage || 0}%
                                </span>
                                <span className="text-xs font-semibold text-slate-400">active effort</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">Share of active workflow</p>
                        </div>
                    </div>

                    {/* Bottleneck Alert Banner */}
                    {analytics?.bottleneckStage && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                            <ShieldAlert className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
                                    Workflow Delay Detected in: {analytics.bottleneckStage.label}
                                </h4>
                                <p className="text-xs text-amber-800/90 dark:text-amber-300 font-medium mt-0.5 leading-relaxed">
                                    Tasks spend an average of <span className="font-bold">{analytics.bottleneckStage.days} days ({analytics.bottleneckStage.hours} hours)</span> in the {analytics.bottleneckStage.label} stage before transitioning.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Visualizations Grid */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
                        {/* Bar Chart: Stage Duration */}
                        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                                        Average Duration per Workflow Stage
                                    </h3>
                                    <p className="text-xs text-slate-400 font-semibold">Measured in elapsed days</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stage Duration</span>
                                </div>
                            </div>

                            <div className="h-56 sm:h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                            unit="d"
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs font-bold border border-slate-800">
                                                            <p className="text-indigo-400 font-black">{data.name}</p>
                                                            <p className="mt-1">{data.days} days ({data.hours} hours)</p>
                                                            <p className="text-[10px] text-slate-400">{data.tasks} tasks analyzed</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="days" radius={[8, 8, 0, 0]}>
                                            {barChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart: Stage Distribution */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-0.5">
                                    Cycle Time Distribution
                                </h3>
                                <p className="text-xs text-slate-400 font-semibold mb-3">Share of active workflow time</p>

                                <div className="h-40 w-full relative flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={65}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`pie-cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs font-bold">
                                                                <p style={{ color: data.fill }}>{data.name}</p>
                                                                <p className="mt-0.5">{data.value}% ({data.hours}h)</p>
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

                            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                                {pieChartData.map(item => (
                                    <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                                            <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                                        </div>
                                        <span className="text-slate-900 dark:text-white font-bold">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Task Breakdown Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                                    Individual Task Stage Breakdown
                                </h3>
                                <p className="text-xs text-slate-400 font-semibold">
                                    Duration spent across each workflow stage
                                </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500">
                                {analytics?.taskMetrics?.length || 0} Tasks
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        <th className="py-3 px-6">Task</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Project</th>
                                        <th className="py-3 px-4">Assignee</th>
                                        <th className="py-3 px-4 text-center">Backlog</th>
                                        <th className="py-3 px-4 text-center">Operations</th>
                                        <th className="py-3 px-4 text-center">QA</th>
                                        <th className="py-3 px-6 text-right">Cycle Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                    {analytics?.taskMetrics?.map(task => (
                                        <tr key={task.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                {task.title}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                                    task.status === 'FINALIZED' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" :
                                                    task.status === 'IN_OPERATIONS' ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30" :
                                                    task.status === 'QUALITY_ASSURANCE' ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30" :
                                                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                )}>
                                                    {task.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-slate-500 font-semibold">{task.project}</td>
                                            <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-semibold">{task.assignee}</td>
                                            <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400 font-bold">
                                                {task.stageDurations.BACKLOG.days}d
                                            </td>
                                            <td className="py-4 px-4 text-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                {task.stageDurations.IN_OPERATIONS.days}d
                                            </td>
                                            <td className="py-4 px-4 text-center text-amber-600 dark:text-amber-400 font-bold">
                                                {task.stageDurations.QUALITY_ASSURANCE.days}d
                                            </td>
                                            <td className="py-4 px-6 text-right font-black text-slate-900 dark:text-white">
                                                {task.cycleTime.days}d ({task.cycleTime.hours}h)
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default CycleTimeAnalyticsView;
