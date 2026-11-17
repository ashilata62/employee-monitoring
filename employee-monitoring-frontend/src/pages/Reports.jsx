import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function Reports() {
    const { role } = useAuthStore();

    if (role === 'EMPLOYEE') {
        return <Navigate to="/employee" replace />;
    }

    return (
        <div className="animate-in fade-in duration-500">
            <Outlet />
        </div>
    );
}
