import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        amount: {
            type: Number,
            required: true,
        },
        planType: {
            type: String,
            required: true,
            enum: ['basic', 'growth', 'pro'],
        },
        usersPurchased: {
            type: Number,
            required: true,
            default: 0,
        },
        paymentId: {
            type: String,
            required: true,
        },
        orderId: {
            type: String,
            required: true,
        },
        signature: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'success', 'failed'],
            default: 'pending',
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
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

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
