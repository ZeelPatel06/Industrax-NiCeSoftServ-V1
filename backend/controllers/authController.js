import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendOTPEmail } from '../utils/emailService.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ 
        email: { $regex: new RegExp('^' + email + '$', 'i') }, 
        isDeleted: false 
    });

    let isMatch = false;
    if (user && user.password) {
        try {
            isMatch = await bcrypt.compare(password, user.password);
        } catch (error) {
            isMatch = false;
        }

        // Fallback for legacy plain-text passwords
        if (!isMatch && password === user.password) {
            isMatch = true;
            // Auto-hash for future security
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();
        }
    }

    if (user && isMatch) {
        if (!user.isVerified) {
            res.status(401);
            throw new Error('Please verify your email first');
        }
        generateToken(res, user._id);
        
        // Robust Role Handling (Fallback to 'Owner' for legacy users)
        const rawRole = user.role || 'Owner';
        const canonicalRole = (typeof rawRole === 'string') 
            ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase() 
            : 'Owner';

        // Robust Module Handling (Inherit from owner if employee)
        let selectedModules = user.selectedModules || [];
        if (canonicalRole !== 'Owner' && !selectedModules.length) {
            const ownerId = user.owner;
            if (ownerId) {
                const owner = await User.findOne({ 
                    $or: [{ email: ownerId }, { _id: ownerId }], 
                    isDeleted: false 
                });
                if (owner) selectedModules = owner.selectedModules || [];
            }
        }

        // Robust Profile Handling
        const companyProfile = user.companyProfile || {
            companyName: '',
            companyAddress: '',
            gstNumber: '',
            currency: 'INR'
        };

        res.json({
            _id: user._id,
            name: user.name || 'Legacy User',
            email: user.email,
            mobile: user.mobile || user.mobileNo || '',
            role: canonicalRole,
            selectedModules,
            companyProfile,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, mobile, password, role, ownerEmail, ownerPassword } = req.body;

    const userExists = await User.findOne({ email, isDeleted: false });
    if (userExists) {
        if (userExists.isVerified) {
            res.status(400);
            throw new Error('User already exists');
        } else {
            // Unverified user trying again, we will allow them to update mobile & re-send OTP below.
        }
    }

    if (mobile) {
        const mobileExists = await User.findOne({ mobile, isDeleted: false });
        if (mobileExists && mobileExists.email !== email) {
            res.status(400);
            throw new Error('Mobile number already registered to another account');
        }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    let user;
    const isDevMode = process.env.DEVELOPMENT_MODE === 'true';

    if (userExists && !userExists.isVerified) {
        userExists.name = name;
        userExists.mobile = mobile;
        userExists.password = hashedPassword;
        userExists.role = 'Owner';
        userExists.owner = null;
        userExists.isVerified = isDevMode;
        userExists.otp = isDevMode ? undefined : otp;
        userExists.otpExpires = isDevMode ? undefined : otpExpires;
        await userExists.save();
        user = userExists;
    } else {
        user = await User.create({
            name,
            email,
            mobile,
            password: hashedPassword,
            role: 'Owner',
            owner: null,
            isVerified: isDevMode,
            otp: isDevMode ? undefined : otp,
            otpExpires: isDevMode ? undefined : otpExpires
        });
    }

    if (user) {
        if (isDevMode) {
            // No separate Employee record needed anymore
            if (user.role === 'Engineer' || user.role === 'Operator') {
                // Roles are already set in User model
            }

            generateToken(res, user._id);
            return res.status(201).json({
                _id: user._id,
                name: user.name,
                role: user.role,
                selectedModules: [],
                isVerified: true,
                message: 'Development Mode: User registered and verified automatically'
            });
        }

        try {
            await sendOTPEmail(email, otp);
            res.status(201).json({ message: 'OTP sent to your email. Please verify.' });
        } catch (error) {
            res.status(500);
            throw new Error('User registered, but failed to send OTP email. Contact support.');
        }
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Verify OTP for user registration
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, isDeleted: false });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.isVerified) {
        res.status(400);
        throw new Error('User is already verified');
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Roles are already set in User model, no separate record needed
            if (user.role === 'Engineer' || user.role === 'Operator') {
                // verified
            }

    generateToken(res, user._id);
    
    const canonicalRole = (user.role && typeof user.role === 'string') 
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() 
        : user.role;

    let selectedModules = [];
    if (canonicalRole === 'Owner') {
        selectedModules = user.selectedModules || [];
    } else {
        const ownerId = user.owner;
        const owner = await User.findOne({ email: ownerId, isDeleted: false });
        if (owner) selectedModules = owner.selectedModules || [];
    }

    res.status(200).json({
        _id: user._id,
        name: user.name,
        role: canonicalRole,
        selectedModules,
        message: 'Account verified successfully'
    });
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });

    res.status(200).json({ message: 'User logged out successfully' });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private (Owner Only)
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role !== 'Owner') {
        res.status(403);
        throw new Error('Only the Owner can change the password through this setting');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
});

// @desc    Forgot password - Step 1: Send OTP via email lookup
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email, isDeleted: false });

    if (!user) {
        res.status(404);
        throw new Error('User not found with this email address');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    try {
        await sendOTPEmail(user.email, otp);
        res.json({ message: 'OTP sent to your email address', email: user.email });
    } catch (error) {
        res.status(500);
        throw new Error('Failed to send OTP email. Please contact support.');
    }
});

// @desc    Reset password - Step 2: Verify OTP and update password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email, isDeleted: false });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
});

export { authUser, registerUser, logoutUser, verifyOTP, changePassword, forgotPassword, resetPassword };
