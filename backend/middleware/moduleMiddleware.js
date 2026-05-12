import mongoose from 'mongoose';
import User from '../models/User.js';
import asyncHandler from './asyncHandler.js';

export const isModuleEnabled = (moduleNames) => {
    return asyncHandler(async (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const modulesToCheck = Array.isArray(moduleNames) ? moduleNames : [moduleNames];

        let owner;
        if (user.role === 'Owner') {
            owner = user;
        } else {
            const ownerId = user.owner;
            // Support both email and ObjectId string for owner lookup
            owner = await User.findOne({ 
                $or: [{ email: ownerId }, { _id: mongoose.Types.ObjectId.isValid(ownerId) ? ownerId : new mongoose.Types.ObjectId() }], 
                role: 'Owner', 
                isDeleted: false 
            });
        }
        
        if (!owner) {
            return res.status(401).json({ message: 'Owner not found' });
        }

        const selectedModules = owner.selectedModules || [];

        // Any of the specified modules being enabled grants access
        const hasAccess = modulesToCheck.some(m => selectedModules.includes(m));

        if (!hasAccess) {
            return res.status(403).json({ message: `Access denied. Requires one of these modules: ${modulesToCheck.join(', ')}` });
        }

        next();
    });
};
