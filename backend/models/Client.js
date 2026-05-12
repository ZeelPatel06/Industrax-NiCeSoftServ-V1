import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
        },
        email: {
            type: String,
        },
        address: {
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

// Performance indexes for common filtered queries
clientSchema.index({ owner: 1, isDeleted: 1 });
clientSchema.index({ owner: 1, name: 1 });

const Client = mongoose.model('Client', clientSchema);

export default Client;
