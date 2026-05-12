import apiClient from '../api/apiClient';

const dashboardService = {
    getActivity: async () => {
        const { data } = await apiClient.get('/dashboard/activity');
        return data;
    }
};

export default dashboardService;
