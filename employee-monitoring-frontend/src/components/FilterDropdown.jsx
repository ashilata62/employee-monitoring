import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronRight, User, Users, X } from 'lucide-react';
import { useRealTime } from '../hooks/RealTimeContext';
import { useFilterStore } from '../store/filterStore';

export function FilterDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState('main'); // 'main' | 'Employee' | 'Teams'
    const dropdownRef = useRef(null);
    const { employees, teams } = useRealTime();
    const { setEmployee, setTeam, selectedEmployee, selectedTeam } = useFilterStore();

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setActiveMenu('main');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const menuItems = [
        { id: 'Employee', label: 'Employee', icon: User },
        { id: 'Teams', label: 'Teams', icon: Users },
    ];

    const handleSelect = (type, id) => {
        if (type === 'Employee') setEmployee(id);
        if (type === 'Teams') setTeam(id);
        setIsOpen(false);
        setActiveMenu('main');
    };

    const clearFilters = (e) => {
        e.stopPropagation();
        setEmployee(null);
        setTeam(null);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-10 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedEmployee || selectedTeam 
                    ? "bg-[#30382B] border-[#30382B] text-[#FDFBF7]" 
                    : "bg-[#EEE8DD] dark:bg-[#252B20] border-[#D6CDBC] dark:border-[#384232] text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF]"
                }`}
            >
                <Plus size={14} className={selectedEmployee || selectedTeam ? "text-[#D3B98D]" : "text-[#777367]"} />
                <span>{selectedEmployee ? 'Employee Filtered' : selectedTeam ? 'Team Filtered' : 'Add Filter'}</span>
                {(selectedEmployee || selectedTeam) && (
                    <X size={14} className="ml-1 text-[#D3B98D] hover:text-white" onClick={clearFilters} />
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 sm:left-0 mt-2 w-64 bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl shadow-warm-lg border border-[#D6CDBC] dark:border-[#384232] z-[100] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {activeMenu === 'main' ? (
                        <>
                            <div className="px-4 py-2 text-[10px] font-semibold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider border-b border-[#D6CDBC] dark:border-[#384232] mb-1">
                                Filter By
                            </div>
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] transition-colors flex items-center justify-between group cursor-pointer"
                                    onClick={() => setActiveMenu(item.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={15} className="text-[#B9955B]" />
                                        <span>{item.label}</span>
                                    </div>
                                    <ChevronRight size={14} className="text-[#777367]" />
                                </button>
                            ))}
                        </>
                    ) : activeMenu === 'Employee' ? (
                        <>
                            <div className="flex items-center gap-2 px-3 py-1 mb-1 border-b border-[#D6CDBC] dark:border-[#384232] pb-2">
                                <button onClick={() => setActiveMenu('main')} className="p-1 hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] rounded-lg text-[#777367] cursor-pointer">
                                    <ChevronRight size={14} className="rotate-180" />
                                </button>
                                <span className="text-[10px] font-semibold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider">Select Employee</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <button
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#777367] hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] cursor-pointer"
                                    onClick={() => handleSelect('Employee', null)}
                                >
                                    All Employees
                                </button>
                                {employees.map(emp => (
                                    <button
                                        key={emp.id}
                                        className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2.5 cursor-pointer ${
                                            selectedEmployee === emp.id ? 'text-[#30382B] dark:text-[#D3B98D] bg-[#E5DDCF] dark:bg-[#1E2419] font-semibold' : 'text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419]'
                                        }`}
                                        onClick={() => handleSelect('Employee', emp.id)}
                                    >
                                        <div className="h-6 w-6 rounded-full bg-[#D6CDBC] overflow-hidden shrink-0">
                                            <img src={emp.avatar || `https://ui-avatars.com/api/?name=${emp.name}`} alt="" className="h-full w-full object-cover" />
                                        </div>
                                        <span className="truncate">{emp.name}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : activeMenu === 'Teams' ? (
                        <>
                            <div className="flex items-center gap-2 px-3 py-1 mb-1 border-b border-[#D6CDBC] dark:border-[#384232] pb-2">
                                <button onClick={() => setActiveMenu('main')} className="p-1 hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] rounded-lg text-[#777367] cursor-pointer">
                                    <ChevronRight size={14} className="rotate-180" />
                                </button>
                                <span className="text-[10px] font-semibold text-[#777367] dark:text-[#A8A295] uppercase tracking-wider">Select Team</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <button
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#777367] hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] cursor-pointer"
                                    onClick={() => handleSelect('Teams', null)}
                                >
                                    All Teams
                                </button>
                                {teams.map(team => (
                                    <button
                                        key={team.id}
                                        className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                                            selectedTeam === team.id ? 'text-[#30382B] dark:text-[#D3B98D] bg-[#E5DDCF] dark:bg-[#1E2419] font-semibold' : 'text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419]'
                                        }`}
                                        onClick={() => handleSelect('Teams', team.id)}
                                    >
                                        {team.name}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
}
