import Material from '../models/Material.js';
import Product from '../models/Product.js';
import Part from '../models/Part.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { logAudit } from '../middleware/auditLogger.js';

// @desc    Get all inventory transactions
// @route   GET /api/inventory/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const transactions = await InventoryTransaction.find({ owner: ownerId, isDeleted: false })
        .populate('materialId', 'name materialCode')
        .populate('productId', 'name productCode unit')
        .populate('partId', 'name partCode unit')
        .sort({ date: -1 });
    res.json(transactions);
});

// @desc    Add stock (IN transaction)
// @route   POST /api/inventory/in
// @access  Private
const addStockIn = asyncHandler(async (req, res) => {
    const { materialId, productId, partId, quantity, referenceType, referenceId } = req.body;

    if (quantity <= 0) {
        res.status(400);
        throw new Error('Quantity must be positive');
    }

    if (!materialId && !productId && !partId && !req.body.itemName) {
        res.status(400);
        throw new Error('An item selection or un-tracked Item Name is required');
    }

    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    let item = null;
    if (materialId) {
        item = await Material.findOne({ _id: materialId, owner: ownerId, isDeleted: false });
        if (!item) { res.status(404); throw new Error('Material not found'); }
    } else if (productId) {
        item = await Product.findOne({ _id: productId, owner: ownerId, isDeleted: false });
        if (!item) { res.status(404); throw new Error('Product not found'); }
    } else if (partId) {
        item = await Part.findOne({ _id: partId, owner: ownerId, isDeleted: false });
        if (!item) { res.status(404); throw new Error('Part not found'); }
    }

    const transaction = await InventoryTransaction.create({
        materialId: materialId || undefined,
        productId: productId || undefined,
        partId: partId || undefined,
        itemName: req.body.itemName || undefined,
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
        entityType: 'InventoryTransaction',
        entityId: transaction._id,
        details: { type: 'IN', quantity, referenceType, referenceId, materialId, productId, partId },
        ipAddress: req.ip,
    });

    res.status(201).json(transaction);
});

// @desc    Deduct stock (OUT transaction)
// @route   POST /api/inventory/out
// @access  Private
const addStockOut = asyncHandler(async (req, res) => {
    const { materialId, productId, partId, quantity, referenceType, referenceId } = req.body;

    if (quantity <= 0) {
        res.status(400);
        throw new Error('Quantity must be positive');
    }

    if (!materialId && !productId && !partId && !req.body.itemName) {
        res.status(400);
        throw new Error('An item selection or un-tracked Item Name is required');
    }

    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    let item = null;
    if (materialId) {
        item = await Material.findOne({ _id: materialId, owner: ownerId, isDeleted: false });
        if (!item) { res.status(404); throw new Error('Material not found'); }
        const available = Number((item.currentStock - item.reservedStock).toFixed(4));
        if (available < quantity) {
            res.status(400);
            throw new Error(`Insufficient stock. Available: ${available} ${item.unit}`);
        }
    } else if (productId) {
        item = await Product.findOne({ _id: productId, owner: ownerId, isDeleted: false });
        if (!item) { res.status(404); throw new Error('Product not found'); }
        const reserved = item.reservedStock || 0;
        const available = Number((item.currentStock - reserved).toFixed(4));
        if (available < quantity) {
            res.status(400);
            throw new Error(`Insufficient stock. Available: ${available} ${item.unit || 'pcs'}`);
        }
    } else if (partId) {
        item = await Part.findOne({ _id: partId, owner: ownerId, isDeleted: false });
        if (!item) { res.status(404); throw new Error('Part not found'); }
        if (item.currentStock < quantity) {
            res.status(400);
            throw new Error(`Insufficient stock. Available: ${item.currentStock} ${item.unit}`);
        }
    }

    const transaction = await InventoryTransaction.create({
        materialId: materialId || undefined,
        productId: productId || undefined,
        partId: partId || undefined,
        itemName: req.body.itemName || undefined,
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
        entityType: 'InventoryTransaction',
        entityId: transaction._id,
        details: { type: 'OUT', quantity, referenceType, referenceId, materialId, productId, partId },
        ipAddress: req.ip,
    });

    res.status(201).json(transaction);
});

export { getTransactions, addStockIn, addStockOut };
