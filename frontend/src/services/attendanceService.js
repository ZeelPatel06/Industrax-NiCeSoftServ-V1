import apiClient from '../api/apiClient';

const attendanceService = {
    getAll: async (date) => {
        const url = date ? `/attendance?date=${date}` : '/attendance';
        const { data } = await apiClient.get(url);
        return data;
    },
    mark: async (attendanceData) => {
        const { data } = await apiClient.post('/attendance', attendanceData);
        return data;
    }
};

export default attendanceService;
