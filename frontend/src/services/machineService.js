import apiClient from '../api/apiClient';

const machineService = {
    getMachines: async () => {
        const { data } = await apiClient.get('/machines');
        return data;
    },

    createMachine: async (machineData) => {
        const { data } = await apiClient.post('/machines', machineData);
        return data;
    },

    updateMachine: async (id, machineData) => {
        const { data } = await apiClient.put(`/machines/${id}`, machineData);
        return data;
    },

    deactivateMachine: async (id) => {
        const { data } = await apiClient.delete(`/machines/${id}`);
        return data;
    }
};

export default machineService;
