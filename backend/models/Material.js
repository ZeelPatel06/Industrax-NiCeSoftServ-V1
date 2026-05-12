import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
    {
        materialCode: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        unit: {
            type: String,
            required: true,
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
        minimumLevel: {
            type: Number,
            required: true,
            default: 0,
        },
        shape: {
            type: String,
            default: 'Generic',
        },
        dimensions: {
            length: { type: Number },
            width: { type: Number },
            thickness: { type: Number },
            diameter: { type: Number }, // For Round Bars/Pipes
            wallThickness: { type: Number }, // For Pipes
            side: { type: Number }, // For Square Bars
            dimensionUnit: { type: String, default: 'mm' },
        },
        price: {
            type: Number,
            default: 0,
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

// Scoped unique index: materialCode must be unique within a single owner
materialSchema.index({ materialCode: 1, owner: 1 }, { unique: true });
// Performance indexes for common filtered queries
materialSchema.index({ owner: 1, isDeleted: 1 });

const Material = mongoose.model('Material', materialSchema);

export default Material;
