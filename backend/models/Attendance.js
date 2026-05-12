import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['Present', 'Absent'],
            required: true,
        },
        checkInTime: {
            type: String,
        },
        owner: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure one record per employee per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
