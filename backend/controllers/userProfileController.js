import User from '../models/User.js';

export const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        let targetUser = user;
        // If employee/operator, fetch from owner
        if (user.role !== 'Owner') {
            targetUser = await User.findById(user.owner) || user;
        }

        res.status(200).json({ companyProfile: targetUser.companyProfile || {} });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching profile', error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (user.role !== 'Owner') {
            return res.status(403).json({ message: 'Only owners can update the company profile' });
        }

        const { companyName, companyAddress, gstNumber, currency } = req.body;
        
        user.companyProfile = {
            companyName: companyName !== undefined ? companyName : user.companyProfile?.companyName,
            companyAddress: companyAddress !== undefined ? companyAddress : user.companyProfile?.companyAddress,
            gstNumber: gstNumber !== undefined ? gstNumber : user.companyProfile?.gstNumber,
            currency: currency !== undefined ? currency : user.companyProfile?.currency,
        };

        await user.save();
        res.status(200).json({ message: 'Profile updated successfully', companyProfile: user.companyProfile });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating profile', error: error.message });
    }
};
