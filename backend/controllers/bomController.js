import BOM from '../models/BOM.js';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
import { logAudit } from '../middleware/auditLogger.js';

// @desc    Get BOM for a product
// @route   GET /api/bom/:productId
// @access  Private
const getBOMByProduct = asyncHandler(async (req, res) => {
    const { id } = req.params; // Generic ID param
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid Reference ID');
    }
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    
    const bom = await BOM.find({ 
        $or: [{ productId: id }, { jobWorkOrderId: id }, { parentPartId: id }], 
        owner: ownerId, 
        isDeleted: false 
    })
    .populate('materialId', 'name materialCode unit price')
    .populate('partId', 'name partCode unit standardCost');
    
    res.json(bom);
});

// @desc    Get all BOMs for a company
// @route   GET /api/bom
// @access  Private
const getAllBOMs = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const boms = await BOM.find({ owner: ownerId, isDeleted: false });
    res.json(boms);
});

// @desc    Add material to product BOM
// @route   POST /api/bom
// @access  Private/Owner
const addBOMItem = asyncHandler(async (req, res) => {
    const { productId, jobWorkOrderId, parentPartId, materialId, partId, qtyPerUnit, unit } = req.body;

    if ((!productId && !jobWorkOrderId && !parentPartId) || (productId && !mongoose.Types.ObjectId.isValid(productId)) || (jobWorkOrderId && !mongoose.Types.ObjectId.isValid(jobWorkOrderId)) || (parentPartId && !mongoose.Types.ObjectId.isValid(parentPartId))) {
        res.status(400);
        throw new Error('Valid Product ID, Job Work Order ID or Part ID is required');
    }
    if (!materialId && !partId) {
        res.status(400);
        throw new Error('Either Material ID or Part ID must be provided');
    }

    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    const bomExistsQuery = {
        productId: productId || null,
        jobWorkOrderId: jobWorkOrderId || null,
        parentPartId: parentPartId || null,
        owner: ownerId,
        isDeleted: false
    };
    if (materialId) bomExistsQuery.materialId = materialId;
    if (partId) bomExistsQuery.partId = partId;

    const bomExists = await BOM.findOne(bomExistsQuery);
    if (bomExists) {
        res.status(400);
        throw new Error('Material already exists in this BOM for your company');
    }

    const bomItem = await BOM.create({
        productId: productId || undefined,
        jobWorkOrderId: jobWorkOrderId || undefined,
        parentPartId: parentPartId || undefined,
        materialId: materialId || undefined,
        partId: partId || undefined,
        qtyPerUnit,
        unit, // Use provided unit
        owner: ownerId,
    });

    await logAudit({
        userId: req.user._id,
        action: 'CREATE',
        entityType: 'BOM',
        entityId: bomItem._id,
        details: { productId, materialId, partId, qtyPerUnit, unit },
        ipAddress: req.ip,
    });

    res.status(201).json(bomItem);
});

// @desc    Delete material from product BOM
// @route   DELETE /api/bom/:id
// @access  Private/Owner
const deleteBOMItem = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid BOM Item ID');
    }
    const bomItem = await BOM.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });
    if (!bomItem) {
        res.status(404);
        throw new Error('BOM Item not found');
    }
    
    bomItem.isDeleted = true;
    await bomItem.save();

    await logAudit({
        userId: req.user._id,
        action: 'DELETE',
        entityType: 'BOM',
        entityId: req.params.id,
        details: { deleted: true },
        ipAddress: req.ip,
    });

    res.json({ message: 'Material removed from BOM (soft deleted)' });
});

// @desc    Update material in product BOM
// @route   PUT /api/bom/item/:id
// @access  Private/Owner
const updateBOMItem = asyncHandler(async (req, res) => {
    const { qtyPerUnit, unit } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid BOM Item ID');
    }

    const bomItem = await BOM.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });
    if (!bomItem) {
        res.status(404);
        throw new Error('BOM Item not found');
    }

    bomItem.qtyPerUnit = qtyPerUnit !== undefined ? qtyPerUnit : bomItem.qtyPerUnit;
    bomItem.unit = unit !== undefined ? unit : bomItem.unit;
    await bomItem.save();

    await logAudit({
        userId: req.user._id,
        action: 'UPDATE',
        entityType: 'BOM',
        entityId: bomItem._id,
        details: { qtyPerUnit, unit },
        ipAddress: req.ip,
    });

    res.json(bomItem);
});

export { getBOMByProduct, getAllBOMs, addBOMItem, deleteBOMItem, updateBOMItem };
