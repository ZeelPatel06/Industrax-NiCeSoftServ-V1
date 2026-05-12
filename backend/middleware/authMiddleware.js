import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from './asyncHandler.js';

const protect = asyncHandler(async (req, res, next) => {
    let token = req.cookies.jwt;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password'); // includes owner field for multi-tenancy
            
            if (!req.user || req.user.isDeleted) {
                res.status(401);
                throw new Error('Not authorized, account disabled or not found');
            }
            
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

const owner = (req, res, next) => {
    if (req.user && req.user.role === 'Owner') {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as an Owner');
    }
};

const ownerOrEngineer = (req, res, next) => {
    if (req.user && (req.user.role === 'Owner' || req.user.role === 'Engineer')) {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as an Owner or Engineer');
    }
};

export { protect, owner, ownerOrEngineer as ownerOrManager };
