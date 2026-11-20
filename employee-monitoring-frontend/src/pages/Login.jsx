import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Shield, User, Monitor, Sparkles, Briefcase } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';
import { BASE_URL } from '../config/api';
import { getErrorMessage } from '../utils/errorHandler';

export function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();
    const { toast } = useToast();
    const [email, setEmail] = useState('admin@gmail.com');
    const [password, setPassword] = useState('123456');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address first.');
            return;
        }
        try {
            await authService.forgotPassword(email);
            toast.success('If an account exists, a reset link has been sent to your email.');
        } catch (err) {
            toast.error('Failed to process request.');
        }
    };

    const handleDownloadAgent = (e) => {
        if (e) e.preventDefault();
        const downloadUrl = 'https://raw.githubusercontent.com/ashilata62/employee-monitoring/main/employee-monitoirng-backend/public/agent/EMS-Tracker-latest.exe';

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', 'EMS-Tracker-latest.exe');
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleQuickLogin = async (role) => {
        setIsLoading(true);
        setError('');
        try {
            const roleKey = role.toLowerCase();
            let quickEmail = 'admin@gmail.com';
            if (roleKey === 'manager') quickEmail = 'rahul@gmail.com';
            if (roleKey === 'employee') quickEmail = 'test@gmail.com';
            const quickPass = '123456';
            setEmail(quickEmail);
            setPassword(quickPass);
            const res = await login(quickEmail, quickPass);
            const targetRole = res?.user?.role?.toLowerCase() || roleKey;
            navigate(`/${targetRole}`, { replace: true });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const data = await login(email, password);
            const rolePath = data.user.role.toLowerCase();
            navigate(`/${rolePath}`, { replace: true });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F1E9] dark:bg-[#1A1F18] p-4 text-[#29291F] dark:text-[#F5F1E9]">
            <div className="w-full max-w-md space-y-4">
                {/* Brand Header */}
                <div className="text-center">
                    <div className="inline-flex h-12 w-12 rounded-2xl bg-[#30382B] text-[#D3B98D] items-center justify-center mb-3 shadow-warm-md">
                        <Sparkles size={22} />
                    </div>
                    <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#29291F] dark:text-[#F5F1E9] tracking-tight leading-tight">
                        Employee Performance
                    </h1>
                    <p className="text-[10px] font-bold tracking-[0.25em] text-[#B9955B] uppercase mt-1">
                        Workforce Monitoring Center
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-[#FBF9F5] dark:bg-[#252B20] p-5 sm:p-8 rounded-3xl shadow-warm-lg border border-[#E5DED2] dark:border-[#384232]">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-[#777367] dark:text-[#B8B3A7] mb-1.5 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777367]" size={16} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-xl border border-[#E5DED2] bg-[#F5F1E9] py-2.5 pl-10 pr-4 text-xs font-semibold text-[#29291F] focus:border-[#B9955B] outline-none transition-all dark:bg-[#1E2419] dark:border-[#384232] dark:text-[#F5F1E9]"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[11px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-wider">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-[10px] font-bold text-[#B9955B] hover:text-[#A17D45] uppercase tracking-wider cursor-pointer"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777367]" size={16} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-xl border border-[#E5DED2] bg-[#F5F1E9] py-2.5 pl-10 pr-12 text-xs font-semibold text-[#29291F] focus:border-[#B9955B] outline-none transition-all dark:bg-[#1E2419] dark:border-[#384232] dark:text-[#F5F1E9]"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777367] hover:text-[#29291F] dark:hover:text-[#F5F1E9] cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl bg-[#FAF3F2] p-3 text-xs font-medium text-[#A84B4B] border border-[#EAC3BE]">
                                {error}
                            </div>
                        )}

                        {info && (
                            <div className="rounded-xl bg-[#F4F7F4] p-3 text-xs font-medium text-[#5E7D64] border border-[#C8DAC8]">
                                {info}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="relative flex w-full justify-center rounded-xl bg-[#30382B] hover:bg-[#3C4536] py-3 px-4 text-xs font-bold text-[#FDFBF7] shadow-warm-sm focus:outline-none transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest cursor-pointer"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin text-[#D3B98D]" size={18} />
                            ) : (
                                'Sign In to Workspace'
                            )}
                        </button>
                    </form>

                    {/* Quick Demo Access */}
                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-[#E5DED2] dark:border-[#384232]"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-[#FBF9F5] dark:bg-[#252B20] px-3 text-[#777367] font-bold tracking-widest leading-none">
                                Quick Demo Access
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('Admin')}
                            className="flex flex-col items-center gap-1 rounded-2xl border border-[#E5DED2] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] p-2.5 text-center transition-all hover:border-[#B9955B] group cursor-pointer"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#30382B] text-[#D3B98D] transition-transform group-hover:scale-105">
                                <Shield size={16} />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#29291F] dark:text-[#F5F1E9] leading-tight">Admin Portal</span>
                            <span className="text-[8px] text-[#777367] dark:text-[#A8A29E] leading-none truncate max-w-full">admin@gmail.com</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickLogin('Manager')}
                            className="flex flex-col items-center gap-1 rounded-2xl border border-[#E5DED2] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] p-2.5 text-center transition-all hover:border-[#B9955B] group cursor-pointer"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5E7D64] text-white transition-transform group-hover:scale-105">
                                <Briefcase size={16} />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#29291F] dark:text-[#F5F1E9] leading-tight">Manager Portal</span>
                            <span className="text-[8px] text-[#777367] dark:text-[#A8A29E] leading-none truncate max-w-full">rahul@gmail.com</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickLogin('Employee')}
                            className="flex flex-col items-center gap-1 rounded-2xl border border-[#E5DED2] dark:border-[#384232] bg-[#F5F1E9] dark:bg-[#1E2419] p-2.5 text-center transition-all hover:border-[#B9955B] group cursor-pointer"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#B9955B] text-white transition-transform group-hover:scale-105">
                                <User size={16} />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#29291F] dark:text-[#F5F1E9] leading-tight">Employee Portal</span>
                            <span className="text-[8px] text-[#777367] dark:text-[#A8A29E] leading-none truncate max-w-full">test@gmail.com</span>
                        </button>
                    </div>

                    {/* Desktop Monitoring Agent Callout */}
                    <div className="mt-5 rounded-2xl p-3.5 sm:p-4 bg-[#30382B] text-[#F5F1E9] border border-[#3C4536] shadow-warm-xs">
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
                            <div>
                                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <Monitor size={15} className="text-[#D3B98D]" />
                                    Desktop Monitoring Agent
                                </h4>
                                <p className="text-[10px] text-[#B8C2B3] mt-0.5">Windows desktop tracking client (.exe)</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleDownloadAgent}
                                className="px-3.5 py-1.5 bg-[#B9955B] hover:bg-[#A17D45] text-white rounded-xl text-[10px] font-bold transition-all shadow-xs uppercase tracking-wider shrink-0 text-center cursor-pointer active:scale-95"
                            >
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
