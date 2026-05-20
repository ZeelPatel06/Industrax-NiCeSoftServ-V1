import mongoose from 'mongoose';

const jobWorkInventoryTransactionSchema = new mongoose.Schema(
    {
        jobWorkMaterialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'JobWorkMaterial',
        },
        jobWorkPartId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'JobWorkPart',
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

const JobWorkInventoryTransaction = mongoose.model('JobWorkInventoryTransaction', jobWorkInventoryTransactionSchema);

export default JobWorkInventoryTransaction;
