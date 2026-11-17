import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Building, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function ProfileDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const currentUser = user;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const getRoleBrandColor = (role) => {
        const r = role?.toUpperCase();
        if (r === 'ADMIN') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300';
        if (r === 'MANAGER') return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
                {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Profile" className="h-9 w-9 rounded-full object-cover ring-2 ring-indigo-500/20" />
                ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
                        <span className="text-xs font-black">{(currentUser?.fullName || currentUser?.name || 'User').substring(0, 2).toUpperCase()}</span>
                    </div>
                )}

                <div className="hidden text-left md:block pr-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                        {currentUser?.fullName || currentUser?.name || 'User'}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {currentUser?.role || 'Member'}
                    </p>
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-200 z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-850">
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black text-sm">
                                <span>{(currentUser?.fullName || currentUser?.name || '??').substring(0, 2).toUpperCase()}</span>
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser?.fullName || currentUser?.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
                            <span className={`inline-block mt-1.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md ${getRoleBrandColor(currentUser?.role)}`}>
                                {currentUser?.role}
                            </span>
                        </div>
                    </div>

                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => {
                                const rolePath = currentUser?.role?.toLowerCase();
                                navigate(`/${rolePath}/settings/personal`);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            <Settings size={16} className="text-slate-400" />
                            Personal Settings
                        </button>

                        {currentUser?.role === 'ADMIN' && (
                            <button
                                onClick={() => {
                                    navigate('/admin/settings/company');
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <Building size={16} className="text-slate-400" />
                                Organization Settings
                            </button>
                        )}

                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                        >
                            <LogOut size={16} />
                            Log Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
