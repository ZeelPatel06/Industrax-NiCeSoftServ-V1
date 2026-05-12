import apiClient from '../api/apiClient';

const exportData = async () => {
    const { data } = await apiClient.get('/data/export', {
        responseType: 'blob',
    });
    return data;
};

const importData = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post('/data/import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

const dataService = {
    exportData,
    importData,
};

export default dataService;
