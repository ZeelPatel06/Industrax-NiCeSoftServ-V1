import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        planType: {
            type: String,
            required: true,
            enum: ['trial', 'basic', 'growth', 'pro'],
        },
        baseUsers: {
            type: Number,
            required: true,
            default: 1,
        },
        extraUsers: {
            type: Number,
            required: true,
            default: 0,
        },
        maxUsers: {
            type: Number,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['active', 'expired', 'cancelled'],
            default: 'active',
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

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
