import express from 'express';
const router = express.Router();
import { getRecentActivity } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

router.get('/activity', protect, getRecentActivity);

export default router;
