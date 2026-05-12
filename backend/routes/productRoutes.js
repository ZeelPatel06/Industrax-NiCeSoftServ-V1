import express from 'express';
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/productController.js';
import { protect, owner } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { z } from 'zod';

const router = express.Router();

const productSchema = z.object({
    name: z.string().min(1, 'Please provide a product name'),
    category: z.string().min(1, 'Category is required'),
    productCode: z.string().optional(),
    unit: z.string().min(1, 'Unit (e.g., pcs, kg) is required'),
    standardCost: z.coerce.number().min(0, 'Standard cost cannot be negative'),
    sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative'),
    isActive: z.boolean().optional()
});

router.route('/')
    .get(protect, getProducts)
    .post(protect, owner, validateRequest(productSchema), createProduct);
    
router.route('/:id')
    .put(protect, owner, validateRequest(productSchema.partial()), updateProduct)
    .delete(protect, owner, deleteProduct);

export default router;
