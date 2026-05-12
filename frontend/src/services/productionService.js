import apiClient from '../api/apiClient';

const productionService = {
    getAll: async () => {
        const { data } = await apiClient.get('/production');
        return data;
    },

    create: async (jobData) => {
        const { data } = await apiClient.post('/production', jobData);
        return data;
    },

    updateJob: async (id, jobData) => {
        const { data } = await apiClient.put(`/production/${id}`, jobData);
        return data;
    },

    startJob: async (id) => {
        const { data } = await apiClient.put(`/production/start/${id}`);
        return data;
    },

    updateProgress: async (id, producedQty) => {
        const { data } = await apiClient.put(`/production/update/${id}`, { producedQty });
        return data;
    },

    completeJob: async (id) => {
        const { data } = await apiClient.put(`/production/complete/${id}`);
        return data;
    },

    delete: async (id) => {
        const { data } = await apiClient.delete(`/production/${id}`);
        return data;
    }
};

export default productionService;
