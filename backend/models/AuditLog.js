import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Can be null if system action
        },
        action: {
            type: String,
            required: true,
            enum: ['CREATE', 'UPDATE', 'DELETE'],
        },
        entityType: {
            type: String,
            required: true,
        },
        entityId: {
            type: String,
        },
        details: {
            type: mongoose.Schema.Types.Mixed, // Store JSON payload of what was changed
        },
        ipAddress: {
            type: String,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
