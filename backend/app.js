import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import partRoutes from './routes/partRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import bomRoutes from './routes/bomRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import productionRoutes from './routes/productionRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import jobWorkRoutes from './routes/jobWorkRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import machineRoutes from './routes/machineRoutes.js';
import { protect } from './middleware/authMiddleware.js';
import moduleRoutes from './routes/moduleRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { isModuleEnabled } from './middleware/moduleMiddleware.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
// Set security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin static assets
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

// Compress responsess
app.use(compression());

// Global Rate Limiting (Protects against basic DoS)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, 
    legacyHeaders: false, 
});
app.use('/api', globalLimiter);

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/profile', profileRoutes);

// Protected routes (allow access if any relevant module is enabled)
app.use('/api/products', protect, isModuleEnabled(['products', 'bom', 'production', 'orders']), productRoutes);
app.use('/api/parts', protect, isModuleEnabled(['parts', 'bom', 'production', 'orders']), partRoutes);
app.use('/api/materials', protect, isModuleEnabled(['materials', 'bom', 'production', 'inventory', 'orders']), materialRoutes);
app.use('/api/inventory', protect, isModuleEnabled(['inventory', 'production']), inventoryRoutes);
app.use('/api/orders', protect, isModuleEnabled(['orders', 'production', 'invoices']), orderRoutes);
app.use('/api/bom', protect, isModuleEnabled(['bom', 'production']), bomRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/production', protect, isModuleEnabled('production'), productionRoutes);
app.use('/api/data', protect, dataRoutes);
app.use('/api/clients', protect, clientRoutes);
app.use('/api/job-work', protect, isModuleEnabled(['orders', 'bom']), jobWorkRoutes);
app.use('/api/employees', protect, isModuleEnabled(['employees', 'attendance', 'production']), employeeRoutes);
app.use('/api/attendance', protect, isModuleEnabled(['attendance', 'employees']), attendanceRoutes);
app.use('/api/invoices', protect, isModuleEnabled(['invoices', 'orders']), invoiceRoutes);
app.use('/api/machines', protect, isModuleEnabled(['machines', 'production']), machineRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use(notFound);
app.set("trust proxy", 1);
app.use(errorHandler);

export default app;