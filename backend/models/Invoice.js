import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            // Could ref 'Order' or 'JobWorkOrder' based on use case
            refPath: 'orderModel',
        },
        orderModel: {
            type: String,
            required: true,
            enum: ['Order', 'JobWorkOrder'],
            default: 'JobWorkOrder',
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: 'Client',
        },
        customerName: {
            type: String,
        },
        invoiceNumber: {
            type: String,
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        paymentStatus: {
            type: String,
            enum: ['Unpaid', 'Partially Paid', 'Paid'],
            default: 'Unpaid',
        },
        subTotal: {
            type: Number,
        },
        gstType: {
            type: String,
            enum: ['intra-state', 'inter-state', 'none'],
            default: 'none',
        },
        cgst: {
            type: Number,
            default: 0,
        },
        sgst: {
            type: Number,
            default: 0,
        },
        igst: {
            type: Number,
            default: 0,
        },
        gstRate: {
            type: Number,
            default: 18,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        owner: {
            type: String,
            required: true,
        },
        notes: {
            type: String,
        },
        items: {
            type: [{
                name: String,
                quantity: Number,
                price: Number,
                total: Number,
            }],
            default: []
        },
        materials: {
            type: [{
                materialName: String,
                quantity: Number,
                unit: String,
            }],
            default: []
        },
        extraCosts: {
            type: [{
                description: String,
                amount: Number,
            }],
            default: []
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

// Unique invoice number per owner
invoiceSchema.index({ invoiceNumber: 1, owner: 1 }, { unique: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
