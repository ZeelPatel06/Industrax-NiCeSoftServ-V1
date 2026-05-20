import JobWorkMaterial from '../models/JobWorkMaterial.js';
import JobWorkBOM from '../models/JobWorkBOM.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
import { logAudit } from '../middleware/auditLogger.js';

export const getMaterials = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const materials = await JobWorkMaterial.find({ owner: ownerId, isDeleted: false });
    res.json(materials);
});

export const createMaterial = asyncHandler(async (req, res) => {
    let { materialCode, name, unit, minimumLevel, price } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!materialCode) {
        materialCode = await generateBusinessId(JobWorkMaterial, 'JWM', 'materialCode', ownerId);
    }

    const materialExists = await JobWorkMaterial.findOne({ materialCode, owner: ownerId, isDeleted: false });
    if (materialExists) {
        res.status(400);
        throw new Error('Material code already exists');
    }

    const material = new JobWorkMaterial({
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
        entityType: 'JobWorkMaterial',
        entityId: createdMaterial._id,
        details: { materialCode, name },
        ipAddress: req.ip,
    });

    res.status(201).json(createdMaterial);
});

export const updateMaterial = asyncHandler(async (req, res) => {
    const { name, unit, minimumLevel, price } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    const material = await JobWorkMaterial.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (material) {
        material.name = name || material.name;
        material.unit = unit || material.unit;
        material.minimumLevel = minimumLevel !== undefined ? minimumLevel : material.minimumLevel;
        material.shape = req.body.shape || material.shape;
        material.dimensions = req.body.dimensions || material.dimensions;
        material.price = price !== undefined ? price : material.price;

        const updatedMaterial = await material.save();
        res.json(updatedMaterial);
    } else {
        res.status(404);
        throw new Error('Material not found');
    }
});

export const deleteMaterial = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const material = await JobWorkMaterial.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (!material) {
        res.status(404);
        throw new Error('Material not found');
    }

    const bomReference = await JobWorkBOM.findOne({ materialId: req.params.id });
    if (bomReference) {
        res.status(400);
        throw new Error('Cannot delete material: It is used in Job Work BOM');
    }

    material.isDeleted = true;
    await material.save();
    res.json({ message: 'Material removed' });
});
