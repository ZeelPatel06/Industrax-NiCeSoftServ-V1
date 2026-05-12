import express from 'express';
import {
    getProductionJobs,
    createProductionJob,
    startProduction,
    updateProduction,
    completeProduction,
    deleteProductionJob,
    editProductionJob,
} from '../controllers/productionController.js';
import { protect, owner } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { z } from 'zod';

const router = express.Router();

const productionSchema = z.object({
    jobId: z.string().optional(),
    orderId: z.string().optional().nullable(),
    productId: z.string().optional().nullable(),
    partId: z.string().optional().nullable(),
    plannedQty: z.coerce.number().min(0.0001, 'Planned quantity must be positive'),
    endDate: z.string().min(1, 'End date is required'),
    priority: z.enum(['Normal', 'Urgent', 'Critical']).default('Normal')
});

router.route('/')
    .get(protect, getProductionJobs)
    .post(protect, validateRequest(productionSchema), createProductionJob);

router.route('/:id')
    .delete(protect, owner, deleteProductionJob)
    .put(protect, validateRequest(productionSchema), editProductionJob);
router.route('/start/:id').put(protect, startProduction);
router.route('/update/:id').put(protect, validateRequest(z.object({ producedQty: z.coerce.number().min(0) })), updateProduction);
router.route('/complete/:id').put(protect, completeProduction);

export default router;
