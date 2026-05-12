import express from 'express';
import { getInvoices, createInvoice, getInvoiceById, deleteInvoice, updatePayment } from '../controllers/invoiceController.js';
import { protect, ownerOrManager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, ownerOrManager, getInvoices)
    .post(protect, ownerOrManager, createInvoice);

router.route('/:id')
    .get(protect, ownerOrManager, getInvoiceById)
    .delete(protect, ownerOrManager, deleteInvoice);

router.route('/:id/payment')
    .put(protect, ownerOrManager, updatePayment);

export default router;
