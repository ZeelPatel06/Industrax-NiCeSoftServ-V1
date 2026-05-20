import apiClient from '../api/apiClient';

const jobWorkService = {
    getAll: async () => {
        const { data } = await apiClient.get('/job-work');
        return data;
    },
    create: async (orderData) => {
        const { data } = await apiClient.post('/job-work', orderData);
        return data;
    },
    update: async (id, orderData) => {
        const { data } = await apiClient.put(`/job-work/${id}`, orderData);
        return data;
    },
    delete: async (id) => {
        const { data } = await apiClient.delete(`/job-work/${id}`);
        return data;
    },
    syncCatalog: async (id) => {
        const { data } = await apiClient.post(`/job-work/${id}/sync`);
        return data;
    },
    // Materials
    getMaterials: async () => { const { data } = await apiClient.get('/job-work/materials'); return data; },
    createMaterial: async (d) => { const { data } = await apiClient.post('/job-work/materials', d); return data; },
    updateMaterial: async (id, d) => { const { data } = await apiClient.put(`/job-work/materials/${id}`, d); return data; },
    deleteMaterial: async (id) => { const { data } = await apiClient.delete(`/job-work/materials/${id}`); return data; },

    // Parts
    getParts: async () => { const { data } = await apiClient.get('/job-work/parts'); return data; },
    createPart: async (d) => { const { data } = await apiClient.post('/job-work/parts', d); return data; },
    updatePart: async (id, d) => { const { data } = await apiClient.put(`/job-work/parts/${id}`, d); return data; },
    deletePart: async (id) => { const { data } = await apiClient.delete(`/job-work/parts/${id}`); return data; },

    // Products
    getProducts: async () => { const { data } = await apiClient.get('/job-work/products'); return data; },
    createProduct: async (d) => { const { data } = await apiClient.post('/job-work/products', d); return data; },
    updateProduct: async (id, d) => { const { data } = await apiClient.put(`/job-work/products/${id}`, d); return data; },
    deleteProduct: async (id) => { const { data } = await apiClient.delete(`/job-work/products/${id}`); return data; },

    // BOMs
    getBOMItems: async (params) => { const { data } = await apiClient.get('/job-work/bom', { params }); return data; },
    addBOMItem: async (d) => { const { data } = await apiClient.post('/job-work/bom', d); return data; },
    updateBOMItem: async (id, d) => { const { data } = await apiClient.put(`/job-work/bom/${id}`, d); return data; },
    deleteBOMItem: async (id) => { const { data } = await apiClient.delete(`/job-work/bom/${id}`); return data; },

    // Inventory
    getInventoryTransactions: async () => { const { data } = await apiClient.get('/job-work/inventory/transactions'); return data; },
    addInventoryIn: async (d) => { const { data } = await apiClient.post('/job-work/inventory/in', d); return data; },
    addInventoryOut: async (d) => { const { data } = await apiClient.post('/job-work/inventory/out', d); return data; }
};

export default jobWorkService;
