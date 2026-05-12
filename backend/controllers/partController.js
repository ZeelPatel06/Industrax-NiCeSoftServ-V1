import Part from '../models/Part.js';
import BOM from '../models/BOM.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';

export const getParts = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const parts = await Part.find({ owner: ownerId, isDeleted: false });
    res.json(parts);
});

export const createPart = asyncHandler(async (req, res) => {
    let { partCode, name, category, unit, standardCost, sellingPrice, description, bomItems } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!partCode) {
        partCode = await generateBusinessId(Part, 'PRT', 'partCode', ownerId);
    }

    const partExists = await Part.findOne({ partCode, owner: ownerId, isDeleted: false });
    if (partExists) {
        res.status(400);
        throw new Error('Part code already exists for your company');
    }

    const part = new Part({
        partCode,
        name,
        category,
        unit,
        standardCost,
        sellingPrice,
        description,
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
        await BOM.insertMany(bomDocs);
    }

    res.status(201).json(createdPart);
});

export const updatePart = asyncHandler(async (req, res) => {
    const { name, category, unit, standardCost, sellingPrice, description, isActive, bomItems } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    const part = await Part.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (part) {
        part.name = name || part.name;
        part.category = category || part.category;
        part.unit = unit || part.unit;
        part.standardCost = standardCost !== undefined ? standardCost : part.standardCost;
        part.sellingPrice = sellingPrice !== undefined ? sellingPrice : part.sellingPrice;
        part.description = description || part.description;
        if (isActive !== undefined) part.isActive = isActive;

        const updatedPart = await part.save();

        // Update BOM Items if provided
        if (bomItems && Array.isArray(bomItems)) {
            // Remove existing BOM lines for this part
            await BOM.deleteMany({ parentPartId: part._id, owner: ownerId });

            // Add new explicit lines
            if (bomItems.length > 0) {
                const bomDocs = bomItems.map(item => ({
                    parentPartId: part._id,
                    materialId: item.materialId || undefined,
                    partId: item.partId || undefined,
                    qtyPerUnit: item.qtyPerUnit,
                    unit: item.unit,
                    owner: ownerId
                }));
                await BOM.insertMany(bomDocs);
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
    const part = await Part.findOne({ _id: req.params.id, owner: ownerId });

    if (part) {
        part.isDeleted = true;
        await part.save();
        res.json({ message: 'Part removed' });
    } else {
        res.status(404);
        throw new Error('Part not found');
    }
});
