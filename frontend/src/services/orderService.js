import apiClient from '../api/apiClient';

const orderService = {
    getAll: async () => {
        const { data } = await apiClient.get('/orders');
        return data;
    },

    create: async (orderData) => {
        const { data } = await apiClient.post('/orders', orderData);
        return data;
    },

    update: async (id, orderData) => {
        const { data } = await apiClient.put(`/orders/${id}`, orderData);
        return data;
    },
    
    updateStatus: async (id, status) => {
        const { data } = await apiClient.put(`/orders/${id}/status`, { status });
        return data;
    },

    delete: async (id) => {
        const { data } = await apiClient.delete(`/orders/${id}`);
        return data;
    }
};

export default orderService;
