import apiClient from '../api/apiClient';

const productService = {
    getAll: async () => {
        const { data } = await apiClient.get('/products');
        return data;
    },

    create: async (productData) => {
        const { data } = await apiClient.post('/products', productData);
        return data;
    },

    update: async (id, productData) => {
        const { data } = await apiClient.put(`/products/${id}`, productData);
        return data;
    },

    delete: async (id) => {
        const { data } = await apiClient.delete(`/products/${id}`);
        return data;
    }
};

export default productService;
