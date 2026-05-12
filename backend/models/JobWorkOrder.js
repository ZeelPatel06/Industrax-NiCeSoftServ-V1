import mongoose from 'mongoose';

const jobWorkOrderSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Client',
        },
        orderTitle: {
            type: String, // optional
        },
        materialName: {
            type: String, // legacy single material support
        },
        materialQuantity: {
            type: Number, // legacy single material support
        },
        unit: {
            type: String, // legacy single material support, or default fallback
            default: 'pcs'
        },
        materials: [{
            materialName: String,
            quantity: Number,
            unit: String
        }],
        jobType: {
            type: String,
            required: true,
        },
        rate: {
            type: Number,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        expectedCompletionDate: {
            type: Date, // optional
        },
        isClientMaterial: {
            type: Boolean,
            default: true,
        },
        deadline: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Completed'],
            default: 'Pending',
        },
        owner: {
            type: String,
            required: true,
        },
        outputProduct: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        outputPart: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Part',
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

// Performance indexes for common filtered queries
jobWorkOrderSchema.index({ owner: 1, isDeleted: 1 });
jobWorkOrderSchema.index({ owner: 1, status: 1 });
jobWorkOrderSchema.index({ owner: 1, clientId: 1 });

// Middleware for legacy backward compatibility
jobWorkOrderSchema.pre('save', function () {
    if (this.isModified('materials') || this.isModified('materialName')) {
        if (this.materials && this.materials.length > 0) {
            // New format is driving, sync to legacy
            this.materialName = this.materials[0].materialName;
            this.materialQuantity = this.materials[0].quantity;
            this.unit = this.materials[0].unit || this.unit;
        } else if (this.materialName && this.materialQuantity) {
            // Legacy format is driving, sync to new
            this.materials = [{
                materialName: this.materialName,
                quantity: this.materialQuantity,
                unit: this.unit || 'pcs'
            }];
        }
    }
});

// Normalize when loading existing legacy documents
jobWorkOrderSchema.post('init', function(doc) {
    if ((!doc.materials || doc.materials.length === 0) && doc.materialName) {
        doc.materials = [{
            materialName: doc.materialName,
            quantity: doc.materialQuantity || 0,
            unit: doc.unit || 'pcs'
        }];
    } else if (doc.materials && doc.materials.length > 0 && !doc.materialName) {
        doc.materialName = doc.materials[0].materialName;
        doc.materialQuantity = doc.materials[0].quantity;
    }
});

const JobWorkOrder = mongoose.model('JobWorkOrder', jobWorkOrderSchema);

export default JobWorkOrder;
