import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Monitor, Mail, CheckCircle2, ExternalLink } from 'lucide-react';
import API_BASE_URL, { BASE_URL } from '../config/api';

export function SetupAgent() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [invite, setInvite] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            setError('Invalid invitation link. Ask your admin to resend the invite.');
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/auth/invitations/validate/${token}`);
                const json = await res.json();
                if (!res.ok || !json.success) {
                    throw new Error(json.message || 'Invitation expired or invalid');
                }
                setInvite({ ...json.data, token });
                localStorage.setItem('ems_pending_invite_token', token);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [token]);

    const handleDownload = () => {
        const url = invite?.agentDownloadUrl || 'https://raw.githubusercontent.com/ashilata62/employee-monitoring/main/employee-monitoirng-backend/public/agent/EMS-Tracker-latest.exe';
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'EMS-Tracker-latest.exe');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenAgent = () => {
        if (!invite?.deepLink) return;
        window.location.href = invite.deepLink;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <p className="text-sm font-bold animate-pulse">Loading invitation…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
                <div className="max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl p-8 text-center">
                    <p className="text-rose-400 font-bold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="bg-indigo-600 px-8 py-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Monitor size={28} />
                        <h1 className="text-xl font-black">Install Monitoring Agent</h1>
                    </div>
                    <p className="text-indigo-100 text-sm">Personal computer setup for {invite.fullName}</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <Mail className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Your work email</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{invite.email}</p>
                            <p className="text-xs text-slate-500 mt-1">Use this exact email in the agent (cannot be changed).</p>
                        </div>
                    </div>

                    <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        <li className="flex gap-2"><span className="font-black text-indigo-600">1.</span> Download and install the agent below.</li>
                        <li className="flex gap-2"><span className="font-black text-indigo-600">2.</span> Open EMS Tracker — your email will be pre-filled.</li>
                        <li className="flex gap-2"><span className="font-black text-indigo-600">3.</span> Set password, allow permissions, start tracking.</li>
                    </ol>

                    <p className="text-xs text-slate-500">Work mode: <strong>{invite.workMode}</strong>
                        {invite.team ? <> · Team: <strong>{invite.team}</strong></> : null}
                    </p>

                    <button
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider"
                    >
                        <Download size={18} /> Download Agent (Windows)
                    </button>

                    <button
                        onClick={handleOpenAgent}
                        className="w-full flex items-center justify-center gap-2 border-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                        <ExternalLink size={16} /> Open in EMS Tracker (after install)
                    </button>

                    <div className="flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span>After setup, your admin will see you under <strong>Monitoring Agents</strong>.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
