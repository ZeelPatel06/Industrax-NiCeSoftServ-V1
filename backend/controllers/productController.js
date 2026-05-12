import Product from '../models/Product.js';
import Order from '../models/Order.js';
import BOM from '../models/BOM.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
import { logAudit } from '../middleware/auditLogger.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const products = await Product.find({ owner: ownerId, isDeleted: false });
    res.json(products);
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Owner
const createProduct = asyncHandler(async (req, res) => {
    let { productCode, name, category, unit, standardCost, sellingPrice, description, bomItems } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!productCode) {
        productCode = await generateBusinessId(Product, 'PRO', 'productCode', ownerId);
    }

    const productExists = await Product.findOne({ productCode, owner: ownerId, isDeleted: false });
    if (productExists) {
        res.status(400);
        throw new Error('Product code already exists for your company');
    }

    const product = new Product({
        productCode,
        name,
        category,
        unit,
        standardCost,
        sellingPrice,
        description,
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
        await BOM.insertMany(bomDocs);
    }

    await logAudit({
        userId: req.user._id,
        action: 'CREATE',
        entityType: 'Product',
        entityId: createdProduct._id,
        details: { productCode, name, category, unit, standardCost, sellingPrice, description },
        ipAddress: req.ip,
    });

    res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Owner
const updateProduct = asyncHandler(async (req, res) => {
    const { name, category, unit, standardCost, sellingPrice, description, isActive, bomItems } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid Product ID');
    }

    const product = await Product.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (product) {
        product.name = name || product.name;
        product.category = category || product.category;
        product.unit = unit || product.unit;
        product.standardCost = standardCost !== undefined ? standardCost : product.standardCost;
        product.sellingPrice = sellingPrice !== undefined ? sellingPrice : product.sellingPrice;
        product.description = description || product.description;
        if (isActive !== undefined) {
            product.isActive = isActive;
        }

        const updatedProduct = await product.save();

        // Update BOM Items if provided
        if (bomItems && Array.isArray(bomItems)) {
            // Remove existing BOM lines for this product
            await BOM.deleteMany({ productId: product._id, owner: ownerId });

            // Add new explicit lines
            if (bomItems.length > 0) {
                const bomDocs = bomItems.map(item => ({
                    productId: product._id,
                    materialId: item.materialId || undefined,
                    partId: item.partId || undefined,
                    qtyPerUnit: item.qtyPerUnit,
                    unit: item.unit,
                    owner: ownerId
                }));
                await BOM.insertMany(bomDocs);
            }
        }

        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            entityType: 'Product',
            entityId: updatedProduct._id,
            details: { name, category, unit, standardCost, sellingPrice, isActive },
            ipAddress: req.ip,
        });

        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Owner
const deleteProduct = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid Product ID');
    }

    // Check if product is referenced in any order for THIS owner
    const ordersWithProduct = await Order.findOne({ 'items.productId': req.params.id, owner: ownerId });
    if (ordersWithProduct) {
        res.status(400);
        throw new Error('Cannot delete product if referenced in orders');
    }

    const product = await Product.findOne({ _id: req.params.id, owner: ownerId });

    if (product) {
        product.isDeleted = true;
        await product.save();

        await logAudit({
            userId: req.user._id,
            action: 'DELETE',
            entityType: 'Product',
            entityId: product._id,
            details: { deleted: true },
            ipAddress: req.ip,
        });

        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

export { getProducts, createProduct, updateProduct, deleteProduct };
