import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ProductionJob from '../models/ProductionJob.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
import { logAudit } from '../middleware/auditLogger.js';

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const rawOrders = await Order.find({ owner: ownerId, isDeleted: false }).populate('items.productId', 'name productCode sellingPrice').lean();
    const orders = rawOrders.map(order => ({
        ...order,
        items: order.items || []
    }));
    
    // Check for active production jobs for each order
    for (let order of orders) {
        const activeJobs = await ProductionJob.countDocuments({ 
            orderId: order._id, 
            owner: ownerId,
            status: { $ne: 'Completed' },
            isDeleted: false
        });
        order.inProduction = activeJobs > 0 || order.status === 'In Production';
    }
    
    res.json(orders);
});

// @access  Private
const createOrder = asyncHandler(async (req, res) => {
    let { customerName, deliveryDate, items, orderId } = req.body;

    if (items && items.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }

    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!orderId) {
        orderId = await generateBusinessId(Order, 'ORD', 'orderId', ownerId);
    }

    for (let item of items) {
        if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
            res.status(400);
            throw new Error(`Invalid Product ID: ${item.productId}`);
        }
    }

    const order = new Order({
        customerName,
        orderId,
        deliveryDate,
        items,
        status: 'Draft',
        owner: ownerId,
    });

    const createdOrder = await order.save();

    await logAudit({
        userId: req.user._id,
        action: 'CREATE',
        entityType: 'Order',
        entityId: createdOrder._id,
        details: { orderId, customerName, deliveryDate, items },
        ipAddress: req.ip,
    });

    res.status(201).json(createdOrder);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Owner or Operator
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ['Draft', 'Approved', 'In Production', 'Completed', 'Delivered'];

    if (req.user.role === 'Operator') {
        res.status(403);
        throw new Error('Operators are not authorized to change order status');
    }

    if (!allowedStatuses.includes(status)) {
        res.status(400);
        throw new Error('Invalid status');
    }

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid Order ID');
    }

    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const order = await Order.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (order) {
        const oldStatus = order.status;
        order.status = status;

        if ((status === 'Completed' || status === 'Delivered') && 
            (oldStatus !== 'Completed' && oldStatus !== 'Delivered')) {
            order.completionDate = Date.now();
        }

        const updatedOrder = await order.save();

        // If status changed to Delivered, deduct product stock
        if (status === 'Delivered' && oldStatus !== 'Delivered') {
            for (let item of order.items) {
                const product = await Product.findOne({ _id: item.productId, owner: ownerId });
                if (product) {
                    product.currentStock = Number((product.currentStock - item.quantity).toFixed(4));
                    await product.save();

                    // Record inventory transaction
                    await InventoryTransaction.create({
                        productId: product._id,
                        type: 'OUT',
                        quantity: item.quantity,
                        referenceType: 'order',
                        referenceId: order._id,
                        owner: ownerId,
                    });
                }
            }
        }

        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            entityType: 'Order',
            entityId: updatedOrder._id,
            details: { status: updatedOrder.status },
            ipAddress: req.ip,
        });

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Owner
const deleteOrder = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid Order ID');
    }

    const order = await Order.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Check if order is in production
    const activeJobs = await ProductionJob.countDocuments({ 
        orderId: req.params.id, 
        owner: ownerId,
        status: { $ne: 'Completed' },
        isDeleted: false
    });

    if (activeJobs > 0 || order.status === 'In Production') {
        res.status(400);
        throw new Error('Cannot delete order that is currently in production');
    }

    order.isDeleted = true;
    await order.save();

    await logAudit({
        userId: req.user._id,
        action: 'DELETE',
        entityType: 'Order',
        entityId: req.params.id,
        details: { deleted: true },
        ipAddress: req.ip,
    });

    res.json({ message: 'Order removed successfully (soft deleted)' });
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = asyncHandler(async (req, res) => {
    const { customerName, deliveryDate, items } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    const order = await Order.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (order) {
        if (order.status !== 'Draft' && order.status !== 'Approved') {
            res.status(400);
            throw new Error('Only orders in Draft or Approved status can be modified');
        }

        order.customerName = customerName || order.customerName;
        order.deliveryDate = deliveryDate || order.deliveryDate;
        if (items) order.items = items;

        const updatedOrder = await order.save();

        await logAudit({
            userId: req.user._id,
            action: 'UPDATE',
            entityType: 'Order',
            entityId: updatedOrder._id,
            details: { customerName, deliveryDate, items },
            ipAddress: req.ip,
        });

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

export { getOrders, createOrder, updateOrderStatus, updateOrder, deleteOrder };
