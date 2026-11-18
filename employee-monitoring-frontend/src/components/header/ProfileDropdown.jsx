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
        if (r === 'ADMIN') return 'bg-[#30382B] text-[#FDFBF7]';
        if (r === 'MANAGER') return 'bg-[#B9955B] text-white';
        return 'bg-[#EEE8DD] text-[#29291F]';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-[#EEE8DD] dark:hover:bg-[#283025] transition-colors cursor-pointer"
            >
                {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Profile" className="h-9 w-9 rounded-full object-cover ring-1 ring-[#E5DED2]" />
                ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#B9955B] to-[#8C6D38] text-white shadow-xs">
                        <span className="text-xs font-bold font-serif">{(currentUser?.fullName || currentUser?.name || 'User').substring(0, 2).toUpperCase()}</span>
                    </div>
                )}

                <div className="hidden text-left md:block pr-2">
                    <p className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] leading-tight">
                        {currentUser?.fullName || currentUser?.name || 'User'}
                    </p>
                    <p className="text-[10px] font-semibold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-wider">
                        {currentUser?.role || 'Member'}
                    </p>
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#E5DED2] bg-[#FBF9F5] shadow-xl dark:border-[#384232] dark:bg-[#252B20] animate-in fade-in slide-in-from-top-2 duration-200 z-50 overflow-hidden">
                    <div className="p-4 border-b border-[#E5DED2] dark:border-[#384232] flex items-center gap-3 bg-[#EEE8DD]/30 dark:bg-[#1E2419]">
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#30382B] text-[#D3B98D]">
                                <span className="text-sm font-bold font-serif">{(currentUser?.fullName || currentUser?.name || '??').substring(0, 2).toUpperCase()}</span>
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-[#29291F] dark:text-[#F5F1E9] truncate">{currentUser?.fullName || currentUser?.name}</p>
                            <p className="text-xs text-[#777367] dark:text-[#B8B3A7] truncate">{currentUser?.email}</p>
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
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-[#29291F] dark:text-[#E2E8DE] hover:bg-[#EEE8DD] dark:hover:bg-[#2E362A] rounded-xl transition-colors"
                        >
                            <Settings size={16} className="text-[#777367]" />
                            Personal Settings
                        </button>

                        {currentUser?.role?.toUpperCase() === 'ADMIN' && (
                            <button
                                onClick={() => {
                                    const rolePath = currentUser?.role?.toLowerCase();
                                    navigate(`/${rolePath}/settings/organization`);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-[#29291F] dark:text-[#E2E8DE] hover:bg-[#EEE8DD] dark:hover:bg-[#2E362A] rounded-xl transition-colors"
                            >
                                <Building size={16} className="text-[#777367]" />
                                Organizations
                            </button>
                        )}
                    </div>

                    <div className="p-2 border-t border-[#E5DED2] dark:border-[#384232]">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-[#A84B4B] hover:bg-[#FAF3F2] dark:hover:bg-[#382626] rounded-xl transition-colors"
                        >
                            <LogOut size={16} className="text-[#A84B4B]" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
