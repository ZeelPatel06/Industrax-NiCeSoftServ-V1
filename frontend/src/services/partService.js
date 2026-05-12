import apiClient from '../api/apiClient';

const partService = {
    getAll: async () => {
        const { data } = await apiClient.get('/parts');
        return data;
    },
    create: async (partData) => {
        const { data } = await apiClient.post('/parts', partData);
        return data;
    },
    update: async (id, partData) => {
        const { data } = await apiClient.put(`/parts/${id}`, partData);
        return data;
    },
    delete: async (id) => {
        const { data } = await apiClient.delete(`/parts/${id}`);
        return data;
    }
};

export default partService;
