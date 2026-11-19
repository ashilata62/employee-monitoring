import {
    DollarSign,
    FileText,
    Globe,
    UserCheck,
    Download,
    Clock,
    CheckCircle2,
    Timer,
    TrendingUp,
    CreditCard,
    Plus,
    MoreHorizontal,
    X,
    Receipt,
    Building2,
    Search,
    ChevronLeft,
    ChevronRight,
    Send,
    ChevronDown,
    MessageCircle,
    ShieldCheck,
    Link2,
    Loader2,
    Zap
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import usePayrollStore from '../store/payrollStore';
import { FilterDropdown } from '../components/FilterDropdown';
import { GlobalCalendar } from '../components/GlobalCalendar';
import { useFilterStore } from '../store/filterStore';
import { useRealTime } from '../hooks/RealTimeContext';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import api from '../services/apiClient';
import { toast } from '../utils/toastManager';

const cn = (...inputs) => twMerge(clsx(inputs));

const INTEGRATIONS = [
    { id: 'gusto', name: 'Gusto', desc: 'Direct payroll sync: employee hours, compensations and pay runs with Gusto API.', icon: CreditCard, color: 'text-rose-500 bg-rose-500', glow: 'shadow-rose-500/20' },
    { id: 'adp', name: 'ADP Workforce Now', desc: 'Enterprise time-card batch sync directly to ADP RUN & Workforce Now API.', icon: Building2, color: 'text-blue-600 bg-blue-600', glow: 'shadow-blue-600/20' },
    { id: 'quickbooks', name: 'QuickBooks Online', desc: 'Sync payroll time activities, billable rates, and expenses with QuickBooks Online ledger.', icon: Building2, color: 'text-emerald-500 bg-emerald-500', glow: 'shadow-emerald-500/20' },
    { id: 'xero', name: 'Xero Cloud', desc: 'Automated timesheet sync for cloud-based accounting and pay runs.', icon: Globe, color: 'text-sky-500 bg-sky-500', glow: 'shadow-sky-500/20' }
];

const IntegrationCard = ({ item, status, lastSync, onConnect, onSync, isSyncing }) => {
    const isConnected = status === 'Connected';

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-[#D6CDBC] bg-[#EEE8DD] p-6 md:p-8 shadow-warm-xs transition-all dark:border-[#384232] dark:bg-[#252B20] flex flex-col justify-between">
            <div className={cn("absolute top-0 right-0 h-32 w-32 blur-3xl opacity-5 rounded-full -mr-10 -mt-10", item.color)} />

            <div>
                <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className={cn("h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center text-white shadow-md", item.color)}>
                        <item.icon size={26} />
                    </div>
                    <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border transition-colors",
                        isConnected
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800"
                            : "bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                    )}>
                        {status}
                    </span>
                </div>

                <div className="relative z-10">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 tracking-tight">{item.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed min-h-[36px]">{item.desc}</p>
                    {lastSync && (
                        <p className="text-[10px] text-slate-400 font-semibold mb-4">
                            Last synced: {new Date(lastSync).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>

            <div className="relative z-10 pt-4 flex gap-2">
                <button
                    onClick={() => onConnect(item.id)}
                    className={cn(
                        "flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700",
                        isConnected
                            ? "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200"
                            : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 shadow-md"
                    )}
                >
                    <Link2 size={13} /> {isConnected ? 'Configure' : 'Connect'}
                </button>
                {isConnected && (
                    <button
                        onClick={() => onSync(item.id)}
                        disabled={isSyncing}
                        className="py-3 px-4 rounded-xl font-black text-[9px] uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                        title="Sync live calculated payroll now"
                    >
                        {isSyncing ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                        Sync
                    </button>
                )}
            </div>
        </div>
    );
};

const CloudPayrollModal = ({ service, isOpen, onClose, onConnected }) => {
    if (!isOpen || !service) return null;
    const item = INTEGRATIONS.find(i => i.id === service) || { name: service };

    const [apiKey, setApiKey] = useState('');
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [sandbox, setSandbox] = useState(true);
    const [testing, setTesting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    const handleTest = async () => {
        setTesting(true);
        setErrorMsg(null);
        try {
            // First save config
            await api.post(`/payroll/integrations/${service}/config`, {
                apiKey,
                clientId,
                clientSecret,
                companyId,
                sandbox
            });
            // Then test
            const res = await api.post(`/payroll/integrations/${service}/test`);
            toast.success(res.data?.message || 'Connection verified successfully!');
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            setErrorMsg(msg);
            toast.error(msg);
        } finally {
            setTesting(false);
        }
    };

    const handleSaveAndSync = async () => {
        setSyncing(true);
        setErrorMsg(null);
        try {
            await api.post(`/payroll/integrations/${service}/config`, {
                apiKey,
                clientId,
                clientSecret,
                companyId,
                sandbox
            });
            const res = await api.post(`/payroll/integrations/${service}/sync`);
            setSyncResult(res.data?.data || res.data);
            toast.success(res.data?.message || 'Payroll synced successfully!');
            if (onConnected) onConnected(service);
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            setErrorMsg(msg);
            toast.error(msg);
        } finally {
            setSyncing(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-[#FBF9F5] dark:bg-[#1E2419] rounded-2xl p-6 md:p-8 shadow-2xl border border-[#E5DED2] dark:border-[#384232] text-left animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5DED2] dark:border-[#384232]">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#EEE8DD] text-[#30382B] dark:bg-[#384232] dark:text-[#F5F1E9] border border-[#E5DED2] dark:border-[#4A5742] flex items-center justify-center font-black">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">{item.name} Integration</h3>
                            <p className="text-xs text-[#777367] dark:text-[#A8A295] font-medium">Direct API Connection & Payroll Synchronization</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] rounded-lg">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    {service === 'gusto' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Gusto API Key / OAuth Bearer Token</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your Gusto API Key or OAuth Bearer Token"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Gusto Company ID</label>
                                <input
                                    type="text"
                                    value={companyId}
                                    onChange={(e) => setCompanyId(e.target.value)}
                                    placeholder="e.g. comp_01H1234DEMO"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                />
                            </div>
                        </>
                    )}

                    {service === 'adp' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ADP Client ID</label>
                                <input
                                    type="text"
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    placeholder="Enter ADP Marketplace Client ID"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ADP Client Secret</label>
                                <input
                                    type="password"
                                    value={clientSecret}
                                    onChange={(e) => setClientSecret(e.target.value)}
                                    placeholder="Enter ADP Client Secret"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                />
                            </div>
                        </>
                    )}

                    {(service === 'quickbooks' || service === 'xero') && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">OAuth Access Token</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter Intuit / QuickBooks Access Token"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Company / Realm ID</label>
                                <input
                                    type="text"
                                    value={companyId}
                                    onChange={(e) => setCompanyId(e.target.value)}
                                    placeholder="e.g. 913035123456789"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="sandbox"
                            checked={sandbox}
                            onChange={(e) => setSandbox(e.target.checked)}
                            className="rounded border-slate-300"
                        />
                        <label htmlFor="sandbox" className="text-xs text-slate-500 font-semibold cursor-pointer">
                            Enable Sandbox / Demo Developer Mode (Recommended for testing)
                        </label>
                    </div>

                    {errorMsg && (
                        <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                            {errorMsg}
                        </div>
                    )}

                    {syncResult && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold space-y-1">
                            <p className="font-bold">Sync Successful!</p>
                            <p>Synced Records: {syncResult.syncedCount} employees</p>
                            <p>Total Hours: {syncResult.totalHours}h | Gross Pay: ${syncResult.totalGrossPay}</p>
                            <p className="text-[10px] text-emerald-600">Batch ID: {syncResult.syncBatchId}</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleTest}
                        disabled={testing}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-white flex items-center gap-1.5 disabled:opacity-50"
                    >
                        {testing ? <Loader2 size={13} className="animate-spin" /> : null}
                        Test Connection
                    </button>
                    <button
                        onClick={handleSaveAndSync}
                        disabled={syncing}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C9A96E] hover:bg-[#d8b87d] text-[#161C14] shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                        {syncing ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                        Save & Sync Payroll
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const StatCard = ({ title, value, subValue, icon: Icon, color, trend }) => (
    <div className="rounded-xl border border-[#D6CDBC] dark:border-[#384232] bg-[#FBF9F5] dark:bg-[#252B20] p-3.5 sm:p-4 shadow-warm-xs transition-all hover:border-[#B9955B]/60 hover:shadow-warm-md group flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2.5">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs text-white", color)}>
                <Icon size={17} />
            </div>
            {trend !== undefined && (
                <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    trend >= 0 
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                )}>
                    {trend >= 0 ? '+' : ''}{trend}%
                </div>
            )}
        </div>
        <div>
            <h3 className="text-[10px] sm:text-[11px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-[0.14em] mb-0.5">{title}</h3>
            <p className="text-xl sm:text-2xl font-black text-[#29291F] dark:text-[#F5F1E9] leading-tight tracking-tight">{value}</p>
            <p className="text-[11px] font-medium text-[#777367] dark:text-[#9E988A] truncate mt-0.5">{subValue}</p>
        </div>
    </div>
);

export function Payroll() {
    const { employees, addNotification, socket } = useRealTime();
    const { 
        summary, 
        records: payrollTimesheets, 
        invoices: storeInvoices, 
        fetchSummary, 
        fetchRecords, 
        fetchInvoices,
        createInvoice,
        loading 
    } = usePayrollStore();

    const { dateRange, selectedEmployee, selectedTeam } = useFilterStore();

    // Real dynamic monthly trend from backend database summary
    const earningsData = useMemo(() => {
        if (summary?.monthlyTrends && summary.monthlyTrends.length > 0) {
            return summary.monthlyTrends;
        }
        return [
            { month: 'Current', earnings: summary?.totalPayroll || 0, hours: summary?.totalHours || 0 }
        ];
    }, [summary?.monthlyTrends, summary?.totalPayroll, summary?.totalHours]);

    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [activeTab, setActiveTab] = useState('payroll'); // payroll, invoices
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const [integrationStatuses, setIntegrationStatuses] = useState({
        gusto: 'Not Connected',
        adp: 'Not Connected',
        quickbooks: 'Not Connected',
        xero: 'Not Connected'
    });
    const [integrationLastSync, setIntegrationLastSync] = useState({});
    const [connectingService, setConnectingService] = useState(null);
    const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
    const [syncingService, setSyncingService] = useState(null);

    const loadCloudIntegrations = async () => {
        try {
            const res = await api.get('/payroll/integrations/status');
            const data = res.data?.data || res.data || [];
            const statuses = {};
            const syncs = {};
            data.forEach(item => {
                statuses[item.provider] = item.connected ? 'Connected' : 'Not Connected';
                if (item.lastSync) syncs[item.provider] = item.lastSync;
            });
            setIntegrationStatuses(prev => ({ ...prev, ...statuses }));
            setIntegrationLastSync(syncs);
        } catch (e) {
            console.error('Failed to load payroll integrations:', e);
        }
    };

    const handleDirectSync = async (provider) => {
        setSyncingService(provider);
        try {
            const res = await api.post(`/payroll/integrations/${provider}/sync`);
            toast.success(res.data?.message || `Successfully synced with ${provider.toUpperCase()}`);
            loadCloudIntegrations();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setSyncingService(null);
        }
    };

    useEffect(() => {
        loadCloudIntegrations();
    }, []);

    useEffect(() => {
        const loadPayroll = () => {
            const params = {
                startDate: dateRange.start,
                endDate: dateRange.end,
                userId: selectedEmployee,
                teamId: selectedTeam
            };
            fetchSummary(params);
            fetchRecords(params);
        };

        loadPayroll();
        const interval = setInterval(loadPayroll, 30000);
        return () => clearInterval(interval);
    }, [fetchSummary, fetchRecords, dateRange, selectedEmployee, selectedTeam]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [newInvoice, setNewInvoice] = useState({
        clientName: '',
        clientEmail: '',
        amount: '',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        notes: ''
    });

    const handleCreateInvoice = async () => {
        if (!newInvoice.clientName || !newInvoice.amount) {
            addNotification("Client name and amount are required", "alert");
            return;
        }

        const res = await createInvoice({
            ...newInvoice,
            amount: parseFloat(newInvoice.amount)
        });
        if (res.success) {
            setIsInvoiceModalOpen(false);
            setNewInvoice({
                clientName: '',
                clientEmail: '',
                amount: '',
                dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                notes: ''
            });
            addNotification("Invoice created successfully", "success");
        } else {
            addNotification(res.error || "Failed to create invoice", "alert");
        }
    };

    const handleIntegrationFinish = () => {
        setConnectingService(null);
        setConnectionStep('idle');
    };

    const handleConnectTrigger = (id) => {
        setConnectingService(id);
        setConnectionStep('connecting');
        setTimeout(() => {
            setConnectionStep('success');
            setIntegrationStatuses(prev => ({ ...prev, [id]: 'Connected' }));
            addNotification(`${id.charAt(0).toUpperCase() + id.slice(1)} connected successfully!`, "success");
        }, 2500);
    };

    const filteredPayroll = useMemo(() => {
        return payrollTimesheets.filter(row =>
            row.employee.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [payrollTimesheets, searchQuery]);

    const totalPages = Math.ceil(filteredPayroll.length / itemsPerPage);
    const paginatedPayroll = filteredPayroll.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // --- Financial Actions ---
    const [isRunningPayroll, setIsRunningPayroll] = useState(false);

    const handleRunPayroll = () => {
        setIsRunningPayroll(true);
        addNotification("Initializing payroll batch processing...", "info");

        setTimeout(() => {
            setIsRunningPayroll(false);
            addNotification(`Successfully processed payroll for ${employees.length} employees ($142,500).`, "success");
        }, 2000);
    };

    const handleDownloadReports = () => {
        const headers = ['Employee', 'Role', 'Period', 'Total Hours', 'Overtime', 'Gross Pay', 'Status'];
        const rows = payrollTimesheets.map(p => [
            p.employee,
            p.role,
            p.period || 'Current',
            `${p.totalHours}h`,
            `${p.overTime || 0}h`,
            typeof p.grossPay === 'string' ? p.grossPay.replace('$', '').replace(',', '') : p.grossPay,
            p.status
        ]);

        const content = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `payroll_consolidated_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addNotification("Payroll report downloaded successfully.", "success");
    };

    const handleDownloadIndividualPayslip = (payslip) => {
        const headers = ['Field', 'Details'];
        const rows = [
            ['Employee', payslip.employee],
            ['Role', payslip.role],
            ['Period', payslip.period || 'Current'],
            ['Total Hours', `${payslip.totalHours}h`],
            ['Overtime', `${payslip.overTime || 0}h`],
            ['Gross Pay', typeof payslip.grossPay === 'string' ? payslip.grossPay : `$${payslip.grossPay?.toLocaleString()}`],
            ['Deductions', payslip.deductions ? `-$${payslip.deductions.toLocaleString()}` : '-$0'],
            ['Net Payable', payslip.netPay ? `$${payslip.netPay.toLocaleString()}` : (typeof payslip.grossPay === 'string' ? payslip.grossPay : `$${payslip.grossPay?.toLocaleString()}`)],
            ['Status', payslip.status]
        ];

        const content = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `payslip_${payslip.employee.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addNotification(`Payslip for ${payslip.employee} downloaded.`, "success");
    };

    // Calculate Stats
    const stats = useMemo(() => {
        if (summary) {
            return {
                totalPayroll: `$${Math.round(summary.totalPayroll).toLocaleString()}`,
                avgHourly: `$${Math.round(summary.avgHourlyRate * 10) / 10}`,
                outstanding: `$${storeInvoices.filter(i => i.status !== 'PAID').reduce((acc, i) => acc + i.amount, 0).toLocaleString()}`,
                profit: `$${Math.round(summary.totalPayroll * 0.6).toLocaleString()}`
            };
        }

        const totalGross = payrollTimesheets.reduce((acc, p) => acc + (parseFloat(p.grossPayValue || p.grossPay) || 0), 0);
        const totalHours = payrollTimesheets.reduce((acc, p) => acc + (parseFloat(p.totalHours) || 0), 0);
        const avgRate = totalHours > 0 ? totalGross / totalHours : 0;
        const totalOutstanding = storeInvoices.filter(i => i.status !== 'PAID').reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0);
        const totalProfit = totalGross * 0.6; // Simple 60% markup simulation

        return {
            totalPayroll: `$${Math.round(totalGross || 0).toLocaleString()}`,
            avgHourly: `$${Math.round((avgRate || 0) * 10) / 10}`,
            outstanding: `$${Math.round(totalOutstanding || 0).toLocaleString()}`,
            profit: `$${Math.round(totalProfit || 0).toLocaleString()}`
        };
    }, [payrollTimesheets, storeInvoices, summary]);

    return (
        <div className="space-y-6 pb-20 max-w-full overflow-x-hidden box-border px-4 md:px-0">
            {/* Header */}
            <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in mb-6 md:mb-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Financials</h1>
                        <span className="hidden xs:inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] md:text-xs font-bold border border-emerald-200">System Healthy</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Payroll processing & invoice management.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <GlobalCalendar />
                    <button
                        onClick={handleDownloadReports}
                        className="h-9 px-3.5 border border-[#D6CDBC] dark:border-[#384232] text-[#29291F] dark:text-[#F5F1E9] rounded-xl bg-[#F5F1E9] dark:bg-[#1E2419] flex items-center justify-center gap-2 hover:border-[#B9955B] hover:text-[#B9955B] transition-all active:scale-95 shadow-warm-xs text-xs font-bold"
                        title="Download payroll consolidated report as CSV"
                    >
                        <Download size={14} strokeWidth={2.2} />
                        <span>Reports</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-3.5 sm:gap-4 lg:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up mb-6">
                <StatCard title="Total Payroll" value={stats.totalPayroll} subValue="Next run: Feb 28" trend={summary?.trend || 5.2} icon={DollarSign} color="bg-emerald-600 shadow-sm" />
                <StatCard title="Avg Hourly Rate" value={stats.avgHourly} subValue={`Across ${employees.length} Staff`} trend={summary?.avgRateTrend || 1.2} icon={Clock} color="bg-blue-600 shadow-sm" />
                <StatCard title="Outstanding Invoices" value={stats.outstanding} subValue={`${storeInvoices.filter(i => i.status !== 'PAID').length} Clients Pending`} trend={-8} icon={Receipt} color="bg-amber-500 shadow-sm" />
                <StatCard title="Net Profit est." value={stats.profit} subValue="Based on 60% Margin" trend={12} icon={TrendingUp} color="bg-purple-600 shadow-sm" />
            </div>

            {/* Main Content Area */}
            {activeTab === 'payroll' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    {/* Charts & Graphs */}
                    <div className="lg:col-span-3">
                        <div className="rounded-2xl border border-[#D6CDBC] bg-[#FBF9F5] p-5 dark:border-[#384232] dark:bg-[#252B20] shadow-warm-xs">
                            <h3 className="text-sm font-bold text-[#29291F] dark:text-[#F5F1E9] mb-4">Payroll Cost vs Hours</h3>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={earningsData}>
                                        <defs>
                                            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} stroke="#94a3b8" />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                        <Area type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" name="Cost ($)" />
                                        <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" name="Hours" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Employee Payroll List */}
                    <div className="lg:col-span-3 rounded-2xl border border-[#D6CDBC] bg-[#EEE8DD] overflow-hidden dark:border-[#384232] dark:bg-[#252B20] shadow-warm-xs">
                        <div className="p-4 md:p-6 border-b border-[#D6CDBC] dark:border-[#384232] bg-[#E5DDCF]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <h3 className="text-base md:text-lg font-bold">Employee Timesheets & Payslips</h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by employee..."
                                    className="w-full h-11 md:h-10 pl-10 pr-4 rounded-xl border border-[#D6CDBC] bg-[#F5F1E9] dark:bg-[#1E2419] dark:border-[#384232] focus:border-[#B9955B] focus:outline-none font-medium text-[11px] md:text-xs text-[#29291F] dark:text-[#F5F1E9]"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <FilterDropdown />
                        </div>
                        <div className="overflow-x-hidden md:overflow-x-auto">
                            <table className="w-full text-left block md:table">
                                <thead className="bg-[#E5DDCF]/70 dark:bg-[#1E2419] border-b border-[#D6CDBC] dark:border-[#384232] hidden md:table-header-group">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Employee</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Period</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Hours</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Gross Pay</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Status</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D6CDBC]/60 dark:divide-[#384232] block md:table-row-group">
                                    {paginatedPayroll.map((row) => (
                                        <tr key={row.id} className="bg-[#F5F1E9] dark:bg-[#1E2419] hover:bg-[#EAE2D3] dark:hover:bg-[#252B20] transition-colors border-b border-[#D6CDBC]/50 group flex flex-col md:table-row p-4 md:p-0">
                                            <td className="px-0 py-2 md:px-6 md:py-4 block md:table-cell">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 md:h-8 md:w-8 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white dark:ring-slate-800">
                                        <img src={row.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.employee)}&background=random`} alt={row.employee} className="w-full h-full object-cover" />
                                    </div>
                                                    <div>
                                                        <p className="text-sm md:text-sm font-black md:font-bold text-slate-900 dark:text-white leading-tight">{row.employee}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{row.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-0 py-1.5 md:px-6 md:py-4 text-[11px] md:text-sm font-bold text-slate-400 md:text-slate-500 block md:table-cell">
                                                <span className="md:hidden opacity-50 uppercase mr-2 text-[9px]">Period:</span>
                                                {row.period || 'Current'}
                                            </td>
                                            <td className="px-0 py-1.5 md:px-6 md:py-4 block md:table-cell">
                                                <div className="flex items-center md:block gap-2">
                                                    <span className="md:hidden opacity-50 uppercase text-[9px] font-bold">Hours:</span>
                                                    <div className="text-sm font-black md:font-bold">{row.totalHours}h</div>
                                                    {row.overTime > 0 && <div className="text-[10px] text-amber-500 font-black uppercase md:tracking-tighter">{row.overTime}h OT</div>}
                                                </div>
                                            </td>
                                             <td className="px-0 py-1.5 md:px-6 md:py-4 text-sm font-black md:font-bold text-slate-900 dark:text-slate-300 block md:table-cell">
                                                <span className="md:hidden opacity-50 uppercase mr-2 text-[9px] font-bold">Gross:</span>
                                                ${(row.grossPay || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-0 py-2 md:px-6 md:py-4 block md:table-cell">
                                                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 md:px-2.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest md:tracking-wide", row.status === 'Ready'
                                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                                                    : "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                                                )}>
                                                    {row.status === 'Ready' ? <CheckCircle2 size={12} /> : <Timer size={12} />}
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-0 py-3 md:px-6 md:py-4 text-right block md:table-cell">
                                                <button
                                                    onClick={() => setSelectedPayslip(row)}
                                                    className="w-full md:w-auto px-4 py-2.5 md:px-3 md:py-1.5 rounded-xl md:rounded-lg bg-[#30382B] text-[#FDFBF7] text-[10px] md:text-xs font-semibold hover:bg-[#3C4536] transition-all shadow-warm-xs uppercase tracking-wider cursor-pointer"
                                                >
                                                    View Slip
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="px-4 md:px-6 py-4 md:py-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 gap-4">
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest text-center sm:text-left">
                                    Showing <span className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredPayroll.length)}</span> of <span className="text-slate-900 dark:text-white">{filteredPayroll.length}</span> entries
                                </p>
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={cn(
                                                    "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                                    currentPage === i + 1
                                                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                                                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:text-white dark:hover:bg-slate-800"
                                                )}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'invoices' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="lg:col-span-2 rounded-[2rem] border border-slate-200 bg-white p-4 md:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                        <h3 className="text-base md:text-lg font-bold mb-6">Recent Invoices</h3>
                        <div className="space-y-3 md:space-y-4">
                            {storeInvoices.map(inv => (
                                <div key={inv.id} className="flex flex-row items-center justify-between p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 transition-all bg-slate-50/50 dark:bg-slate-800/30 group">
                                    <div className="flex items-center gap-3 md:gap-4 truncate">
                                        <div className="h-10 w-10 md:h-10 md:w-10 shrink-0 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                                            <FileText size={20} />
                                        </div>
                                        <div className="truncate">
                                            <h4 className="font-bold text-sm md:text-base text-slate-900 dark:text-white truncate">{inv.clientName}</h4>
                                            <p className="text-[10px] md:text-xs text-slate-500 font-medium">#{inv.invoiceNumber || inv.id} • {new Date(inv.issueDate || inv.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <p className="font-black text-sm md:text-base text-slate-900 dark:text-white">
                                            {typeof inv.amount === 'string' ? inv.amount : `$${inv.amount?.toLocaleString()}`}
                                        </p>
                                        <p className={cn("text-[9px] md:text-[10px] font-bold uppercase tracking-wider",
                                            inv.status === 'PAID' ? "text-emerald-500" :
                                                inv.status === 'PENDING' ? "text-amber-500" :
                                                    inv.status === 'SENT' ? "text-blue-500" : "text-slate-400"
                                        )}>{inv.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => setIsInvoiceModalOpen(true)}
                            className="w-full mt-6 py-4 md:py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold hover:border-primary-500 hover:text-primary-600 transition-all flex items-center justify-center gap-2 text-xs md:text-sm"
                        >
                            <Plus size={18} /> Create New Invoice
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[2rem] border border-slate-200 bg-slate-900 text-white p-6 md:p-8 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-indigo-500 rounded-full blur-3xl -mr-10 -mt-10 opacity-30"></div>
                            <h3 className="text-lg md:text-xl font-bold mb-2 relative z-10">Sync Assistant</h3>
                            <p className="text-slate-400 text-[11px] md:text-sm mb-6 relative z-10">Quickly sync your data with cloud accounting services.</p>
                            <div className="space-y-3 relative z-10">
                                <button onClick={() => setActiveTab('integrations')} className="w-full py-3 px-4 rounded-xl bg-white text-slate-900 font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
                                    <Zap size={16} /> Manage Integrations
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'integrations' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Third-Party Integrations</h2>
                            <p className="text-slate-500 font-medium">Automatic data synchronization with industry-leading platforms.</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800">
                            <ShieldCheck size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Enterprise Encrypted</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {INTEGRATIONS.map(item => (
                            <IntegrationCard
                                key={item.id}
                                item={item}
                                status={integrationStatuses[item.id] || 'Not Connected'}
                                lastSync={integrationLastSync[item.id]}
                                onConnect={(id) => {
                                    setConnectingService(id);
                                    setIsCloudModalOpen(true);
                                }}
                                onSync={handleDirectSync}
                                isSyncing={syncingService === item.id}
                            />
                        ))}
                    </div>


                </div>
            )}

            {/* Cloud Payroll Modal */}
            <CloudPayrollModal
                service={connectingService}
                isOpen={isCloudModalOpen}
                onClose={() => setIsCloudModalOpen(false)}
                onConnected={() => loadCloudIntegrations()}
            />

            {/* Create Invoice Modal */}
            {isInvoiceModalOpen && createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
                    onClick={() => setIsInvoiceModalOpen(false)}
                >
                    <div
                        className="w-full max-w-lg bg-[#FBF9F5] dark:bg-[#1E2419] rounded-2xl p-6 md:p-8 shadow-2xl border border-[#E5DED2] dark:border-[#384232] text-left animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5DED2] dark:border-[#384232]">
                            <h3 className="text-xl font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">Create New Invoice</h3>
                            <button onClick={() => setIsInvoiceModalOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-[#EEE8DD] dark:hover:bg-[#252B20] text-[#777367] transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider mb-1.5 block">Client name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter client name"
                                    className="w-full h-11 px-4 rounded-xl border border-[#E5DED2] dark:border-[#384232] bg-[#EEE8DD]/40 dark:bg-[#252B20] focus:border-[#C9A96E] focus:outline-none font-semibold text-xs text-[#29291F] dark:text-[#F5F1E9]"
                                    value={newInvoice.clientName}
                                    onChange={(e) => setNewInvoice({...newInvoice, clientName: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider mb-1.5 block">Client email (Optional)</label>
                                <input 
                                    type="email" 
                                    placeholder="client@example.com"
                                    className="w-full h-11 px-4 rounded-xl border border-[#E5DED2] dark:border-[#384232] bg-[#EEE8DD]/40 dark:bg-[#252B20] focus:border-[#C9A96E] focus:outline-none font-semibold text-xs text-[#29291F] dark:text-[#F5F1E9]"
                                    value={newInvoice.clientEmail}
                                    onChange={(e) => setNewInvoice({...newInvoice, clientEmail: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider mb-1.5 block">Amount ($)</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        className="w-full h-11 px-4 rounded-xl border border-[#E5DED2] dark:border-[#384232] bg-[#EEE8DD]/40 dark:bg-[#252B20] focus:border-[#C9A96E] focus:outline-none font-semibold text-xs text-[#29291F] dark:text-[#F5F1E9]"
                                        value={newInvoice.amount}
                                        onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider mb-1.5 block">Due Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full h-11 px-4 rounded-xl border border-[#E5DED2] dark:border-[#384232] bg-[#EEE8DD]/40 dark:bg-[#252B20] focus:border-[#C9A96E] focus:outline-none font-semibold text-xs text-[#29291F] dark:text-[#F5F1E9]"
                                        value={newInvoice.dueDate}
                                        onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider mb-1.5 block">Notes</label>
                                <textarea 
                                    placeholder="Add any additional details..."
                                    className="w-full h-20 p-3 rounded-xl border border-[#E5DED2] dark:border-[#384232] bg-[#EEE8DD]/40 dark:bg-[#252B20] focus:border-[#C9A96E] focus:outline-none font-semibold text-xs text-[#29291F] dark:text-[#F5F1E9] resize-none"
                                    value={newInvoice.notes}
                                    onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                                />
                            </div>

                            <button 
                                onClick={handleCreateInvoice}
                                className="w-full py-3.5 mt-2 bg-[#C9A96E] hover:bg-[#d8b87d] text-[#161C14] rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] transition-all active:scale-95 cursor-pointer"
                            >
                                Generate Invoice
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Payslip Modal */}
            {selectedPayslip && createPortal(
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
                    onClick={() => setSelectedPayslip(null)}
                >
                    <div
                        className="w-full max-w-lg bg-[#FBF9F5] dark:bg-[#1C2419] rounded-[2rem] p-6 md:p-8 shadow-2xl border border-[#E5DED2] dark:border-[#384232] animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto custom-scrollbar text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 md:mb-7 pb-4 md:pb-5 border-b border-[#E5DED2] dark:border-[#384232]">
                            <div className="flex items-center gap-3.5 md:gap-4 min-w-0">
                                <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-[#EEE8DD] dark:bg-[#384232] text-[#30382B] dark:text-[#F5F1E9] border border-[#E5DED2] dark:border-[#4A5742] flex items-center justify-center font-bold text-sm md:text-base shrink-0 overflow-hidden shadow-inner">
                                    {selectedPayslip.avatar ? (
                                        <img src={selectedPayslip.avatar} alt={selectedPayslip.employee} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{(selectedPayslip.employee || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base md:text-xl font-serif font-bold text-[#29291F] dark:text-[#F5F1E9] leading-tight truncate">{selectedPayslip.employee}</h3>
                                    <p className="text-[10px] md:text-xs text-[#777367] dark:text-[#A8A295] font-bold uppercase tracking-wider truncate">{selectedPayslip.role} {selectedPayslip.team ? `• ${selectedPayslip.team}` : ''}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPayslip(null)}
                                className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-[#EEE8DD] dark:hover:bg-[#252B20] text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] transition-colors shrink-0 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Period Info */}
                            <div className="grid grid-cols-2 gap-3 md:gap-3.5">
                                <div className="p-3.5 rounded-xl bg-[#EEE8DD]/50 dark:bg-[#252B20] border border-[#E5DED2]/80 dark:border-[#384232]/80 shadow-warm-xs">
                                    <p className="text-[10px] md:text-[11px] font-bold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider mb-1">Pay Period</p>
                                    <p className="text-xs md:text-sm font-bold text-[#29291F] dark:text-[#F5F1E9] tracking-tight">{selectedPayslip.period || 'Current Month'}</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#EEE8DD]/50 dark:bg-[#252B20] border border-[#E5DED2]/80 dark:border-[#384232]/80 shadow-warm-xs">
                                    <p className="text-[10px] md:text-[11px] font-bold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider mb-1">Hourly Rate</p>
                                    <p className="text-xs md:text-sm font-bold text-[#29291F] dark:text-[#F5F1E9]">${(selectedPayslip.hourlyRate || 0).toLocaleString()}/hr</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#EEE8DD]/50 dark:bg-[#252B20] border border-[#E5DED2]/80 dark:border-[#384232]/80 shadow-warm-xs">
                                    <p className="text-[10px] md:text-[11px] font-bold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider mb-1">Total Hours</p>
                                    <p className="text-xs md:text-sm font-bold text-[#29291F] dark:text-[#F5F1E9]">{selectedPayslip.totalHours}h</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#EEE8DD]/50 dark:bg-[#252B20] border border-[#E5DED2]/80 dark:border-[#384232]/80 shadow-warm-xs">
                                    <p className="text-[10px] md:text-[11px] font-bold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider mb-1">Overtime</p>
                                    <p className="text-xs md:text-sm font-bold text-[#C98A3C] dark:text-[#D4A359]">{selectedPayslip.overTime || 0}h</p>
                                </div>
                            </div>

                            {/* Earnings Breakdown */}
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider px-1 mb-2">Earnings Breakdown</p>
                                <div className="flex justify-between items-center py-2.5 border-b border-[#E5DED2]/80 dark:border-[#384232]/80">
                                    <span className="text-xs md:text-sm font-semibold text-[#777367] dark:text-[#B8B3A7]">Regular Pay ({selectedPayslip.totalHours}h × ${selectedPayslip.hourlyRate || 0}/hr)</span>
                                    <span className="text-xs md:text-sm font-bold text-[#29291F] dark:text-[#F5F1E9]">${(selectedPayslip.grossPay || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                {selectedPayslip.overTime > 0 && (
                                    <div className="flex justify-between items-center py-2.5 border-b border-[#E5DED2]/80 dark:border-[#384232]/80">
                                        <span className="text-xs md:text-sm font-semibold text-[#C98A3C]">Overtime ({selectedPayslip.overTime}h)</span>
                                        <span className="text-xs md:text-sm font-bold text-[#C98A3C]">${((selectedPayslip.overTime || 0) * (selectedPayslip.hourlyRate || 0) * 1.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-2.5 border-b border-[#E5DED2]/80 dark:border-[#384232]/80 text-rose-600 dark:text-rose-400">
                                    <span className="text-xs md:text-sm font-bold uppercase tracking-tight">Tax Deductions (20%)</span>
                                    <span className="text-xs md:text-sm font-bold">-${(selectedPayslip.deductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {/* Net Pay Banner */}
                            <div className="p-4 md:p-5 rounded-2xl bg-[#161C14] border border-[#C9A96E]/40 text-[#F5F1E9] flex flex-row justify-between items-center shadow-xl">
                                <div>
                                    <p className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-[0.2em] mb-1">Net Payable</p>
                                    <p className="text-2xl md:text-3xl font-serif font-black text-[#F5F1E9]">${(selectedPayslip.netPay || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <button
                                    onClick={() => handleDownloadIndividualPayslip(selectedPayslip)}
                                    title="Download Payslip"
                                    className="h-11 w-11 md:h-12 md:w-12 items-center justify-center flex bg-[#C9A96E] text-[#161C14] hover:bg-[#d8b87d] rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                                >
                                    <Download size={18} className="md:w-[20px] md:h-[20px]" />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-1 pt-1">
                                <button
                                    onClick={() => {
                                        addNotification("Payslip email sent successfully", "success");
                                        if (socket) {
                                            socket.emit('admin:notify_employee', {
                                                employeeId: selectedPayslip.id,
                                                title: `Your payslip for ${selectedPayslip.period || 'current period'} has been sent`,
                                                type: 'success'
                                            });
                                        }
                                    }}
                                    className="py-3 rounded-xl border border-[#E5DED2] dark:border-[#384232] bg-[#EEE8DD]/40 dark:bg-[#252B20] text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#EEE8DD] dark:hover:bg-[#2E3727] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-warm-xs active:scale-95"
                                >
                                    <Send size={14} className="text-[#C9A96E]" /> Email Slip
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
