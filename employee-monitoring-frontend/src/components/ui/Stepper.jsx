import React from 'react';
import { cn } from '../../utils/cn';

export function Stepper({ steps, currentStep }) {
    return (
        <div className="flex items-center justify-center mb-8">
            {steps.map((step, i) => {
                const num = i + 1;
                const isActive = num === currentStep;
                const isComplete = num < currentStep;

                return (
                    <React.Fragment key={step.id}>
                        {/* Connector line */}
                        {i > 0 && (
                            <div className={cn(
                                'flex-1 h-px max-w-[80px] transition-all duration-500',
                                isComplete || (num === currentStep) ? 'bg-primary-400' : 'bg-slate-200 dark:bg-slate-700'
                            )} />
                        )}

                        {/* Step node */}
                        <div className="flex flex-col items-center gap-2">
                            <div className={cn(
                                'h-9 w-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all duration-300',
                                isComplete
                                    ? 'bg-[#30382B] dark:bg-[#B9955B] border-primary-600 text-white shadow-lg shadow-warm-xs dark:shadow-none'
                                    : isActive
                                        ? 'bg-white dark:bg-slate-900 border-primary-600 text-primary-600 shadow-lg shadow-warm-xs dark:shadow-none ring-4 ring-primary-100 dark:ring-primary-950/40'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                            )}>
                                {isComplete ? (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : num}
                            </div>
                            <span className={cn(
                                'text-[10px] font-bold whitespace-nowrap',
                                isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'
                            )}>
                                {step.label}
                            </span>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
}
