import express from 'express';
import { getModules, updateModules } from '../controllers/moduleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getModules)
    .put(protect, updateModules);

export default router;
