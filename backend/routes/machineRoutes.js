import express from 'express';
import {
    createMachine,
    getMachines,
    updateMachine,
    deactivateMachine,
} from '../controllers/machineController.js';
import { protect, owner } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getMachines)
    .post(protect, owner, createMachine);

router.route('/:id')
    .put(protect, updateMachine)
    .delete(protect, owner, deactivateMachine);

export default router;
