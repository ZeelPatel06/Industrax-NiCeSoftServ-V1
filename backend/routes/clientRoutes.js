import express from 'express';
import { getClients, createClient, updateClient, deleteClient } from '../controllers/clientController.js';
import { protect, ownerOrManager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, ownerOrManager, getClients)
    .post(protect, ownerOrManager, createClient);
router.route('/:id')
    .put(protect, ownerOrManager, updateClient)
    .delete(protect, ownerOrManager, deleteClient);

export default router;
