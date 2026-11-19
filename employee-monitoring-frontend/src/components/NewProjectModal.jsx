import React, { useState, useEffect } from 'react';
import { X, Check, Users } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';

export function NewProjectModal({ isOpen, onClose, employees = [], teams = [], initialData = null }) {
    const { createProject, updateProject } = useProjectStore();
    const [projectName, setProjectName] = useState('');
    const [projectBillRate, setProjectBillRate] = useState('0');
    const [projectBudget, setProjectBudget] = useState('0');
    const [description, setDescription] = useState('');
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [showError, setShowError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setProjectName(initialData.projectName || initialData.name || '');
            setProjectBillRate(String(initialData.billRate || '0'));
            setProjectBudget(String(initialData.budget || initialData.totalCosts || '0'));
            setDescription(initialData.description || '');
            setSelectedEmployeeIds(initialData.assignedEmployeeIds || initialData.assignments?.map(a => a.employeeId) || []);
        } else {
            setProjectName('');
            setProjectBillRate('0');
            setProjectBudget('0');
            setDescription('');
            setSelectedEmployeeIds([]);
        }
        setShowError(false);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!projectName.trim()) {
            setShowError(true);
            return;
        }

        const projectData = {
            name: projectName.trim(),
            description: description.trim(),
            billRate: Number(projectBillRate) || 0,
            budget: Number(projectBudget) || 0,
            employeeIds: selectedEmployeeIds,
        };

        try {
            setIsSubmitting(true);
            if (initialData) {
                await updateProject(initialData.id, projectData);
            } else {
                await createProject(projectData);
            }
            onClose();
            if (!initialData) {
                setProjectName('');
                setProjectBillRate('0');
                setProjectBudget('0');
                setDescription('');
                setSelectedEmployeeIds([]);
            }
        } catch (error) {
            console.error('Failed to save project:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop with prominent blur and dimming */}
            <div 
                className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md transition-opacity animate-fade-in" 
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-lg bg-[#FBF9F5] dark:bg-[#252B20] text-[#29291F] dark:text-[#F5F1E9] rounded-2xl shadow-warm-xl border border-[#E5DED2] dark:border-[#384232] overflow-hidden animate-scale-in z-10 my-auto">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5DED2] dark:border-[#384232] flex items-center justify-between bg-[#F5F1E9]/50 dark:bg-[#1E2419]/50">
                    <div>
                        <h2 className="text-lg font-bold font-serif text-[#29291F] dark:text-[#F5F1E9]">
                            {initialData ? 'Edit Project' : 'New Project'}
                        </h2>
                        <p className="text-[11px] text-[#777367] dark:text-[#B8B3A7] mt-0.5">
                            {initialData ? 'Update project details and assignments' : 'Create a new project and assign team members'}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 rounded-xl text-[#777367] hover:text-[#29291F] dark:text-[#B8B3A7] dark:hover:text-[#F5F1E9] hover:bg-[#EEE8DD] dark:hover:bg-[#30382B] transition-all cursor-pointer"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSave}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
                        {/* Project Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] block">
                                Project Name <span className="text-[#A84B4B]">*</span>
                            </label>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => {
                                    setProjectName(e.target.value);
                                    if (showError) setShowError(false);
                                }}
                                placeholder="e.g. Website Redesign"
                                className={`w-full bg-[#F5F1E9] dark:bg-[#1E2419] border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] outline-none transition-all focus:border-[#B9955B] ${
                                    showError ? 'border-[#A84B4B]' : 'border-[#E5DED2] dark:border-[#384232]'
                                }`}
                            />
                            {showError && <p className="text-[10px] text-[#A84B4B] font-bold">Project name is required</p>}
                        </div>

                        {/* Bill Rate & Budget (2 columns) */}
                        <div className="grid grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] block">
                                    Bill Rate ($/hr)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777367] font-bold text-xs">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={projectBillRate}
                                        onChange={(e) => setProjectBillRate(e.target.value)}
                                        className="w-full bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#E5DED2] dark:border-[#384232] rounded-xl pl-7 pr-3 py-2.5 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] outline-none transition-all focus:border-[#B9955B]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] block">
                                    Estimated Costs ($)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777367] font-bold text-xs">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={projectBudget}
                                        onChange={(e) => setProjectBudget(e.target.value)}
                                        className="w-full bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#E5DED2] dark:border-[#384232] rounded-xl pl-7 pr-3 py-2.5 text-xs font-semibold text-[#29291F] dark:text-[#F5F1E9] outline-none transition-all focus:border-[#B9955B]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Project Description */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] block uppercase tracking-wider text-[10px]">
                                Project Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter project scope, goals, or notes..."
                                rows={3}
                                className="w-full bg-[#F5F1E9] dark:bg-[#1E2419] border border-[#E5DED2] dark:border-[#384232] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#29291F] dark:text-[#F5F1E9] placeholder-[#777367] outline-none transition-all focus:border-[#B9955B] resize-none"
                            />
                        </div>

                        {/* Assign Employees */}
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-[#777367] dark:text-[#B8B3A7] uppercase tracking-wider flex items-center gap-1.5">
                                    <Users size={12} className="text-[#B9955B]" />
                                    Assign Employees ({selectedEmployeeIds.length} Selected)
                                </label>
                                <span className="text-[10px] text-[#777367] dark:text-[#B8B3A7]">Click to toggle</span>
                            </div>
                            {employees && employees.length > 0 ? (
                                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-3 bg-[#F5F1E9] dark:bg-[#1E2419] rounded-xl border border-[#E5DED2] dark:border-[#384232]">
                                    {employees.map((emp) => {
                                        const isSelected = selectedEmployeeIds.includes(emp.id);
                                        return (
                                            <button
                                                key={emp.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedEmployeeIds(prev =>
                                                        prev.includes(emp.id)
                                                            ? prev.filter(id => id !== emp.id)
                                                            : [...prev, emp.id]
                                                    );
                                                }}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-[#30382B] text-[#FDFBF7] border-[#30382B] shadow-warm-xs'
                                                        : 'bg-[#FBF9F5] dark:bg-[#252B20] text-[#29291F] dark:text-[#F5F1E9] border-[#E5DED2] dark:border-[#384232] hover:border-[#B9955B]'
                                                }`}
                                            >
                                                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                                    isSelected ? 'border-[#B9955B] bg-[#B9955B]' : 'border-[#777367]'
                                                }`}>
                                                    {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                                                </div>
                                                <span>{emp.fullName || emp.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-[#777367] italic p-2 bg-[#F5F1E9] dark:bg-[#1E2419] rounded-xl border border-[#E5DED2] dark:border-[#384232]">
                                    No employees found to assign
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-[#F5F1E9]/60 dark:bg-[#1E2419]/60 border-t border-[#E5DED2] dark:border-[#384232] flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-[#D6CDBC] dark:border-[#384232] text-xs font-semibold text-[#777367] dark:text-[#B8B3A7] hover:bg-[#EEE8DD] dark:hover:bg-[#283025] transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl bg-[#30382B] hover:bg-[#3C4536] text-[#FDFBF7] text-xs font-bold transition-all shadow-warm-xs uppercase tracking-wider cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
