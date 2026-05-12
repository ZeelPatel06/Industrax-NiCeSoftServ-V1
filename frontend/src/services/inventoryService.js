import apiClient from '../api/apiClient';

const inventoryService = {
    getTransactions: async () => {
        const { data } = await apiClient.get('/inventory/transactions');
        return data;
    },

    stockIn: async (txData) => {
        const { data } = await apiClient.post('/inventory/in', txData);
        return data;
    },

    stockOut: async (txData) => {
        const { data } = await apiClient.post('/inventory/out', txData);
        return data;
    }
};

export default inventoryService;
