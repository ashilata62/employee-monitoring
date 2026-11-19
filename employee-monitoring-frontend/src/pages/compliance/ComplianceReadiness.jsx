import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, 
    AlertTriangle, 
    CheckCircle2, 
    Download, 
    RefreshCw, 
    FileText, 
    Lock, 
    Key, 
    Cpu, 
    EyeOff, 
    Server, 
    Info 
} from 'lucide-react';
import api from '../../services/apiClient';
import { toast } from '../../utils/toastManager';
import { cn } from '../../utils/cn';

export default function ComplianceReadiness() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'SOC2' | 'ISO'

    const fetchAssessment = async () => {
        try {
            setLoading(true);
            const res = await api.get('/compliance-readiness/assessment');
            if (res.data?.success) {
                setData(res.data.data);
            } else {
                toast.error(res.data?.message || 'Failed to fetch compliance assessment');
            }
        } catch (err) {
            console.error('Compliance assessment error:', err);
            toast.error(err.response?.data?.message || err.message || 'Error connecting to compliance engine');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssessment();
        const interval = setInterval(fetchAssessment, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleDownloadEvidence = async () => {
        try {
            setDownloading(true);
            const res = await api.get('/compliance-readiness/evidence-package');
            const blob = new Blob([JSON.stringify(res.data?.data || res.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `compliance_audit_evidence_pack_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Audit evidence package downloaded successfully!');
        } catch (err) {
            toast.error('Failed to download evidence package: ' + err.message);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
                <RefreshCw className="animate-spin text-primary-600" size={36} />
                <p className="text-sm font-semibold text-slate-500">Evaluating technical compliance controls against live system state...</p>
            </div>
        );
    }

    const summary = data?.summary || {};
    const disclaimer = data?.disclaimer || {};
    const soc2Controls = data?.soc2Controls || [];
    const iso27001Controls = data?.iso27001Controls || [];
    const recentAudit = data?.recentAuditEvidence || [];

    const displayedControls = filterTab === 'SOC2' 
        ? soc2Controls 
        : filterTab === 'ISO' 
        ? iso27001Controls 
        : [...soc2Controls, ...iso27001Controls];

    return (
        <div className="space-y-5 sm:space-y-6 animate-fade-in pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200 dark:shadow-none">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                SOC 2 & ISO 27001 Technical Readiness
                            </h1>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                Automated technical controls assessment, access boundary checks, and live audit trail verification.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={fetchAssessment}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <RefreshCw size={13} /> Re-evaluate Controls
                    </button>
                    <button
                        onClick={handleDownloadEvidence}
                        disabled={downloading}
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:shadow-md hover:shadow-emerald-500/20 transition-all"
                    >
                        <Download size={13} /> {downloading ? 'Generating Pack...' : 'Download Evidence Package'}
                    </button>
                </div>
            </div>

            {/* MANDATORY LEGAL DISCLAIMER BANNER */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-3">
                <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={17} />
                <div className="space-y-0.5 min-w-0 flex-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                        {disclaimer.title || 'Legal & Regulatory Compliance Disclaimer'}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-amber-800/90 dark:text-amber-200/90 leading-relaxed font-medium">
                        {disclaimer.message || 'This system evaluates internal technical readiness against standard security controls. This does not constitute formal certification. Formal SOC 2 Type II attestation and ISO 27001 certification require independent examination by an accredited third-party CPA firm or certification body.'}
                    </p>
                </div>
            </div>

            {/* Scorecard Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all min-w-0">
                    <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base shrink-0">
                        {summary.readinessScore || 100}%
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Overall Readiness</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block mt-0.5 truncate">
                            {summary.passedControls} of {summary.totalControls} Passing
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block truncate mt-0.5">Technical baseline satisfied</span>
                    </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all min-w-0">
                    <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm sm:text-base shrink-0">
                        {summary.soc2Score || 100}%
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">SOC 2 Type II</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block mt-0.5 truncate">
                            Trust Services Criteria
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block truncate mt-0.5">CC6, CC7, P1.1 Controls</span>
                    </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all min-w-0">
                    <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-primary-50 dark:bg-violet-950/40 border border-primary-200/80 dark:border-primary-800/80 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm sm:text-base shrink-0">
                        {summary.iso27001Score || 100}%
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">ISO/IEC 27001:2022</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block mt-0.5 truncate">
                            Annex A Controls
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block truncate mt-0.5">A.5, A.8 Technological</span>
                    </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all min-w-0">
                    <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm sm:text-base shrink-0">
                        {summary.auditLogCount || 0}
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">Audit Trail Depth</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block mt-0.5 truncate">
                            Immutable Events
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block truncate mt-0.5">{summary.retentionPeriodDays} days retention policy</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
                {[
                    { id: 'ALL', label: `All Technical Controls (${summary.totalControls || 11})` },
                    { id: 'SOC2', label: `SOC 2 Type II (${soc2Controls.length})` },
                    { id: 'ISO', label: `ISO/IEC 27001:2022 (${iso27001Controls.length})` },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilterTab(tab.id)}
                        className={cn(
                            'px-3.5 py-2.5 text-xs font-bold transition-all relative',
                            filterTab === tab.id
                                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedControls.map((c) => (
                    <div 
                        key={c.id} 
                        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-all"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        {c.id}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        {c.framework}
                                    </span>
                                </div>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1",
                                    c.status === 'PASS' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" :
                                    c.status === 'ACTION_REQUIRED' ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300" :
                                    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                                )}>
                                    <CheckCircle2 size={12} /> {c.status}
                                </span>
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                {c.title}
                            </h3>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                                Category: {c.category} • Ref: {c.reference}
                            </span>

                            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                <strong className="text-slate-900 dark:text-white block mb-0.5 text-[11px]">Automated Technical Evidence:</strong>
                                {c.evidence}
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span>Automated Live Evaluation</span>
                            <span>{new Date(c.lastAudited).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Live Audit Trail Proof */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                            Immutable Audit Trail Evidence (Sample Verified Events)
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Live events extracted from the MySQL database verifying tamper-evident administrative logging.
                        </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                        Active Database Logging
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="py-2.5 px-5">Event ID</th>
                                <th className="py-2.5 px-5">Action / Event</th>
                                <th className="py-2.5 px-5">Result Status</th>
                                <th className="py-2.5 px-5">Timestamp (UTC)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentAudit.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-mono">
                                    <td className="py-2.5 px-5 text-slate-500 text-[11px]">{log.id.slice(0, 13)}...</td>
                                    <td className="py-2.5 px-5 font-bold text-slate-900 dark:text-white font-sans">{log.action}</td>
                                    <td className="py-2.5 px-5">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-5 text-slate-500 text-[11px]">{new Date(log.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
