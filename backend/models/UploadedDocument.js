import mongoose from 'mongoose';

const uploadedDocumentSchema = new mongoose.Schema(
    {
        clientName: {
            type: String,
            required: true,
        },
        projectName: {
            type: String,
            required: true,
        },
        pdfFile: {
            type: String, // Base64 data URL
            required: true,
        },
        pdfFileName: {
            type: String,
            required: true,
        },
        owner: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const UploadedDocument = mongoose.model('UploadedDocument', uploadedDocumentSchema);

export default UploadedDocument;
