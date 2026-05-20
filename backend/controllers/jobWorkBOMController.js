import JobWorkBOM from '../models/JobWorkBOM.js';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import JobWorkPart from '../models/JobWorkPart.js';
import JobWorkProduct from '../models/JobWorkProduct.js';
import JobWorkMaterial from '../models/JobWorkMaterial.js';
import Part from '../models/Part.js';
import Product from '../models/Product.js';
import Material from '../models/Material.js';
import BOM from '../models/BOM.js';

export const getBOMItems = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const { productId, jobWorkOrderId, parentPartId } = req.query;

    let query = { owner: ownerId };
    if (productId) query.productId = productId;
    else if (jobWorkOrderId) query.jobWorkOrderId = jobWorkOrderId;
    else if (parentPartId) query.parentPartId = parentPartId;
    else {
        return res.json([]);
    }

    // Perform complete background synchronization from Standard BOM
    if (parentPartId) {
        const jwPart = await JobWorkPart.findOne({ _id: parentPartId, owner: ownerId, isDeleted: false });
        if (jwPart) {
            // Find standard Part with the same partCode
            const stdPart = await Part.findOne({ partCode: jwPart.partCode, owner: ownerId, isDeleted: false });
            if (stdPart) {
                // Find standard BOM items
                const stdBomItems = await BOM.find({ parentPartId: stdPart._id, owner: ownerId, isDeleted: false })
                    .populate('materialId')
                    .populate('partId');
                
                const activeJwBomIds = [];
                
                for (const stdItem of stdBomItems) {
                    let jwMatId = undefined;
                    let jwPartRefId = undefined;

                    if (stdItem.materialId) {
                        // Find or copy JobWorkMaterial
                        const stdMat = stdItem.materialId;
                        let jwMat = await JobWorkMaterial.findOne({ materialCode: stdMat.materialCode, owner: ownerId, isDeleted: false });
                        if (!jwMat) {
                            jwMat = new JobWorkMaterial({
                                materialCode: stdMat.materialCode,
                                name: stdMat.name,
                                unit: stdMat.unit,
                                currentStock: 0,
                                price: stdMat.price || 0,
                                shape: stdMat.shape || 'Generic',
                                dimensions: stdMat.dimensions,
                                owner: ownerId
                            });
                            await jwMat.save();
                        }
                        jwMatId = jwMat._id;
                    }

                    if (stdItem.partId) {
                        // Find or copy JobWorkPart
                        const stdPartRef = stdItem.partId;
                        let jwPartRef = await JobWorkPart.findOne({ partCode: stdPartRef.partCode, owner: ownerId, isDeleted: false });
                        if (!jwPartRef) {
                            jwPartRef = new JobWorkPart({
                                partCode: stdPartRef.partCode,
                                name: stdPartRef.name,
                                category: stdPartRef.category,
                                unit: stdPartRef.unit || 'pcs',
                                standardCost: stdPartRef.standardCost || 0,
                                sellingPrice: stdPartRef.sellingPrice || 0,
                                shape: stdPartRef.shape || 'Generic',
                                dimensions: stdPartRef.dimensions,
                                owner: ownerId
                            });
                            await jwPartRef.save();
                        }
                        jwPartRefId = jwPartRef._id;
                    }

                    if (jwMatId || jwPartRefId) {
                        let jwBomItem = await JobWorkBOM.findOne({
                            parentPartId: jwPart._id,
                            materialId: jwMatId,
                            partId: jwPartRefId,
                            owner: ownerId
                        });

                        if (!jwBomItem) {
                            jwBomItem = new JobWorkBOM({
                                parentPartId: jwPart._id,
                                materialId: jwMatId,
                                partId: jwPartRefId,
                                qtyPerUnit: stdItem.qtyPerUnit,
                                unit: stdItem.unit || '',
                                owner: ownerId
                            });
                            await jwBomItem.save();
                        } else {
                            // Update qty & unit in case standard BOM changed
                            jwBomItem.qtyPerUnit = stdItem.qtyPerUnit;
                            jwBomItem.unit = stdItem.unit || jwBomItem.unit;
                            await jwBomItem.save();
                        }
                        activeJwBomIds.push(jwBomItem._id.toString());
                    }
                }

                // Clean up Job Work BOM items that were deleted from Standard BOM
                if (stdBomItems.length > 0) {
                    await JobWorkBOM.deleteMany({
                        parentPartId: jwPart._id,
                        owner: ownerId,
                        _id: { $nin: activeJwBomIds }
                    });
                }
            }
        }
    } else if (productId) {
        const jwProduct = await JobWorkProduct.findOne({ _id: productId, owner: ownerId, isDeleted: false });
        if (jwProduct) {
            // Find standard Product with the same productCode
            const stdProduct = await Product.findOne({ productCode: jwProduct.productCode, owner: ownerId, isDeleted: false });
            if (stdProduct) {
                // Find standard BOM items
                const stdBomItems = await BOM.find({ productId: stdProduct._id, owner: ownerId, isDeleted: false })
                    .populate('materialId')
                    .populate('partId');
                
                const activeJwBomIds = [];

                for (const stdItem of stdBomItems) {
                    let jwMatId = undefined;
                    let jwPartRefId = undefined;

                    if (stdItem.materialId) {
                        const stdMat = stdItem.materialId;
                        let jwMat = await JobWorkMaterial.findOne({ materialCode: stdMat.materialCode, owner: ownerId, isDeleted: false });
                        if (!jwMat) {
                            jwMat = new JobWorkMaterial({
                                materialCode: stdMat.materialCode,
                                name: stdMat.name,
                                unit: stdMat.unit,
                                currentStock: 0,
                                price: stdMat.price || 0,
                                shape: stdMat.shape || 'Generic',
                                dimensions: stdMat.dimensions,
                                owner: ownerId
                            });
                            await jwMat.save();
                        }
                        jwMatId = jwMat._id;
                    }

                    if (stdItem.partId) {
                        const stdPartRef = stdItem.partId;
                        let jwPartRef = await JobWorkPart.findOne({ partCode: stdPartRef.partCode, owner: ownerId, isDeleted: false });
                        if (!jwPartRef) {
                            jwPartRef = new JobWorkPart({
                                partCode: stdPartRef.partCode,
                                name: stdPartRef.name,
                                category: stdPartRef.category,
                                unit: stdPartRef.unit || 'pcs',
                                standardCost: stdPartRef.standardCost || 0,
                                sellingPrice: stdPartRef.sellingPrice || 0,
                                shape: stdPartRef.shape || 'Generic',
                                dimensions: stdPartRef.dimensions,
                                owner: ownerId
                            });
                            await jwPartRef.save();
                        }
                        jwPartRefId = jwPartRef._id;
                    }

                    if (jwMatId || jwPartRefId) {
                        let jwBomItem = await JobWorkBOM.findOne({
                            productId: jwProduct._id,
                            materialId: jwMatId,
                            partId: jwPartRefId,
                            owner: ownerId
                        });

                        if (!jwBomItem) {
                            jwBomItem = new JobWorkBOM({
                                productId: jwProduct._id,
                                materialId: jwMatId,
                                partId: jwPartRefId,
                                qtyPerUnit: stdItem.qtyPerUnit,
                                unit: stdItem.unit || '',
                                owner: ownerId
                            });
                            await jwBomItem.save();
                        } else {
                            jwBomItem.qtyPerUnit = stdItem.qtyPerUnit;
                            jwBomItem.unit = stdItem.unit || jwBomItem.unit;
                            await jwBomItem.save();
                        }
                        activeJwBomIds.push(jwBomItem._id.toString());
                    }
                }

                // Clean up Job Work BOM items that were deleted from Standard BOM
                if (stdBomItems.length > 0) {
                    await JobWorkBOM.deleteMany({
                        productId: jwProduct._id,
                        owner: ownerId,
                        _id: { $nin: activeJwBomIds }
                    });
                }
            }
        }
    }

    const bomItems = await JobWorkBOM.find(query)
        .populate('materialId')
        .populate('partId');

    res.json(bomItems);
});

export const addBOMItem = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const { productId, jobWorkOrderId, parentPartId, materialId, partId, qtyPerUnit, unit } = req.body;

    const bomItem = new JobWorkBOM({
        productId,
        jobWorkOrderId,
        parentPartId,
        materialId,
        partId,
        qtyPerUnit,
        unit,
        owner: ownerId
    });

    const createdItem = await bomItem.save();
    res.status(201).json(createdItem);
});

export const updateBOMItem = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const item = await JobWorkBOM.findById(req.params.id);

    if (item && item.owner === ownerId) {
        item.qtyPerUnit = req.body.qtyPerUnit || item.qtyPerUnit;
        item.unit = req.body.unit || item.unit;
        
        const updatedItem = await item.save();
        res.json(updatedItem);
    } else {
        res.status(404);
        throw new Error('BOM item not found');
    }
});

export const deleteBOMItem = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const item = await JobWorkBOM.findById(req.params.id);

    if (item && item.owner === ownerId) {
        await JobWorkBOM.deleteOne({ _id: item._id });
        res.json({ message: 'BOM item removed' });
    } else {
        res.status(404);
        throw new Error('BOM item not found');
    }
});
