import JobWorkPart from '../models/JobWorkPart.js';
import JobWorkBOM from '../models/JobWorkBOM.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
import { logAudit } from '../middleware/auditLogger.js';

export const getParts = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const parts = await JobWorkPart.find({ owner: ownerId, isDeleted: false });
    res.json(parts);
});

export const createPart = asyncHandler(async (req, res) => {
    let { partCode, name, category, unit, standardCost, sellingPrice, bomItems } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!partCode) {
        partCode = await generateBusinessId(JobWorkPart, 'JWP', 'partCode', ownerId);
    }

    const partExists = await JobWorkPart.findOne({ partCode, owner: ownerId, isDeleted: false });
    if (partExists) {
        res.status(400);
        throw new Error('Part code already exists');
    }

    const part = new JobWorkPart({
        partCode, name, category, unit, standardCost, sellingPrice,
        shape: req.body.shape || 'Generic',
        dimensions: req.body.dimensions,
        description: req.body.description,
        owner: ownerId,
    });

    const createdPart = await part.save();

    if (bomItems && Array.isArray(bomItems) && bomItems.length > 0) {
        const bomDocs = bomItems.map(item => ({
            parentPartId: createdPart._id,
            materialId: item.materialId || undefined,
            partId: item.partId || undefined,
            qtyPerUnit: item.qtyPerUnit,
            unit: item.unit,
            owner: ownerId
        }));
        await JobWorkBOM.insertMany(bomDocs);
    }

    res.status(201).json(createdPart);
});

export const updatePart = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const { name, category, unit, standardCost, sellingPrice, description, shape, dimensions, bomItems } = req.body;
    const part = await JobWorkPart.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (part) {
        part.name = name || part.name;
        part.category = category || part.category;
        part.unit = unit || part.unit;
        part.standardCost = standardCost !== undefined ? standardCost : part.standardCost;
        part.sellingPrice = sellingPrice !== undefined ? sellingPrice : part.sellingPrice;
        part.description = description || part.description;
        part.shape = shape || part.shape;
        part.dimensions = dimensions || part.dimensions;

        const updatedPart = await part.save();

        if (bomItems && Array.isArray(bomItems)) {
            await JobWorkBOM.deleteMany({ parentPartId: part._id, owner: ownerId });
            if (bomItems.length > 0) {
                const bomDocs = bomItems.map(item => ({
                    parentPartId: part._id,
                    materialId: item.materialId || undefined,
                    partId: item.partId || undefined,
                    qtyPerUnit: item.qtyPerUnit,
                    unit: item.unit,
                    owner: ownerId
                }));
                await JobWorkBOM.insertMany(bomDocs);
            }
        }

        res.json(updatedPart);
    } else {
        res.status(404);
        throw new Error('Part not found');
    }
});

export const deletePart = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const part = await JobWorkPart.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (!part) {
        res.status(404);
        throw new Error('Part not found');
    }

    const bomReference = await JobWorkBOM.findOne({ $or: [{ partId: req.params.id }, { parentPartId: req.params.id }] });
    if (bomReference) {
        res.status(400);
        throw new Error('Cannot delete part: It is used in Job Work BOM');
    }

    part.isDeleted = true;
    await part.save();
    res.json({ message: 'Part removed' });
});
