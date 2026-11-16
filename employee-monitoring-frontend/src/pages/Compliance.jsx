import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useRealTime } from '../hooks/RealTimeContext';
import complianceService from '../services/complianceService';

const cn = (...inputs) => inputs.filter(Boolean).join(' ');

export function Compliance() {
    const { addNotification } = useRealTime();
    const [searchQuery, setSearchQuery] = useState('');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const fetchedLogs = await complianceService.getAuditLogs();
            setLogs(fetchedLogs);
        } catch (error) {
            console.error('Failed to fetch compliance data:', error);
            addNotification('Failed to load compliance data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        try {
            const filteredLogs = await complianceService.getAuditLogs(query);
            setLogs(filteredLogs);
        } catch (error) {
            console.error('Failed to search logs:', error);
        }
    };

    if (loading) {
        return <div className="p-8">Loading compliance data...</div>;
    }

    return (
        <div className="max-w-4xl space-y-8 animate-fade-in pb-20">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Compliance & Privacy</h1>
                <p className="text-slate-500 font-medium mt-1">Manage data privacy and monitoring toggles.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
                        <h3 className="text-lg font-bold">Audit Logs</h3>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={handleSearch}
                                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm w-full outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Action</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">User</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {logs && logs.length > 0 ? logs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold">{log.action}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{log.user}</td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {new Date(log.time).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold",
                                                log.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 
                                                log.status === 'Denied' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                            )}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500 text-sm font-medium">
                                            No audit logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
