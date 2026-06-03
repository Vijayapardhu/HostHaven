import api from './api';

export type ExportEntity = 
  | 'users' 
  | 'vendors' 
  | 'properties' 
  | 'rooms'
  | 'bookings' 
  | 'services' 
  | 'temples' 
  | 'coupons' 
  | 'platformCities' 
  | 'platformAmenities' 
  | 'cancellationPolicies' 
  | 'payouts' 
  | 'payments' 
  | 'refunds' 
  | 'reviews' 
  | 'serviceBookings'
  | 'supportTickets';

export const downloadCsvExport = async (entity: ExportEntity) => {
    try {
        const response = await api.get(`/v1/admin/export/${entity}`, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const filename = `${entity}_export_${new Date().toISOString().split('T')[0]}.csv`;

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error(`Failed to export ${entity}:`, error);
        throw error;
    }
};

export const downloadExcelExport = async (entity: ExportEntity) => {
    try {
        const response = await api.get(`/v1/admin/export/${entity}/excel`, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const filename = `${entity}_export_${new Date().toISOString().split('T')[0]}.xlsx`;

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error(`Failed to export ${entity}:`, error);
        throw error;
    }
};

export const downloadTemplate = async (entity: ExportEntity) => {
    try {
        const response = await api.get(`/v1/admin/template/${entity}`, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const filename = `${entity}_template.xlsx`;

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error(`Failed to download template for ${entity}:`, error);
        throw error;
    }
};

export interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

export const uploadImport = async (entity: ExportEntity, file: File): Promise<ImportResult> => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/v1/admin/import/${entity}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data;
    } catch (error) {
        console.error(`Failed to import ${entity}:`, error);
        throw error;
    }
};

export const getImportEntities = async () => {
    try {
        const response = await api.get('/v1/admin/import/entities');
        return response.data.data;
    } catch (error) {
        console.error('Failed to get import entities:', error);
        throw error;
    }
};
