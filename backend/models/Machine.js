import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
        },
        serialNumber: {
            type: String,
        },
        modelNumber: {
            type: String,
        },
        operationalStatus: {
            type: String,
            enum: ['Running', 'Idle', 'Maintenance', 'Broken Down'],
            default: 'Idle',
        },
        currentJobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductionJob',
            default: null,
        },
        currentOperatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        owner: {
            type: String,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Scoped unique index: machine name must be unique within a single owner (only for non-deleted)
machineSchema.index({ name: 1, owner: 1, isDeleted: 1 }, { unique: true });
// Performance index for common queries
machineSchema.index({ owner: 1, isDeleted: 1 });
machineSchema.index({ owner: 1, operationalStatus: 1 });

const Machine = mongoose.model('Machine', machineSchema);

export default Machine;
