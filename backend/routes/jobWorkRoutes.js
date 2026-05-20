import express from 'express';
import { getOrders, createOrder, updateOrder, deleteOrder, syncToCatalog } from '../controllers/jobWorkController.js';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../controllers/jobWorkMaterialController.js';
import { getParts, createPart, updatePart, deletePart } from '../controllers/jobWorkPartController.js';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/jobWorkProductController.js';
import { getBOMItems, addBOMItem, updateBOMItem, deleteBOMItem } from '../controllers/jobWorkBOMController.js';
import { getTransactions, addStockIn, addStockOut } from '../controllers/jobWorkInventoryController.js';

import { protect, ownerOrManager } from '../middleware/authMiddleware.js';

const router = express.Router();

// Materials
router.route('/materials').get(protect, getMaterials).post(ownerOrManager, createMaterial);
router.route('/materials/:id').put(ownerOrManager, updateMaterial).delete(ownerOrManager, deleteMaterial);

// Parts
router.route('/parts').get(protect, getParts).post(ownerOrManager, createPart);
router.route('/parts/:id').put(ownerOrManager, updatePart).delete(ownerOrManager, deletePart);

// Products
router.route('/products').get(protect, getProducts).post(ownerOrManager, createProduct);
router.route('/products/:id').put(ownerOrManager, updateProduct).delete(ownerOrManager, deleteProduct);

// BOM
router.route('/bom').get(protect, getBOMItems).post(ownerOrManager, addBOMItem);
router.route('/bom/:id').put(ownerOrManager, updateBOMItem).delete(ownerOrManager, deleteBOMItem);

// Inventory
router.route('/inventory/transactions').get(protect, getTransactions);
router.route('/inventory/in').post(ownerOrManager, addStockIn);
router.route('/inventory/out').post(ownerOrManager, addStockOut);

// Orders
router.route('/orders').get(protect, getOrders).post(ownerOrManager, createOrder);
router.route('/orders/:id/sync').post(ownerOrManager, syncToCatalog);
router.route('/orders/:id').put(ownerOrManager, updateOrder).delete(ownerOrManager, deleteOrder);

// Backward compatibility for existing frontend calls to /api/job-work
router.route('/').get(protect, getOrders).post(ownerOrManager, createOrder);
router.route('/:id/sync').post(ownerOrManager, syncToCatalog);
router.route('/:id').put(ownerOrManager, updateOrder).delete(ownerOrManager, deleteOrder);

export default router;
