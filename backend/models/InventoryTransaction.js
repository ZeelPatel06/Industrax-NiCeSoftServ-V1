import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema(
    {
        materialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Material',
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        partId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Part',
        },
        itemName: {
            type: String, // For untracked/ad-hoc items
        },
        type: {
            type: String,
            required: true,
            enum: ['IN', 'OUT'],
        },
        quantity: {
            type: Number,
            required: true,
        },
        referenceType: {
            type: String,
            required: true,
        },
        referenceId: {
            type: String,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
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

const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

export default InventoryTransaction;
