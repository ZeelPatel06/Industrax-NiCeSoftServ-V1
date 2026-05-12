import InventoryTransaction from '../models/InventoryTransaction.js';
import ProductionJob from '../models/ProductionJob.js';
import Order from '../models/Order.js';
import JobWorkOrder from '../models/JobWorkOrder.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get recent activities across the system
// @route   GET /api/dashboard/activity
// @access  Private
const getRecentActivity = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const [transactions, jobs, orders, jobWork] = await Promise.all([
        InventoryTransaction.find({ owner: ownerId, isDeleted: false }).sort({ createdAt: -1 }).limit(5).populate('materialId', 'name'),
        ProductionJob.find({ owner: ownerId, isDeleted: false }).sort({ updatedAt: -1 }).limit(5).populate('productId', 'name'),
        Order.find({ owner: ownerId, isDeleted: false }).sort({ createdAt: -1 }).limit(5),
        JobWorkOrder.find({ owner: ownerId, isDeleted: false }).sort({ createdAt: -1 }).limit(5).populate('clientId', 'name')
    ]);

    const activities = [
        ...transactions.map(t => ({
            id: t._id,
            type: 'inventory',
            title: `${t.type === 'IN' ? 'Restocked' : 'Deducted'} ${t.materialId?.name || 'Material'}`,
            description: `Quantity: ${t.quantity}`,
            timestamp: t.createdAt,
            status: t.type === 'IN' ? 'success' : 'warning'
        })),
        ...jobs.map(j => ({
            id: j._id,
            type: 'production',
            title: `Production Job: ${j.jobId}`,
            description: `${j.status} - ${j.productId?.name}`,
            timestamp: j.updatedAt,
            status: j.status === 'Completed' ? 'success' : 'info'
        })),
        ...orders.map(o => ({
            id: o._id,
            type: 'order',
            title: `New Order: ${o.customerName}`,
            description: `Status: ${o.status}`,
            timestamp: o.createdAt,
            status: o.status === 'Approved' ? 'success' : 'info'
        })),
        ...jobWork.map(jw => ({
            id: jw._id,
            type: 'job-work',
            title: `Job Work: ${jw.clientId?.name || 'Client'}`,
            description: `${jw.jobType} - ${jw.materialName || jw.orderTitle}`,
            timestamp: jw.createdAt,
            status: jw.status === 'Completed' ? 'success' : 'info'
        }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    res.json(activities);
});

export { getRecentActivity };
