import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

let activeRequests = 0;

const startRequest = () => {
    activeRequests++;
    if (activeRequests === 1) {
        window.dispatchEvent(new Event('global-loading-start'));
    }
};

const stopRequest = () => {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
        window.dispatchEvent(new Event('global-loading-stop'));
    }
};

apiClient.interceptors.request.use(
    (config) => {
        startRequest();
        
        // Fallback for when cookies are blocked/not available
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo && userInfo !== 'undefined') {
            try {
                const parsed = JSON.parse(userInfo);
                if (parsed.token) {
                    config.headers.Authorization = `Bearer ${parsed.token}`;
                }
            } catch (e) {
                console.error("Error parsing userInfo for token", e);
            }
        }
        
        return config;
    },
    (error) => {
        stopRequest();
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        stopRequest();
        return response;
    },
    (error) => {
        stopRequest();
        if (error.response) {
            const status = error.response.status;

            // 401 Unauthorized → session expired
            if (status === 401) {
                const isAuthRequest = error.config.url.includes('/auth/login') || 
                                       error.config.url.includes('/auth/register') ||
                                       error.config.url.includes('/auth/verify-otp');
                if (!isAuthRequest) {
                    window.dispatchEvent(new Event('session-expired'));
                }
            }

        }
        return Promise.reject(error);
    }
);

export default apiClient;
