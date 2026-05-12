import {
    getOrders,
    createOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
} from '../controllers/orderController.js';
import { protect, owner } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { z } from 'zod';
import express from 'express';

const router = express.Router();

const orderSchema = z.object({
    customerName: z.string().min(1, 'Customer name is required'),
    orderId: z.string().optional(),
    deliveryDate: z.string().min(1, 'Delivery date is required'),
    items: z.array(z.object({
        productId: z.string().min(1, 'Valid Product ID is required'),
        quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
        price: z.coerce.number().min(0, 'Price cannot be negative')
    })).min(1, 'At least one item is required in the order')
});

router.route('/')
    .get(protect, getOrders)
    .post(protect, validateRequest(orderSchema), createOrder);

router.route('/:id')
    .put(protect, validateRequest(orderSchema), updateOrder)
    .delete(protect, owner, deleteOrder);
router.route('/:id/status').put(protect, updateOrderStatus);

export default router;
