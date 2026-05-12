import express from 'express';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../controllers/employeeController.js';
import { protect, ownerOrManager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getEmployees)
    .post(protect, ownerOrManager, createEmployee);
router.route('/:id')
    .put(protect, ownerOrManager, updateEmployee)
    .delete(protect, ownerOrManager, deleteEmployee);

export default router;
