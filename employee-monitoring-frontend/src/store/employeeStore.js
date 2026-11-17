import { create } from 'zustand';
import employeeService from '../services/employeeService';
import toast from '../services/toastService';

export const useEmployeeStore = create((set, get) => ({
    employees: [],
    isLoading: false,
    error: null,

    fetchEmployees: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await employeeService.getEmployees();
            set({ employees: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    createEmployee: async (data) => {
        set({ isLoading: true });
        try {
            const response = await employeeService.createEmployee(data);
            const newEmployee = response.data;
            set((state) => ({
                employees: [...state.employees, {
                    ...newEmployee,
                    name: newEmployee.fullName,
                    status: newEmployee.status?.toLowerCase() || 'active',
                    avatar: newEmployee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newEmployee.fullName)}&background=EEE8DD&color=30382B`
                }],
                isLoading: false
            }));
            toast.success('Employee created successfully in database');
            return response;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    inviteEmployee: async (inviteData) => {
        set({ isLoading: true });
        try {
            const response = await employeeService.inviteEmployee(inviteData);
            const newEmployee = response.data;
            set((state) => ({
                employees: [...state.employees, {
                    ...newEmployee,
                    name: newEmployee.fullName || newEmployee.name,
                    status: (newEmployee.status || 'active').toLowerCase(),
                    team: newEmployee.team ? (newEmployee.team.name || newEmployee.team) : 'General Team',
                    avatar: newEmployee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newEmployee.fullName || 'User')}&background=EEE8DD&color=30382B`
                }],
                isLoading: false
            }));
            // Immediately re-fetch from database to guarantee 100% sync
            get().fetchEmployees().catch(() => {});
            if (response.emailSimulated && response.setupLink) {
                toast.success(`Invited — setup link logged on server. ${response.setupLink}`);
            } else if (response.setupLink) {
                toast.success('Invitation email sent with agent setup link');
            } else {
                toast.success('Invitation sent successfully');
            }
            return response;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateEmployee: async (id, data) => {
        try {
            const response = await employeeService.updateEmployee(id, data);
            const updatedEmployee = response.data;
            set((state) => ({
                employees: state.employees.map((emp) =>
                    emp.id === id ? { ...emp, ...updatedEmployee, name: updatedEmployee.fullName || emp.name } : emp
                )
            }));
            toast.success('Employee updated successfully');
            return response;
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    removeEmployee: async (id) => {
        try {
            await employeeService.deleteEmployee(id);
            set((state) => ({
                employees: state.employees.filter((emp) => emp.id !== id)
            }));
            toast.success('Employee removed successfully');
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    }
}));
