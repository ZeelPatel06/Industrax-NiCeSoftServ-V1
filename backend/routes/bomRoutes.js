import express from 'express';
import {
    getBOMByProduct,
    getAllBOMs,
    addBOMItem,
    deleteBOMItem,
    updateBOMItem,
} from '../controllers/bomController.js';
import { protect, owner } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { z } from 'zod';

const router = express.Router();

const baseBomSchema = z.object({
    productId: z.string().optional(),
    jobWorkOrderId: z.string().optional(),
    parentPartId: z.string().optional(),
    materialId: z.string().optional(),
    partId: z.string().optional(),
    qtyPerUnit: z.coerce.number().min(0.0001, 'Quantity must be greater than 0'),
    unit: z.string().min(1, 'Unit is required')
});

const bomSchema = baseBomSchema.refine(
    data => data.productId || data.jobWorkOrderId || data.parentPartId, 
    {
        message: "Either Product ID, Job Work Order ID, or Parent Part ID must be provided",
        path: ["productId"]
    }
).refine(
    data => data.materialId || data.partId,
    {
        message: "Either Material ID or Part ID must be provided",
        path: ["materialId"]
    }
);

router.route('/')
    .get(protect, getAllBOMs)
    .post(protect, owner, validateRequest(bomSchema), addBOMItem);
router.route('/:id').get(protect, getBOMByProduct);
router.route('/item/:id')
    .put(protect, owner, validateRequest(baseBomSchema.partial()), updateBOMItem)
    .delete(protect, owner, deleteBOMItem);

export default router;
