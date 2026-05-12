import User from '../models/User.js';
import Product from '../models/Product.js';
import Part from '../models/Part.js';
import Material from '../models/Material.js';
import BOM from '../models/BOM.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import Order from '../models/Order.js';
import JobWorkOrder from '../models/JobWorkOrder.js';
import ProductionJob from '../models/ProductionJob.js';
import Attendance from '../models/Attendance.js';
import Invoice from '../models/Invoice.js';

// GET /api/modules
export const getModules = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ selectedModules: user.selectedModules || [] });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching modules', error: error.message });
    }
};

// PUT /api/modules
export const updateModules = async (req, res) => {
    try {
        const { selectedModules } = req.body; // array of strings
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const currentModules = user.selectedModules || [];
        const ownerId = user.role === 'Owner' ? user._id : user.owner;

        // Find which modules are being disabled
        const disabledModules = currentModules.filter(mod => !selectedModules.includes(mod));

        for (const mod of disabledModules) {
            switch (mod) {
                case 'products': {
                    const count = await Product.countDocuments({ owner: ownerId, isDeleted: false });
                    if (count > 0) return res.status(400).json({ message: 'Cannot disable Products module because data exists. Please delete it first.' });
                    break;
                }
                case 'parts': {
                    const count = await Part.countDocuments({ owner: ownerId });
                    if (count > 0) return res.status(400).json({ message: 'Cannot disable Parts module because data exists. Please delete it first.' });
                    break;
                }
                case 'materials': {
                    const count = await Material.countDocuments({ owner: ownerId, isDeleted: false });
                    if (count > 0) return res.status(400).json({ message: 'Cannot disable Materials module because data exists. Please delete it first.' });
                    break;
                }
                case 'bom': {
                    const count = await BOM.countDocuments({ owner: ownerId });
                    if (count > 0) return res.status(400).json({ message: 'Cannot disable BOM module because data exists. Please delete it first.' });
                    break;
                }
                case 'inventory': {
                    const count = await InventoryTransaction.countDocuments({ owner: ownerId });
                    if (count > 0) return res.status(400).json({ message: 'Cannot disable Inventory module because data exists. Please delete it first.' });
                    break;
                }
                case 'orders': {
                    const countOrder = await Order.countDocuments({ owner: ownerId, isDeleted: false });
                    const countJobWork = await JobWorkOrder.countDocuments({ owner: ownerId, isDeleted: false });
                    if (countOrder > 0 || countJobWork > 0) return res.status(400).json({ message: 'Cannot disable Orders module because data exists. Please delete it first.' });
                    break;
                }
                case 'production': {
                    const count = await ProductionJob.countDocuments({ owner: ownerId });
                    if (count > 0) return res.status(400).json({ message: 'Cannot disable Production module because data exists. Please delete it first.' });
                    break;
                }
                case 'employees': {
                    const count = await User.countDocuments({ 
                        owner: ownerId, 
                        role: { $ne: 'Owner' }, 
                        isDeleted: false 
                    });
                    if (count > 0) return res.status(400).json({ message: 'Cannot disable Employees module because data exists. Please delete it first.' });
                    break;
                }
                case 'attendance': {
                    const count = await Attendance.countDocuments({ owner: ownerId });
                    if (count > 0) return res.status(400).json({ message: 'Cannot disable Attendance module because data exists. Please delete it first.' });
                    break;
                }
                case 'invoices': {
                    const count = await Invoice.countDocuments({ owner: ownerId });
                    if (count > 0) return res.status(400).json({ message: 'Cannot disable Invoices module because data exists. Please delete it first.' });
                    break;
                }
                default:
                    break;
            }
        }

        user.selectedModules = selectedModules;
        await user.save();

        res.status(200).json({ message: 'Modules updated successfully', selectedModules: user.selectedModules });
    } catch (error) {
        res.status(500).json({ message: 'Error updating modules', error: error.message });
    }
};
