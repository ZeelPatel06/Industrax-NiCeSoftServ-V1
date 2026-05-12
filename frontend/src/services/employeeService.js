import apiClient from '../api/apiClient';

const employeeService = {
    getAll: async () => {
        const { data } = await apiClient.get('/employees');
        return data;
    },
    create: async (employeeData) => {
        const { data } = await apiClient.post('/employees', employeeData);
        return data;
    },
    update: async (id, employeeData) => {
        const { data } = await apiClient.put(`/employees/${id}`, employeeData);
        return data;
    },
    delete: async (id) => {
        const { data } = await apiClient.delete(`/employees/${id}`);
        return data;
    }
};

export default employeeService;
