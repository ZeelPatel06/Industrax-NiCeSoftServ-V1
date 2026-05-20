import mongoose from 'mongoose';

const jobWorkBOMSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'JobWorkProduct',
            required: false,
        },
        jobWorkOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'JobWorkOrder',
            required: false,
        },
        parentPartId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'JobWorkPart',
            required: false,
        },
        materialId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: 'JobWorkMaterial',
        },
        partId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: 'JobWorkPart',
        },
        qtyPerUnit: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
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

jobWorkBOMSchema.index({ productId: 1, jobWorkOrderId: 1, parentPartId: 1, materialId: 1, partId: 1 });

const JobWorkBOM = mongoose.model('JobWorkBOM', jobWorkBOMSchema);

export default JobWorkBOM;
