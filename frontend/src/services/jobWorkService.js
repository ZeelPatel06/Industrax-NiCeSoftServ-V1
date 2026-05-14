import apiClient from '../api/apiClient';

const jobWorkService = {
    getAll: async () => {
        const { data } = await apiClient.get('/job-work');
        return data;
    },
    create: async (orderData) => {
        const { data } = await apiClient.post('/job-work', orderData);
        return data;
    },
    update: async (id, orderData) => {
        const { data } = await apiClient.put(`/job-work/${id}`, orderData);
        return data;
    },
    delete: async (id) => {
        const { data } = await apiClient.delete(`/job-work/${id}`);
        return data;
    },
    syncCatalog: async (id) => {
        const { data } = await apiClient.post(`/job-work/${id}/sync`);
        return data;
    }
};

export default jobWorkService;
