import express from 'express';
import { getAttendance, markAttendance } from '../controllers/attendanceController.js';
import { protect, ownerOrManager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getAttendance)
    .post(protect, markAttendance);

export default router;
