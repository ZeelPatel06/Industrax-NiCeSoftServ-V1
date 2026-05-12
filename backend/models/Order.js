import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
});

const orderSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true,
        },
        orderId: {
            type: String,
            unique: true,
        },
        orderDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        deliveryDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['Draft', 'Approved', 'In Production', 'Completed', 'Delivered'],
            default: 'Draft',
        },
        completionDate: {
            type: Date,
        },
        items: [orderItemSchema],
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

// Performance indexes for common filtered queries
orderSchema.index({ owner: 1, isDeleted: 1 });
orderSchema.index({ owner: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
