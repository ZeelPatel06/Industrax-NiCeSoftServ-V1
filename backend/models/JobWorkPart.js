import mongoose from 'mongoose';

const jobWorkPartSchema = new mongoose.Schema(
    {
        partCode: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        unit: {
            type: String,
            required: true,
        },
        standardCost: {
            type: Number,
            required: true,
            default: 0,
        },
        sellingPrice: {
            type: Number,
            required: true,
            default: 0,
        },
        currentStock: {
            type: Number,
            required: true,
            default: 0,
        },
        reservedStock: {
            type: Number,
            required: true,
            default: 0,
        },
        description: {
            type: String,
        },
        shape: {
            type: String,
            default: 'Generic',
        },
        dimensions: {
            length: { type: Number },
            width: { type: Number },
            thickness: { type: Number },
            diameter: { type: Number },
            wallThickness: { type: Number },
            side: { type: Number },
            dimensionUnit: { type: String, default: 'mm' },
        },
        isActive: {
            type: Boolean,
            default: true,
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

jobWorkPartSchema.index({ partCode: 1, owner: 1 }, { unique: true });
jobWorkPartSchema.index({ owner: 1, isDeleted: 1 });
jobWorkPartSchema.index({ owner: 1, isActive: 1 });

const JobWorkPart = mongoose.model('JobWorkPart', jobWorkPartSchema);

export default JobWorkPart;
