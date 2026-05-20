import mongoose from 'mongoose';

const jobWorkMaterialSchema = new mongoose.Schema(
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
            diameter: { type: Number },
            wallThickness: { type: Number },
            side: { type: Number },
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

jobWorkMaterialSchema.index({ materialCode: 1, owner: 1 }, { unique: true });
jobWorkMaterialSchema.index({ owner: 1, isDeleted: 1 });

const JobWorkMaterial = mongoose.model('JobWorkMaterial', jobWorkMaterialSchema);

export default JobWorkMaterial;
