import express from 'express';
import { getDocuments, uploadDocument, deleteDocument } from '../controllers/uploadedDocumentController.js';
import { protect, ownerOrManager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, ownerOrManager, getDocuments)
    .post(protect, ownerOrManager, uploadDocument);

router.route('/:id')
    .delete(protect, ownerOrManager, deleteDocument);

export default router;
