import React, { useState, useEffect } from 'react';
import { 
    GitBranch, 
    ArrowRight, 
    Clock, 
    AlertTriangle, 
    Zap, 
    Layers, 
    Download, 
    RefreshCw, 
    CheckCircle2, 
    Activity, 
    HelpCircle, 
    Filter 
} from 'lucide-react';
import api from '../../services/apiClient';
import { toast } from '../../utils/toastManager';
import { cn } from '../../utils/cn';

export default function ProcessMining() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState('graph'); // 'graph' | 'bottlenecks' | 'variants' | 'apps'

    const fetchDiscovery = async () => {
        try {
            setLoading(true);
            const res = await api.get('/process-mining/discovery');
            if (res.data?.success) {
                setData(res.data.data);
            } else {
                toast.error(res.data?.message || 'Failed to fetch process mining data');
            }
        } catch (err) {
            console.error('Process Mining fetch error:', err);
            toast.error(err.response?.data?.message || err.message || 'Error connecting to Process Mining engine');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscovery();
        const interval = setInterval(fetchDiscovery, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleExport = async () => {
        try {
            setExporting(true);
            const res = await api.get('/process-mining/export');
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `process_mining_audit_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Process mining report exported successfully!');
        } catch (err) {
            toast.error('Failed to export process report: ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
                <RefreshCw className="animate-spin text-primary-600" size={36} />
                <p className="text-sm font-semibold text-slate-500">Discovering automated process graphs from event logs...</p>
            </div>
        );
    }

    const summary = data?.summary || {};
    const nodes = data?.processGraph?.nodes || [];
    const edges = data?.processGraph?.edges || [];
    const bottlenecks = data?.bottlenecks || [];
    const variants = data?.variants || [];
    const applicationHandoffs = data?.applicationHandoffs || [];

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                            <GitBranch size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Automated Process Mining
                            </h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                Discovers real workflow transition topologies, cycle bottlenecks, and process cycle efficiency (PCE).
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchDiscovery}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <RefreshCw size={14} /> Refresh Logs
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-primary-500/20 transition-all"
                    >
                        <Download size={14} /> {exporting ? 'Exporting...' : 'Export Audit Report'}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-black uppercase tracking-wider">Cases Mined</span>
                        <Layers size={16} className="text-indigo-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {summary.totalCasesMined || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                        {summary.activeWorkflows || 0} active, {summary.completedWorkflows || 0} finalized
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-black uppercase tracking-wider">Cycle Efficiency (PCE)</span>
                        <Zap size={16} className="text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {summary.processCycleEfficiency || '0%'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                        Active Time / Total Lead Time
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-black uppercase tracking-wider">Avg Lead Time</span>
                        <Clock size={16} className="text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {summary.averageLeadTime || '0.0 hours'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                        Initiation to final delivery
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-black uppercase tracking-wider">Rework Rate</span>
                        <AlertTriangle size={16} className="text-rose-500" />
                    </div>
                    <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                        {summary.reworkRate || '0%'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                        Backward QA / reject loops
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-black uppercase tracking-wider">Maturity Score</span>
                        <CheckCircle2 size={16} className="text-primary-600" />
                    </div>
                    <div className="text-2xl font-black text-primary-600 dark:text-primary-400">
                        {(summary.processMaturityScore ?? 0)}/100
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                        Operational health index
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
                {[
                    { id: 'graph', label: 'Directly-Follows Graph (DFG)' },
                    { id: 'bottlenecks', label: `Bottlenecks & Inefficiencies (${bottlenecks.length})` },
                    { id: 'variants', label: `Process Variants (${variants.length})` },
                    { id: 'apps', label: 'App Handoff Topology' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'px-4 py-3 text-xs font-bold transition-all relative',
                            activeTab === tab.id
                                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB 1: Process Topology Graph */}
            {activeTab === 'graph' && (
                <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Discovered Process Lifecycle (DFG)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Direct transitions between workflow stages mined from active task state changes and time logs.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-semibold">
                                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Optimal Flow
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate Queue
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" /> Bottleneck
                                </span>
                            </div>
                        </div>

                        {/* Interactive Graph Stages Rendering */}
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 py-8 overflow-x-auto">
                            {nodes.length === 0 ? (
                                <div className="w-full py-12 flex flex-col items-center justify-center text-center">
                                    <div className="h-14 w-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-300">
                                        <GitBranch size={28} />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Process Graph Discovered Yet</h4>
                                    <p className="text-xs text-slate-400 max-w-sm mt-1">Real tasks with workflow stage transitions will automatically generate the Directly-Follows Graph (DFG).</p>
                                </div>
                            ) : (
                                nodes.map((node, index) => {
                                const isStart = node.type === 'start';
                                const isEnd = node.type === 'end';
                                return (
                                    <React.Fragment key={node.id}>
                                        <div className={cn(
                                            "relative p-5 rounded-2xl border flex flex-col items-center justify-center min-w-[160px] text-center transition-all shadow-sm hover:scale-105",
                                            isStart && "bg-[#EEE8DD] dark:bg-[#252B20] border-[#D6CDBC] dark:border-[#384232] text-[#29291F] dark:text-[#F5F1E9]",
                                            isEnd && "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800",
                                            !isStart && !isEnd && "bg-white dark:bg-slate-800 border-primary-200 dark:border-primary-900/40"
                                        )}>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-[#777367] dark:text-[#A8A295]">
                                                Stage {index + 1}
                                            </span>
                                            <span className="text-sm font-black text-[#29291F] dark:text-[#F5F1E9] mt-1">
                                                {node.label}
                                            </span>
                                            <div className="mt-3 flex items-center gap-2 text-xs">
                                                <span className="px-2 py-0.5 rounded-full bg-[#E5DDCF] dark:bg-[#1E2419] text-[#29291F] dark:text-[#F5F1E9] font-bold">
                                                    {node.count} tasks
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-[#777367] dark:text-[#A8A295] mt-1">
                                                Avg stay: <strong className="text-[#29291F] dark:text-[#F5F1E9]">{node.avgStayHours}</strong>
                                            </span>
                                        </div>

                                        {index < nodes.length - 1 && (
                                            <div className="flex flex-col items-center text-slate-400 dark:text-slate-600 px-1">
                                                <ArrowRight size={22} className="text-primary-500" />
                                                <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                    {edges[index]?.avgDurationHours || 'Direct'}
                                                </span>
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })
                            )}
                        </div>
                    </div>

                    {/* Edge Transition Details Table */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
                            Directly-Follows Transition Metrics
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-[#EEE8DD] dark:bg-[#1E2419] text-[#29291F] dark:text-[#D6CDBC] border-b border-[#D6CDBC] dark:border-[#384232] font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4">From Stage</th>
                                        <th className="py-3 px-4">To Stage</th>
                                        <th className="py-3 px-4">Transitions Mined</th>
                                        <th className="py-3 px-4">Mean Latency</th>
                                        <th className="py-3 px-4">Flow Health</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {edges.map((e) => (
                                        <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{e.source}</td>
                                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{e.target}</td>
                                            <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">{e.count} occurrences</td>
                                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{e.avgDurationHours}</td>
                                            <td className="py-3 px-4">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                                                    e.isBottleneck && "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
                                                    e.isRework && "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
                                                    !e.isBottleneck && !e.isRework && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                                )}>
                                                    {e.isBottleneck ? 'Bottleneck' : e.isRework ? 'Rework Loop' : 'Optimal'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: Bottlenecks & Inefficiencies */}
            {activeTab === 'bottlenecks' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bottlenecks.length === 0 ? (
                        <div className="col-span-full p-12 text-center text-xs font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                            No active bottlenecks detected across workflows.
                        </div>
                    ) : (
                        bottlenecks.map((btn) => (
                        <div key={btn.id} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                        btn.severity === 'HIGH' ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" :
                                        btn.severity === 'MEDIUM' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
                                        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                    )}>
                                        {btn.severity} SEVERITY
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">
                                        Impact: {btn.impactHours}
                                    </span>
                                </div>
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                    {btn.stage}
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                                    <strong className="text-slate-800 dark:text-slate-200">Root Cause:</strong> {btn.rootCause}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                                    Automated Recommendation
                                </span>
                                <p className="text-xs text-indigo-900 dark:text-indigo-200 font-medium">
                                    {btn.recommendation}
                                </p>
                            </div>
                        </div>
                    ))
                    )}
                </div>
            )}

            {/* TAB 3: Process Variants */}
            {activeTab === 'variants' && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Discovered Execution Variants
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Real paths through which tasks and employee work sessions traverse the lifecycle.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {variants.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400 font-medium">
                                No process variants recorded yet.
                            </div>
                        ) : (
                            variants.map((v, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                        Variant {i + 1}: {v.name}
                                    </span>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>Traversed by {v.count} tasks</span>
                                        <span>•</span>
                                        <span>{v.percentage}% of total throughput</span>
                                    </div>
                                </div>
                                <div className="w-40 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="bg-primary-600 h-2.5 rounded-full" 
                                        style={{ width: `${Math.max(v.percentage, 5)}%` }}
                                    />
                                </div>
                            </div>
                        ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: Application Handoff Topology */}
            {activeTab === 'apps' && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Application Handoff & Tool Hopping Patterns
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Mined directly from activity log time sequences showing tool context switching and multitasking friction.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {applicationHandoffs.length === 0 ? (
                            <div className="col-span-full p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                                No application handoffs recorded yet. Active tracking agent will map app context switches.
                            </div>
                        ) : (
                            applicationHandoffs.map((handoff, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                        {handoff.transition}
                                    </span>
                                    <span className="text-[11px] text-slate-500 mt-1 block">
                                        {handoff.frequency} switches observed
                                    </span>
                                </div>
                                <span className="px-2.5 py-1 rounded-xl bg-primary-100 dark:bg-violet-900/40 text-primary-700 dark:text-primary-300 font-black text-xs">
                                    {handoff.percentage}%
                                </span>
                            </div>
                        ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
