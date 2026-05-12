import express from 'express';
import multer from 'multer';
import { exportAllData, importAllData } from '../controllers/dataController.js';
import { protect, ownerOrManager } from '../middleware/authMiddleware.js';

const router = express.Router();

// Memory storage for CSV parsing
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/export', protect, ownerOrManager, exportAllData);
router.post('/import', protect, ownerOrManager, upload.single('file'), importAllData);

export default router;
