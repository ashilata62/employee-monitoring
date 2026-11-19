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
    className = '',
    buttonClassName = ''
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
                    "flex h-9 items-center gap-1.5 px-3.5 rounded-xl border border-[#D6CDBC] dark:border-[#384232] bg-[#EEE8DD] dark:bg-[#252B20] text-[#29291F] dark:text-[#F5F1E9] shadow-warm-xs transition-all hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] active:scale-95 text-xs font-semibold cursor-pointer",
                    (disabled || isBusy) && "opacity-50 cursor-not-allowed",
                    isOpen && "ring-2 ring-primary-500/20 border-primary-500",
                    buttonClassName
                )}
            >
                {isBusy ? (
                    <Loader2 size={16} className="animate-spin text-primary-600" />
                ) : (
                    <Download size={16} className="text-[#29291F] dark:text-[#F5F1E9]" />
                )}
                <span className="hidden sm:inline">Export</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#EEE8DD] dark:bg-[#252B20] shadow-2xl border border-[#D6CDBC] dark:border-[#384232] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-[#D6CDBC] dark:border-[#384232] text-[10px] font-black uppercase tracking-wider text-[#777367] dark:text-[#B8B3A7]">
                        Choose Format ({data.length} rows)
                    </div>

                    <button
                        type="button"
                        onClick={() => handleExport('csv')}
                        disabled={isBusy}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] transition-colors text-left cursor-pointer"
                    >
                        <Table size={15} className="text-emerald-600" />
                        <span>CSV Spreadsheet (.csv)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleExport('xlsx')}
                        disabled={isBusy}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] transition-colors text-left cursor-pointer"
                    >
                        <FileSpreadsheet size={15} className="text-emerald-600" />
                        <span>Excel Workbook (.xlsx)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleExport('pdf')}
                        disabled={isBusy}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-[#29291F] dark:text-[#F5F1E9] hover:bg-[#E5DDCF] dark:hover:bg-[#1E2419] transition-colors text-left cursor-pointer"
                    >
                        <FileText size={15} className="text-rose-600" />
                        <span>PDF Document (.pdf)</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default ExportDropdown;
