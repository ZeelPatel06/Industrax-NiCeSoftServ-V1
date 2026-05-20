import JobWorkOrder from '../models/JobWorkOrder.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getOrders = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const orders = await JobWorkOrder.find({ owner: ownerId, isDeleted: false })
        .populate('clientId', 'name phone')
        .populate('outputProduct', 'name productCode standardCost')
        .populate('outputPart', 'name partCode standardCost');
    res.json(orders);
});

export const createOrder = asyncHandler(async (req, res) => {
    const {
        clientId,
        orderTitle,
        materialName,
        materialQuantity,
        unit,
        materials,
        jobType,
        rate,
        totalAmount: bodyTotalAmount,
        isClientMaterial,
        deadline,
        outputProduct,
        outputPart
    } = req.body;

    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    const totalAmount = bodyTotalAmount !== undefined ? bodyTotalAmount : (materialQuantity * (rate || 0));
    const finalRate = rate !== undefined ? rate : (totalAmount / (materialQuantity || 1));

    const order = new JobWorkOrder({
        clientId,
        orderTitle,
        materialName,
        materialQuantity,
        unit,
        materials,
        jobType,
        rate: finalRate,
        totalAmount,
        isClientMaterial,
        deadline,
        outputProduct,
        outputPart,
        owner: ownerId,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
});

export const updateOrder = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const order = await JobWorkOrder.findById(req.params.id);

    if (order && order.owner === ownerId) {
        order.clientId = req.body.clientId || order.clientId;
        order.orderTitle = req.body.orderTitle || order.orderTitle;
        order.materialName = req.body.materialName || order.materialName;
        order.materialQuantity = req.body.materialQuantity !== undefined ? req.body.materialQuantity : order.materialQuantity;
        order.unit = req.body.unit || order.unit;
        order.materials = req.body.materials !== undefined ? req.body.materials : order.materials;
        order.jobType = req.body.jobType || order.jobType;
        order.status = req.body.status || order.status;
        order.deadline = req.body.deadline || order.deadline;
        order.isClientMaterial = req.body.isClientMaterial !== undefined ? req.body.isClientMaterial : order.isClientMaterial;
        order.outputProduct = req.body.outputProduct !== undefined ? req.body.outputProduct : order.outputProduct;
        order.outputPart = req.body.outputPart !== undefined ? req.body.outputPart : order.outputPart;
        
        if (req.body.totalAmount !== undefined) {
            order.totalAmount = req.body.totalAmount;
            order.rate = order.materialQuantity > 0 ? (order.totalAmount / order.materialQuantity) : 0;
        } else if (req.body.rate !== undefined && order.materialQuantity) {
            order.rate = req.body.rate;
            order.totalAmount = order.materialQuantity * order.rate;
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found or unauthorized');
    }
});

export const deleteOrder = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const order = await JobWorkOrder.findById(req.params.id);

    if (order && order.owner === ownerId) {
        order.isDeleted = true;
        await order.save();
        res.json({ message: 'Order removed' });
    } else {
        res.status(404);
        throw new Error('Order not found or unauthorized');
    }
});

// Sync JWO rate and qty to master catalog (Product/Part)
export const syncToCatalog = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const order = await JobWorkOrder.findById(req.params.id)
        .populate('outputProduct')
        .populate('outputPart');

    if (!order || order.owner !== ownerId) {
        res.status(404);
        throw new Error('Job Work Order not found');
    }

    if (!order.outputProduct && !order.outputPart) {
        res.status(400);
        throw new Error('No output product or part linked to this order for synchronization');
    }

    const rate = order.rate || 0;
    const qty = order.materialQuantity || 0;

    if (order.outputProduct) {
        const JobWorkProduct = (await import('../models/JobWorkProduct.js')).default;
        await JobWorkProduct.findByIdAndUpdate(order.outputProduct._id, {
            sellingPrice: rate
        });
    }

    if (order.outputPart) {
        const JobWorkPart = (await import('../models/JobWorkPart.js')).default;
        await JobWorkPart.findByIdAndUpdate(order.outputPart._id, {
            sellingPrice: rate
        });
    }

    res.json({ message: 'Master catalog synchronized successfully with JWO rate.' });
});
