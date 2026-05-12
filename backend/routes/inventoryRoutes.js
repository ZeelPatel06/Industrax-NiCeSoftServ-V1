import express from 'express';
import {
    getTransactions,
    addStockIn,
    addStockOut,
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { z } from 'zod';

const router = express.Router();

const inventorySchema = z.object({
    materialId: z.string().optional(),
    productId: z.string().optional(),
    quantity: z.coerce.number().min(0.0001, 'Quantity must be greater than 0'),
    referenceType: z.string().min(1, 'Reference type is required'),
    referenceId: z.string().optional()
}).refine(data => data.materialId || data.productId, {
    message: "Either Material or Product must be selected",
    path: ["materialId"]
});

router.route('/transactions').get(protect, getTransactions);
router.route('/in').post(protect, validateRequest(inventorySchema), addStockIn);
router.route('/out').post(protect, validateRequest(inventorySchema), addStockOut);

export default router;
