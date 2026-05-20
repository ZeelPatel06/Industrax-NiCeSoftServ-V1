import apiClient from '../api/apiClient';

const invoiceService = {
    getAll: async () => {
        const { data } = await apiClient.get('/invoices');
        return data;
    },
    create: async (invoiceData) => {
        const { data } = await apiClient.post('/invoices', invoiceData);
        return data;
    },
    getById: async (id) => {
        const { data } = await apiClient.get(`/invoices/${id}`);
        return data;
    },
    recordPayment: async (id, paidAmount) => {
        const { data } = await apiClient.put(`/invoices/${id}/payment`, { paidAmount });
        return data;
    },
    delete: async (id) => {
        const { data } = await apiClient.delete(`/invoices/${id}`);
        return data;
    },
    uploadPDF: async (id, pdfFile, pdfFileName) => {
        const { data } = await apiClient.put(`/invoices/${id}/pdf`, { pdfFile, pdfFileName });
        return data;
    }
};

export default invoiceService;
