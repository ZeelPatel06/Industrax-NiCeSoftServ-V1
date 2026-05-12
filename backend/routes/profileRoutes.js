import express from 'express';
import { getProfile, updateProfile } from '../controllers/userProfileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getProfile)
    .put(protect, updateProfile);

export default router;
