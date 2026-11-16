import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, Table, Loader2 } from 'lucide-react';
import { executeExport } from '../../utils/exportEngine';
import { toast } from '../../utils/toastManager';
import { cn } from '../../utils/cn';

/**
 * Reusable Universal Export Dropdown
 * 
 * Props:
 * - data: Array of items to export (must be already filtered)
 * - columns: Array of { header, key, formatter }
 * - fileName: string base file name (without extension)
 * - metadata: { title, dateRange, filters }
 * - disabled: boolean
 * - className: optional string
 */
export function ExportDropdown({
    data = [],
    columns = [],
    fileName = 'export-report',
    metadata = {},
    disabled = false,
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [exportingFormat, setExportingFormat] = useState(null);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExport = async (format) => {
        if (!data || data.length === 0) {
            toast.error('No report data to export for current filters');
            setIsOpen(false);
            return;
        }

        try {
            setExportingFormat(format);
            await executeExport({
                data,
                columns,
                fileName,
                format,
                metadata,
            });
            toast.success(`Successfully exported ${format.toUpperCase()} (${data.length} records)`);
        } catch (err) {
            console.error('Export failed:', err);
            toast.error(err.message || 'Export failed');
        } finally {
            setExportingFormat(null);
            setIsOpen(false);
        }
    };

    const isBusy = exportingFormat !== null;

    return (
        <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => !disabled && !isBusy && setIsOpen(prev => !prev)}
                disabled={disabled || isBusy}
                title="Export Report Data"
                className={cn(
                    "flex h-10 items-center gap-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 active:scale-95 text-xs font-bold",
                    (disabled || isBusy) && "opacity-50 cursor-not-allowed",
                    isOpen && "ring-2 ring-primary-500/20 border-primary-500"
                )}
            >
                {isBusy ? (
                    <Loader2 size={16} className="animate-spin text-primary-600" />
                ) : (
                    <Download size={16} className="text-slate-500 dark:text-slate-400" />
                )}
                <span className="hidden sm:inline">Export</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Choose Format ({data.length} rows)
                    </div>

                    <button
                        type="button"
                        onClick={() => handleExport('csv')}
                        disabled={isBusy}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                        <Table size={15} className="text-emerald-500" />
                        <span>CSV Spreadsheet (.csv)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleExport('xlsx')}
                        disabled={isBusy}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                        <FileSpreadsheet size={15} className="text-blue-500" />
                        <span>Excel Workbook (.xlsx)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleExport('pdf')}
                        disabled={isBusy}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                        <FileText size={15} className="text-rose-500" />
                        <span>PDF Document (.pdf)</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default ExportDropdown;
