import JobWorkProduct from '../models/JobWorkProduct.js';
import JobWorkBOM from '../models/JobWorkBOM.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';

export const getProducts = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const products = await JobWorkProduct.find({ owner: ownerId, isDeleted: false });
    res.json(products);
});

export const createProduct = asyncHandler(async (req, res) => {
    let { productCode, name, category, unit, standardCost, sellingPrice, bomItems } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!productCode) {
        productCode = await generateBusinessId(JobWorkProduct, 'JWP', 'productCode', ownerId);
    }

    const productExists = await JobWorkProduct.findOne({ productCode, owner: ownerId, isDeleted: false });
    if (productExists) {
        res.status(400);
        throw new Error('Product code already exists');
    }

    const product = new JobWorkProduct({
        productCode, name, category, unit, standardCost, sellingPrice,
        shape: req.body.shape || 'Generic',
        dimensions: req.body.dimensions,
        description: req.body.description,
        owner: ownerId,
    });

    const createdProduct = await product.save();

    if (bomItems && Array.isArray(bomItems) && bomItems.length > 0) {
        const bomDocs = bomItems.map(item => ({
            productId: createdProduct._id,
            materialId: item.materialId || undefined,
            partId: item.partId || undefined,
            qtyPerUnit: item.qtyPerUnit,
            unit: item.unit,
            owner: ownerId
        }));
        await JobWorkBOM.insertMany(bomDocs);
    }

    res.status(201).json(createdProduct);
});

export const updateProduct = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const { name, category, unit, standardCost, sellingPrice, description, shape, dimensions, bomItems } = req.body;
    const product = await JobWorkProduct.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (product) {
        product.name = name || product.name;
        product.category = category || product.category;
        product.unit = unit || product.unit;
        product.standardCost = standardCost !== undefined ? standardCost : product.standardCost;
        product.sellingPrice = sellingPrice !== undefined ? sellingPrice : product.sellingPrice;
        product.description = description || product.description;
        product.shape = shape || product.shape;
        product.dimensions = dimensions || product.dimensions;

        const updatedProduct = await product.save();

        if (bomItems && Array.isArray(bomItems)) {
            await JobWorkBOM.deleteMany({ productId: product._id, owner: ownerId });
            if (bomItems.length > 0) {
                const bomDocs = bomItems.map(item => ({
                    productId: product._id,
                    materialId: item.materialId || undefined,
                    partId: item.partId || undefined,
                    qtyPerUnit: item.qtyPerUnit,
                    unit: item.unit,
                    owner: ownerId
                }));
                await JobWorkBOM.insertMany(bomDocs);
            }
        }

        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

export const deleteProduct = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const product = await JobWorkProduct.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    const bomReference = await JobWorkBOM.findOne({ productId: req.params.id });
    if (bomReference) {
        res.status(400);
        throw new Error('Cannot delete product: It is used in Job Work BOM');
    }

    product.isDeleted = true;
    await product.save();
    res.json({ message: 'Product removed' });
});
