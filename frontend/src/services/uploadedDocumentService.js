import apiClient from '../api/apiClient';

const uploadedDocumentService = {
    getAll: async () => {
        const { data } = await apiClient.get('/uploaded-documents');
        return data;
    },
    upload: async (clientName, projectName, pdfFile, pdfFileName) => {
        const { data } = await apiClient.post('/uploaded-documents', {
            clientName,
            projectName,
            pdfFile,
            pdfFileName,
        });
        return data;
    },
    delete: async (id) => {
        const { data } = await apiClient.delete(`/uploaded-documents/${id}`);
        return data;
    },
};

export default uploadedDocumentService;
