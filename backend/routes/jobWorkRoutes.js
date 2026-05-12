import express from 'express';
import { getOrders, createOrder, updateOrder, deleteOrder } from '../controllers/jobWorkController.js';
import { protect, ownerOrManager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(ownerOrManager, getOrders)
    .post(ownerOrManager, createOrder);
router.route('/:id')
    .put(ownerOrManager, updateOrder)
    .delete(ownerOrManager, deleteOrder);

export default router;
