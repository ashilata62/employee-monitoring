import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Shield, Users, User, Monitor } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';
import { API_BASE_URL, BASE_URL } from '../config/api';
import { getErrorMessage } from '../utils/errorHandler';

export function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const from = location.state?.from?.pathname || '/';

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

    const handleQuickLogin = async (role) => {
        setIsLoading(true);
        setError('');
        try {
            const email = `${role.toLowerCase()}@example.com`;
            const password = '123456';
            await login(email, password);
            navigate(`/${role.toLowerCase()}`, { replace: true });
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
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-2">
            <div className="w-full max-w-md space-y-2">
                <div className="text-center group cursor-default">
                    <div className="flex flex-col items-center mb-2">
                        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600 bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent leading-tight transition-transform duration-500 group-hover:scale-105 px-2 text-center">
                            Employee Performance Software
                        </h1>
                        <p className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-widest uppercase mt-1.5">
                            DSP Consultants
                        </p>
                        <div className="h-0.5 w-16 bg-primary-600 mt-2 rounded-full opacity-30"></div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase text-[10px]">Sign in to your portal</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Password</label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-tighter"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-12 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                                {error}
                            </div>
                        )}

                        {info && (
                            <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                                {info}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="relative flex w-full justify-center rounded-xl bg-primary-600 py-2.5 px-4 text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-white px-2 text-slate-500 dark:bg-slate-900 font-black tracking-widest leading-none">Quick Demo Access</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleQuickLogin('Admin')}
                            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 p-3 text-center transition-all hover:bg-primary-50 hover:border-primary-200 dark:border-slate-800 dark:hover:bg-primary-900/20 dark:hover:border-primary-800 group"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 transition-transform group-hover:scale-110">
                                <Shield size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 group-hover:text-primary-600">Admin</span>
                        </button>


                        <button
                            onClick={() => handleQuickLogin('Employee')}
                            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 p-3 text-center transition-all hover:bg-amber-50 hover:border-amber-200 dark:border-slate-800 dark:hover:bg-amber-900/20 dark:hover:border-amber-800 group"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 transition-transform group-hover:scale-110">
                                <User size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 group-hover:text-amber-600">Employee</span>
                        </button>
                    </div>

                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-white px-2 text-slate-500 dark:bg-slate-900 font-black tracking-widest leading-none">Monitor your work</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 -m-4 h-16 w-16 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all duration-700"></div>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                            <div className="text-center md:text-left">
                                <h4 className="text-base font-black text-white dark:text-slate-900 flex items-center justify-center md:justify-start gap-2">
                                    <Monitor size={18} className="text-primary-400" />
                                    Desktop Monitoring Agent
                                </h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium italic">Essential for performance tracking.</p>
                            </div>
                            <a
                                href={`${BASE_URL}/api/agent/download`}
                                download="EMS-Tracker-latest.exe"
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 dark:bg-primary-600 text-white rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40 uppercase"
                            >
                                <Monitor size={16} />
                                DOWNLOAD
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
