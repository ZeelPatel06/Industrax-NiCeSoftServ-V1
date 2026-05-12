import express from 'express';
import { authUser, registerUser, logoutUser, verifyOTP, changePassword, forgotPassword, resetPassword } from '../controllers/authController.js';
import validateRequest from '../middleware/validateRequest.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict rate limiting for Auth endpoints to prevent brute-force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Please enter a valid email address'),
    mobile: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['Owner', 'Engineer', 'Operator']).optional(),
    ownerEmail: z.string().email('Invalid owner email address').optional(),
    ownerPassword: z.string().optional()
});

const verifyOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits')
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address')
});

const resetPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

router.post('/register', authLimiter, validateRequest(registerSchema), registerUser);
router.post('/verify-otp', authLimiter, validateRequest(verifyOtpSchema), verifyOTP);
router.post('/login', authLimiter, validateRequest(loginSchema), authUser);
router.post('/logout', logoutUser);

// Password Management
router.put('/change-password', protect, validateRequest(changePasswordSchema), changePassword);
router.post('/forgot-password', authLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validateRequest(resetPasswordSchema), resetPassword);

export default router;
