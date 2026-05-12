import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: false,
            unique: true,
            sparse: true,
        },
        password: {
            type: String,
            required: false,
        },
        role: {
            type: String,
            enum: ['Owner', 'Admin', 'Engineer', 'Operator', 'Worker', 'Helper'],
            default: 'Worker',
        },
        dailyWage: {
            type: Number,
            default: 0,
        },
        owner: {
            type: String,
        },
        mobile: {
            type: String,
            unique: true,
            sparse: true, // sparse allows nulls but forces uniqueness on non-null
        },
        mobileNo: {
            type: String, // Support legacy numeric or string mobile numbers
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
        },
        otpExpires: {
            type: Date,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        selectedModules: {
            type: [String],
            default: [], // If empty, indicates user hasn't completed onboarding
        },
        companyProfile: {
            companyName: { type: String, default: '' },
            companyAddress: { type: String, default: '' },
            gstNumber: { type: String, default: '' },
            currency: { type: String, default: 'INR' },
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);

export default User;
