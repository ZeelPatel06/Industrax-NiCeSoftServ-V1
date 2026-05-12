import mongoose from 'mongoose';

const bomSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: false,
        },
        jobWorkOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'JobWorkOrder',
            required: false,
        },
        parentPartId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Part',
            required: false,
        },
        materialId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: 'Material',
        },
        partId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: 'Part',
        },
        qtyPerUnit: {
            type: Number,
            required: true,
        },
        unit: {
            type: String, // Explicitly store the unit used for this BOM entry
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

// Index for performance, but not unique to handle multiple Null values in compound index
bomSchema.index({ productId: 1, jobWorkOrderId: 1, parentPartId: 1, materialId: 1, partId: 1 });

const BOM = mongoose.model('BOM', bomSchema);

export default BOM;
