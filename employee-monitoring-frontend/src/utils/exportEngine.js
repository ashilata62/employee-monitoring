import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Universal Data Export Engine
 * Supports CSV, Excel (.xlsx), and PDF with custom columns, formatting, and report metadata.
 */

/**
 * Helper to get formatted value for a row and column
 */
const getFieldValue = (row, col) => {
    if (typeof col.formatter === 'function') {
        return col.formatter(row[col.key], row);
    }
    const val = row[col.key];
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
};

/**
 * Export data as CSV
 */
export const exportToCSV = (data, columns, fileName = 'report') => {
    if (!data || data.length === 0) {
        throw new Error('No data available to export');
    }

    const headers = columns.map(c => `"${(c.header || c.key || '').replace(/"/g, '""')}"`).join(',');
    const rows = data.map(row =>
        columns.map(col => {
            const val = getFieldValue(row, col);
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
    );

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName.replace(/\.csv$/i, '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
};

/**
 * Export data as Excel (.xlsx)
 */
export const exportToExcel = (data, columns, fileName = 'report', metadata = {}) => {
    if (!data || data.length === 0) {
        throw new Error('No data available to export');
    }

    // Build worksheet rows
    const sheetData = [];

    // Optional metadata headers
    if (metadata.title) {
        sheetData.push([metadata.title]);
        if (metadata.dateRange) sheetData.push([`Date Range: ${metadata.dateRange}`]);
        if (metadata.generatedAt) sheetData.push([`Generated At: ${metadata.generatedAt}`]);
        sheetData.push([]); // blank row
    }

    // Header row
    sheetData.push(columns.map(c => c.header || c.key));

    // Data rows
    data.forEach(row => {
        sheetData.push(columns.map(col => getFieldValue(row, col)));
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Auto-fit column widths
    const colWidths = columns.map((col, idx) => {
        let maxLen = (col.header || '').length;
        data.forEach(row => {
            const val = getFieldValue(row, col);
            if (val && val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    XLSX.writeFile(workbook, `${fileName.replace(/\.xlsx$/i, '')}.xlsx`);
    return true;
};

/**
 * Export data as PDF with professional styling
 */
export const exportToPDF = (data, columns, fileName = 'report', metadata = {}) => {
    if (!data || data.length === 0) {
        throw new Error('No data available to export');
    }

    // Orientation: landscape if many columns, else portrait
    const orientation = columns.length > 5 ? 'landscape' : 'portrait';
    const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Primary brand colors
    const primaryColor = [79, 70, 229]; // Indigo
    const textColor = [30, 41, 59];
    const lightMuted = [148, 163, 184];

    // Header block
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(metadata.title || 'Report Export', 40, 28);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
        metadata.generatedAt ? `Generated: ${metadata.generatedAt}` : new Date().toLocaleString(),
        pageWidth - 40,
        28,
        { align: 'right' }
    );

    // Subtitle / Filters
    let startY = 65;
    if (metadata.dateRange || metadata.filters) {
        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        if (metadata.dateRange) {
            doc.text(`Period: ${metadata.dateRange}`, 40, startY);
            startY += 16;
        }
        if (metadata.filters) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`Filters: ${metadata.filters}`, 40, startY);
            startY += 16;
        }
    }

    // Table Data
    const head = [columns.map(c => c.header || c.key)];
    const body = data.map(row => columns.map(col => getFieldValue(row, col)));

    autoTable(doc, {
        head,
        body,
        startY: startY + 5,
        margin: { left: 40, right: 40 },
        theme: 'striped',
        styles: {
            fontSize: 9,
            cellPadding: 6,
            textColor: [51, 65, 85],
            lineColor: [226, 232, 240],
            lineWidth: 0.5,
        },
        headStyles: {
            fillColor: [79, 70, 229],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        didDrawPage: (dataObj) => {
            // Footer
            const str = `Page ${doc.internal.getNumberOfPages()}`;
            doc.setFontSize(8);
            doc.setTextColor(...lightMuted);
            doc.text(str, pageWidth - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
            doc.text('Employee Monitoring Intelligence', 40, doc.internal.pageSize.getHeight() - 20);
        },
    });

    doc.save(`${fileName.replace(/\.pdf$/i, '')}.pdf`);
    return true;
};

/**
 * Universal dispatcher
 */
export const executeExport = async ({ data, columns, fileName = 'report', format = 'csv', metadata = {} }) => {
    if (!data || data.length === 0) {
        throw new Error('No data available to export with current filters');
    }

    const enhancedMetadata = {
        generatedAt: new Date().toLocaleString(),
        ...metadata,
    };

    switch (format.toLowerCase()) {
        case 'csv':
            return exportToCSV(data, columns, fileName);
        case 'xlsx':
        case 'excel':
            return exportToExcel(data, columns, fileName, enhancedMetadata);
        case 'pdf':
            return exportToPDF(data, columns, fileName, enhancedMetadata);
        default:
            throw new Error(`Unsupported export format: ${format}`);
    }
};

export default {
    exportToCSV,
    exportToExcel,
    exportToPDF,
    executeExport,
};
