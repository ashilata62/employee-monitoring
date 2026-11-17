import React from 'react';
import { cn } from '../../utils/cn';

export function BlurPreviewCard({ blurLevel }) {
    // blurLevel 0-5 → CSS blur 0-16px
    const blurPx = blurLevel * 3.2;

    return (
        <div className="relative rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden select-none">
            {/* Blurred overlay */}
            <div
                className="absolute inset-0 transition-all duration-300 z-10 pointer-events-none"
                style={{ backdropFilter: blurLevel > 0 ? `blur(${blurPx}px)` : 'none' }}
            />

            {/* Content */}
            <div className="p-6 relative z-0">
                {/* Title */}
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                    Title - 36pt
                </h2>

                {/* Body text */}
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                    Confidential internal document preview. When blur is enabled, sensitive employee screens and data are obscured automatically according to your organization privacy compliance policy.
                </p>

                {/* Fields row */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Password</p>
                        <div className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700">
                            <span className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-widest">••••••••</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Card Number</p>
                        <div className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700">
                            <span className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-widest">•••• •••• •••• 9101</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
