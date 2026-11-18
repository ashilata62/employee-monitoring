import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LocationTracker } from '../components/LocationTracker';

export function DashboardLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && mobileOpen) {
                setMobileOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mobileOpen]);

    // Prevent background scrolling on mobile when navigation drawer is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileOpen]);

    return (
        <div className="h-screen overflow-hidden overflow-x-hidden bg-[#F5F1E9] dark:bg-[#1A1F18] text-[#29291F] dark:text-[#F5F1E9]">
            <LocationTracker />
            
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity lg:hidden ${
                    mobileOpen ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0"
                }`}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
            />

            {/* Sidebar Container (Drawer on mobile/tablet, Collapsible on desktop) */}
            <div
                className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <Sidebar
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    onMobileClose={() => setMobileOpen(false)}
                />
            </div>

            <div
                className={`flex flex-col h-screen transition-all duration-300 ${
                    collapsed ? "md:pl-20" : "md:pl-64"
                }`}
            >
                <Header onMenuClick={() => setMobileOpen(true)} />
                <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto scrollbar-thin bg-[#F5F1E9] dark:bg-[#1A1F18] max-w-full overflow-x-hidden">
                    <div className="mx-auto max-w-7xl pb-16 w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
