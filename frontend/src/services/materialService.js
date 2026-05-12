import apiClient from '../api/apiClient';

const materialService = {
    getAll: async () => {
        const { data } = await apiClient.get('/materials');
        return data;
    },

    create: async (materialData) => {
        const { data } = await apiClient.post('/materials', materialData);
        return data;
    },

    update: async (id, materialData) => {
        const { data } = await apiClient.put(`/materials/${id}`, materialData);
        return data;
    },

    delete: async (id) => {
        const { data } = await apiClient.delete(`/materials/${id}`);
        return data;
    }
};

export default materialService;
