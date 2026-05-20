import UploadedDocument from '../models/UploadedDocument.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getDocuments = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const documents = await UploadedDocument.find({ owner: ownerId }).sort({ createdAt: -1 });
    res.json(documents);
});

export const uploadDocument = asyncHandler(async (req, res) => {
    const { clientName, projectName, pdfFile, pdfFileName } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!clientName || !projectName || !pdfFile) {
        res.status(400);
        throw new Error('Please fill in all fields and select a PDF file');
    }

    const document = new UploadedDocument({
        clientName,
        projectName,
        pdfFile,
        pdfFileName: pdfFileName || 'document.pdf',
        owner: ownerId,
    });

    const savedDoc = await document.save();
    res.status(201).json(savedDoc);
});

export const deleteDocument = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const document = await UploadedDocument.findOne({ _id: req.params.id, owner: ownerId });

    if (document) {
        await document.deleteOne();
        res.json({ message: 'Document removed' });
    } else {
        res.status(404);
        throw new Error('Document not found');
    }
});
