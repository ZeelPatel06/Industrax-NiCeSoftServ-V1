import express from 'express';
import { getParts, createPart, updatePart, deletePart } from '../controllers/partController.js';
import { protect, ownerOrManager } from '../middleware/authMiddleware.js';

import validateRequest from '../middleware/validateRequest.js';
import { z } from 'zod';

const router = express.Router();

const partSchema = z.object({
    name: z.string().min(1, 'Please provide a part name'),
    category: z.string().min(1, 'Category is required'),
    partCode: z.string().optional(),
    unit: z.string().min(1, 'Unit is required'),
    standardCost: z.coerce.number().min(0).optional(),
    sellingPrice: z.coerce.number().min(0).optional(),
    isActive: z.boolean().optional()
});

router.route('/')
    .get(protect, getParts)
    .post(protect, ownerOrManager, validateRequest(partSchema), createPart);

router.route('/:id')
    .put(protect, ownerOrManager, validateRequest(partSchema.partial()), updatePart)
    .delete(protect, ownerOrManager, deletePart);

export default router;
