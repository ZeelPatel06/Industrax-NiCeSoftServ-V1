import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
export const getAttendance = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const filter = { owner: ownerId };
    
    // If not Owner, only show their own records
    if (req.user.role !== 'Owner') {
        filter.userId = req.user._id;
    }

    if (req.query.date) {
        const startOfDay = new Date(req.query.date);
        startOfDay.setUTCHours(0,0,0,0);
        const endOfDay = new Date(req.query.date);
        endOfDay.setUTCHours(23,59,59,999);
        filter.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    const attendanceRecords = await Attendance.find(filter).populate('userId', 'name dailyWage role');
    res.json(attendanceRecords);
});

// @desc    Mark attendance for a user
// @route   POST /api/attendance
// @access  Private
export const markAttendance = asyncHandler(async (req, res) => {
    let { userId, date, status } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    
    // Only Owner and Engineer roles are allowed to mark attendance
    if (req.user.role !== 'Owner') {
        if (req.user.role !== 'Engineer') {
            res.status(403);
            throw new Error('Attendance can only be marked by Owner or Engineer.');
        }
        userId = req.user._id;
    } else {
        // Check if user exists and owned
        const targetUser = await User.findById(userId);
        if (!targetUser || targetUser.owner !== ownerId) {
            res.status(404);
            throw new Error('User not found or unauthorized');
        }
    }

    const startOfDay = new Date(date || new Date());
    startOfDay.setUTCHours(0,0,0,0);

    // If check-out is requested
    if (req.body.checkOut) {
        const attendance = await Attendance.findOneAndUpdate(
            { userId, date: startOfDay, owner: ownerId, status: 'Present' },
            { checkOutTime: new Date().toISOString() },
            { new: true }
        );
        if (!attendance) {
            res.status(400);
            throw new Error('No active check-in found for today to check out from.');
        }
        return res.json(attendance);
    }

    const updateData = { status };
    if (status === 'Present') {
        // Store full ISO string for accurate timezone conversion on frontend
        updateData.checkInTime = new Date().toISOString();
    }
    
    // Upsert attendance for the day
    const attendance = await Attendance.findOneAndUpdate(
        { userId, date: startOfDay, owner: ownerId },
        updateData,
        { new: true, upsert: true }
    );
    
    res.status(201).json(attendance);
});
