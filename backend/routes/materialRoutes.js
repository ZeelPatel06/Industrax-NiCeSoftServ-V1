import express from 'express';
import {
    getMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
} from '../controllers/materialController.js';
import { protect, owner } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { z } from 'zod';

const router = express.Router();
const materialSchema = z.object({
    name: z.string().min(1, 'Material name is required'),
    materialCode: z.string().optional(),
    unit: z.string().min(1, 'Unit is required'),
    currentStock: z.coerce.number().min(0, 'Current stock cannot be negative').optional(),
    minimumLevel: z.coerce.number().min(0, 'Minimum level cannot be negative').optional(),
    shape: z.string().optional().default('Generic'),
    dimensions: z.object({
        length: z.coerce.number().optional(),
        width: z.coerce.number().optional(),
        thickness: z.coerce.number().optional(),
        diameter: z.coerce.number().optional(),
        wallThickness: z.coerce.number().optional(),
        side: z.coerce.number().optional(),
        dimensionUnit: z.string().optional().default('mm'),
    }).optional(),
});

router.route('/')
    .get(protect, getMaterials)
    .post(protect, owner, validateRequest(materialSchema), createMaterial);

router.route('/:id')
    .put(protect, owner, validateRequest(materialSchema), updateMaterial)
    .delete(protect, owner, deleteMaterial);

export default router;
