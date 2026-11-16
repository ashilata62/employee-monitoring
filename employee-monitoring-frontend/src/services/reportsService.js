import api from './apiClient';
import { executeExport } from '../utils/exportEngine';

export const getReportData = async (type, params) => {
    const response = await api.get('/reports', { params: { type, ...params } });
    return response.data;
};

/**
 * Universal export utility for report data
 */
export const exportReportData = async ({ data, columns, fileName, format, metadata }) => {
    return executeExport({ data, columns, fileName, format, metadata });
};

export default {
    getReportData,
    exportReportData,
};
