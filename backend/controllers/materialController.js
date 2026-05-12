import Material from '../models/Material.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import BOM from '../models/BOM.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
import { logAudit } from '../middleware/auditLogger.js';

// @desc    Get all materials
// @route   GET /api/materials
// @access  Private
const getMaterials = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const materials = await Material.find({ owner: ownerId, isDeleted: false });
    res.json(materials);
});

// @desc    Create a material
// @route   POST /api/materials
// @access  Private/Owner
const createMaterial = asyncHandler(async (req, res) => {
    let { materialCode, name, unit, minimumLevel, price } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!materialCode) {
        materialCode = await generateBusinessId(Material, 'MAT', 'materialCode', ownerId);
    }

    const materialExists = await Material.findOne({ materialCode, owner: ownerId, isDeleted: false });
    if (materialExists) {
        res.status(400);
        throw new Error('Material code already exists for your company');
    }

    const material = new Material({
        materialCode,
        name,
        unit,
        minimumLevel,
        shape: req.body.shape || 'Generic',
        dimensions: req.body.dimensions,
        price: price || 0,
        owner: ownerId,
    });

    const createdMaterial = await material.save();

    await logAudit({
        userId: req.user._id,
        action: 'CREATE',
        entityType: 'Material',
        entityId: createdMaterial._id,
        details: { materialCode, name, unit, minimumLevel, price },
        ipAddress: req.ip,
    });

    res.status(201).json(createdMaterial);
});

// @desc    Update a material
// @route   PUT /api/materials/:id
// @access  Private/Owner
const updateMaterial = asyncHandler(async (req, res) => {
    const { name, unit, minimumLevel, price } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid Material ID');
    }

    const material = await Material.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (material) {
        material.name = name || material.name;
        material.unit = unit || material.unit;
        material.minimumLevel = minimumLevel !== undefined ? minimumLevel : material.minimumLevel;
        material.shape = req.body.shape || material.shape;
        material.dimensions = req.body.dimensions || material.dimensions;
        material.price = price !== undefined ? price : material.price;

        const updatedMaterial = await material.save();

        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            entityType: 'Material',
            entityId: updatedMaterial._id,
            details: { name, unit, minimumLevel, price },
            ipAddress: req.ip,
        });

        res.json(updatedMaterial);
    } else {
        res.status(404);
        throw new Error('Material not found');
    }
});

// @desc    Delete a material
// @route   DELETE /api/materials/:id
// @access  Private/Owner
const deleteMaterial = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid Material ID');
    }

    const material = await Material.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (!material) {
        res.status(404);
        throw new Error('Material not found');
    }

    // Safety Check 1: Check if referenced in any BOM
    const bomReference = await BOM.findOne({ materialId: req.params.id });
    if (bomReference) {
        res.status(400);
        throw new Error('Cannot delete material: It is being used in one or more Bill of Materials (BOMs).');
    }

    // Safety Check 2: Check if there are any inventory transactions
    const transactionReference = await InventoryTransaction.findOne({ materialId: req.params.id });
    if (transactionReference) {
        res.status(400);
        throw new Error('Cannot delete material: It has inventory transaction history. Archive it or delete transactions first.');
    }

    material.isDeleted = true;
    await material.save();

    await logAudit({
        userId: req.user._id,
        action: 'DELETE',
        entityType: 'Material',
        entityId: req.params.id,
        details: { deleted: true },
        ipAddress: req.ip,
    });

    res.json({ message: 'Material removed successfully (soft deleted)' });
});

export { getMaterials, createMaterial, updateMaterial, deleteMaterial };
