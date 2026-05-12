import mongoose from 'mongoose';

const productionJobSchema = new mongoose.Schema(
    {
        jobId: {
            type: String,
            required: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            // Could ref 'Order' or 'JobWorkOrder' based on use case
            refPath: 'orderModel',
        },
        orderModel: {
            type: String,
            enum: ['Order', 'JobWorkOrder'],
            default: 'Order',
        },
        jobType: {
            type: String,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        operatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        assignedQuantity: {
            type: Number,
        },
        completedQuantity: {
            type: Number,
            default: 0,
        },
        // Old fields for backward compatibility
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        partId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Part',
        },
        plannedQty: {
            type: Number,
        },
        producedQty: {
            type: Number,
            default: 0,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        actualEndDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Completed', 'Planned', 'Started'],
            default: 'Pending',
        },
        priority: {
            type: String,
            enum: ['Normal', 'Urgent', 'Critical'],
            default: 'Normal',
        },
        owner: {
            type: String,
            required: true,
        },
        machineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Machine',
            default: null,
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

// Scoped unique index: jobId must be unique within a single owner
productionJobSchema.index({ jobId: 1, owner: 1 }, { unique: true });
productionJobSchema.index({ owner: 1, isDeleted: 1 });
productionJobSchema.index({ owner: 1, status: 1 });

// Middleware for legacy backward compatibility
productionJobSchema.pre('save', function () {
    // Sync quantities
    if (this.isModified('plannedQty') || this.isModified('assignedQuantity')) {
        const qty = this.plannedQty || this.assignedQuantity || 0;
        this.plannedQty = qty;
        this.assignedQuantity = qty;
    }
    
    if (this.isModified('producedQty') || this.isModified('completedQuantity')) {
        const pQty = this.producedQty || this.completedQuantity || 0;
        this.producedQty = pQty;
        this.completedQuantity = pQty;
    }
});

// Normalize when loading existing legacy documents
productionJobSchema.post('init', function(doc) {
    if (doc.plannedQty === undefined && doc.assignedQuantity !== undefined) {
        doc.plannedQty = doc.assignedQuantity;
    } else if (doc.assignedQuantity === undefined && doc.plannedQty !== undefined) {
        doc.assignedQuantity = doc.plannedQty;
    }
    
    if (doc.producedQty === undefined && doc.completedQuantity !== undefined) {
        doc.producedQty = doc.completedQuantity;
    } else if (doc.completedQuantity === undefined && doc.producedQty !== undefined) {
        doc.completedQuantity = doc.producedQty;
    }
});

const ProductionJob = mongoose.model('ProductionJob', productionJobSchema);

export default ProductionJob;
