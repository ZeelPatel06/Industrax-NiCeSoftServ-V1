import apiClient from '../api/apiClient';

const authService = {
    login: async (email, password) => {
        const { data } = await apiClient.post('/auth/login', { email, password });
        return data; // returns user info without token (it's in an HttpOnly cookie)
    },

    register: async (userData) => {
        const { data } = await apiClient.post('/auth/register', userData);
        return data; // returns user info without token
    },

    verifyOtp: async (email, otp) => {
        const { data } = await apiClient.post('/auth/verify-otp', { email, otp });
        return data; 
    },

    changePassword: async (passwordData) => {
        const { data } = await apiClient.put('/auth/change-password', passwordData);
        return data;
    },

    forgotPassword: async (email) => {
        const { data } = await apiClient.post('/auth/forgot-password', { email });
        return data;
    },

    resetPassword: async (resetData) => {
        const { data } = await apiClient.post('/auth/reset-password', resetData);
        return data;
    },

    logout: async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed on backend', error);
        }
        localStorage.removeItem('userInfo');
        window.location.href = '/login'; // Force redirect to login
    }
};

export default authService;
