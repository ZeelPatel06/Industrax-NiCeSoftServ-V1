import apiClient from '../api/apiClient';

const clientService = {
    getAll: async () => {
        const { data } = await apiClient.get('/clients');
        return data;
    },
    create: async (clientData) => {
        const { data } = await apiClient.post('/clients', clientData);
        return data;
    }
};

export default clientService;
