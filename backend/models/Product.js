import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        productCode: {
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

// Scoped unique index: productCode must be unique within a single owner
productSchema.index({ productCode: 1, owner: 1 }, { unique: true });
productSchema.index({ owner: 1, isDeleted: 1 });
productSchema.index({ owner: 1, isActive: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
