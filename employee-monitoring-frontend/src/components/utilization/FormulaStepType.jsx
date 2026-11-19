import React from 'react';
import { FORMULA_TYPES } from '../../store/utilizationStore';
import { cn } from '../../utils/cn';

export function FormulaStepType({ selected, onChange }) {
    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
            {FORMULA_TYPES.map((type) => (
                <label key={type.id} className={cn(
                    'flex items-start gap-4 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all',
                    selected === type.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                )}>
                    <input
                        type="radio"
                        name="formulaType"
                        value={type.id}
                        checked={selected === type.id}
                        onChange={() => onChange(type.id)}
                        className="accent-primary-600 mt-1 shrink-0"
                    />
                    <div>
                        <p className={cn('text-sm font-black mb-0.5', selected === type.id ? 'text-primary-700 dark:text-primary-400' : 'text-slate-900 dark:text-white')}>
                            {type.label}
                        </p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{type.desc}</p>
                    </div>
                </label>
            ))}
        </div>
    );
}
