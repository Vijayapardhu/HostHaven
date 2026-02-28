import api from './api';

export const downloadCsvExport = async (entity: 'users' | 'vendors' | 'properties' | 'bookings' | 'payouts' | 'payments' | 'refunds') => {
    try {
        const response = await api.get(`/v1/admin/export/${entity}`, {
            responseType: 'blob', // Important: this tells Axios to handle the response as a Blob
        });

        // Create a Blob from the CSV Stream
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);

        // Extract filename from Content-Disposition header if available, else derive it
        const contentDisposition = response.headers['content-disposition'];
        let filename = `${entity}_export_${new Date().toISOString().split('T')[0]}.csv`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch && filenameMatch.length === 2) {
                filename = filenameMatch[1];
            }
        }

        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Clean up
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
