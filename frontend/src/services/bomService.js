import apiClient from '../api/apiClient';

const bomService = {
    getByProduct: async (productId) => {
        const { data } = await apiClient.get(`/bom/${productId}`);
        return data;
    },

    getAll: async () => {
        const { data } = await apiClient.get('/bom');
        return data;
    },

    addItem: async (bomData) => {
        const { data } = await apiClient.post('/bom', bomData);
        return data;
    },

    deleteItem: async (itemId) => {
        const { data } = await apiClient.delete(`/bom/item/${itemId}`);
        return data;
    },
    
    updateItem: async (itemId, bomData) => {
        const { data } = await apiClient.put(`/bom/item/${itemId}`, bomData);
        return data;
    }
};

export default bomService;
