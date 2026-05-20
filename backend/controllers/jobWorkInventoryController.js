import JobWorkMaterial from '../models/JobWorkMaterial.js';
import JobWorkPart from '../models/JobWorkPart.js';
import JobWorkInventoryTransaction from '../models/JobWorkInventoryTransaction.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { logAudit } from '../middleware/auditLogger.js';

// @desc    Get all job work inventory transactions
// @route   GET /api/job-work/inventory/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const transactions = await JobWorkInventoryTransaction.find({ owner: ownerId, isDeleted: false })
        .populate('jobWorkMaterialId', 'name materialCode unit')
        .populate('jobWorkPartId', 'name partCode unit')
        .sort({ date: -1 });
    res.json(transactions);
});

// @desc    Add stock (IN transaction)
// @route   POST /api/job-work/inventory/in
// @access  Private
const addStockIn = asyncHandler(async (req, res) => {
    const { jobWorkMaterialId, jobWorkPartId, quantity, referenceType, referenceId, itemName } = req.body;

    if (quantity <= 0) {
        res.status(400);
        throw new Error('Quantity must be positive');
    }

    if (!jobWorkMaterialId && !jobWorkPartId && !itemName) {
        res.status(400);
        throw new Error('An item selection or un-tracked Item Name is required');
    }

    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    let item = null;
    if (jobWorkMaterialId) {
        item = await JobWorkMaterial.findOne({ _id: jobWorkMaterialId, owner: ownerId, isDeleted: false });
        if (!item) { res.status(404); throw new Error('Job Work Material not found'); }
    } else if (jobWorkPartId) {
        item = await JobWorkPart.findOne({ _id: jobWorkPartId, owner: ownerId, isDeleted: false });
        if (!item) { res.status(404); throw new Error('Job Work Part not found'); }
    }

    const transaction = await JobWorkInventoryTransaction.create({
        jobWorkMaterialId: jobWorkMaterialId || undefined,
        jobWorkPartId: jobWorkPartId || undefined,
        itemName: itemName || undefined,
        type: 'IN',
        quantity,
        referenceType,
        referenceId,
        owner: ownerId,
    });

    if (item) {
        item.currentStock = Number((item.currentStock + quantity).toFixed(4));
        await item.save();
    }

    await logAudit({
        userId: req.user._id,
        action: 'CREATE',
        entityType: 'JobWorkInventoryTransaction',
        entityId: transaction._id,
        details: { type: 'IN', quantity, referenceType, referenceId, jobWorkMaterialId, jobWorkPartId },
        ipAddress: req.ip,
    });

    res.status(201).json(transaction);
});

// @desc    Deduct stock (OUT transaction)
// @route   POST /api/job-work/inventory/out
// @access  Private
const addStockOut = asyncHandler(async (req, res) => {
    const { jobWorkMaterialId, jobWorkPartId, quantity, referenceType, referenceId, itemName } = req.body;

    if (quantity <= 0) {
        res.status(400);
        throw new Error('Quantity must be positive');
    }

    if (!jobWorkMaterialId && !jobWorkPartId && !itemName) {
        res.status(400);
        throw new Error('An item selection or un-tracked Item Name is required');
    }

    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    let item = null;
    if (jobWorkMaterialId) {
        item = await JobWorkMaterial.findOne({ _id: jobWorkMaterialId, owner: ownerId, isDeleted: false });
        if (!item) { res.status(404); throw new Error('Job Work Material not found'); }
        const available = Number((item.currentStock - item.reservedStock).toFixed(4));
        if (available < quantity) {
            res.status(400);
            throw new Error(`Insufficient stock. Available: ${available} ${item.unit}`);
        }
    } else if (jobWorkPartId) {
        item = await JobWorkPart.findOne({ _id: jobWorkPartId, owner: ownerId, isDeleted: false });
        if (!item) { res.status(404); throw new Error('Job Work Part not found'); }
        if (item.currentStock < quantity) {
            res.status(400);
            throw new Error(`Insufficient stock. Available: ${item.currentStock} ${item.unit}`);
        }
    }

    const transaction = await JobWorkInventoryTransaction.create({
        jobWorkMaterialId: jobWorkMaterialId || undefined,
        jobWorkPartId: jobWorkPartId || undefined,
        itemName: itemName || undefined,
        type: 'OUT',
        quantity,
        referenceType,
        referenceId,
        owner: ownerId,
    });

    if (item) {
        item.currentStock = Number((item.currentStock - quantity).toFixed(4));
        await item.save();
    }

    await logAudit({
        userId: req.user._id,
        action: 'CREATE',
        entityType: 'JobWorkInventoryTransaction',
        entityId: transaction._id,
        details: { type: 'OUT', quantity, referenceType, referenceId, jobWorkMaterialId, jobWorkPartId },
        ipAddress: req.ip,
    });

    res.status(201).json(transaction);
});

export { getTransactions, addStockIn, addStockOut };
