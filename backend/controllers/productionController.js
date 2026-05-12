import ProductionJob from '../models/ProductionJob.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import JobWorkOrder from '../models/JobWorkOrder.js';
import BOM from '../models/BOM.js';
import Material from '../models/Material.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/asyncHandler.js';
import { logAudit } from '../middleware/auditLogger.js';
import Machine from '../models/Machine.js';

// @desc    Create a production job
// @route   POST /api/production
// @access  Private/Owner or Operator
const createProductionJob = asyncHandler(async (req, res) => {
    let { jobId, orderId, productId, partId, plannedQty, endDate, priority, machineId, operatorId } = req.body;

    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    // Sanitize and validate IDs to prevent BSON casting errors
    if (productId === "") productId = null;
    if (partId === "") partId = null;
    if (orderId === "") orderId = null;
    if (machineId === "") machineId = null;
    if (operatorId === "") operatorId = null;

    if (orderId && !mongoose.Types.ObjectId.isValid(orderId)) {
        res.status(400);
        throw new Error(`Invalid Order ID format: ${orderId}`);
    }

    if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400);
        throw new Error(`Invalid Product ID format: ${productId}`);
    }

    if (partId && !mongoose.Types.ObjectId.isValid(partId)) {
        res.status(400);
        throw new Error(`Invalid Part ID format: ${partId}`);
    }

    if (machineId && !mongoose.Types.ObjectId.isValid(machineId)) {
        res.status(400);
        throw new Error(`Invalid Machine ID format: ${machineId}`);
    }

    if (operatorId && !mongoose.Types.ObjectId.isValid(operatorId)) {
        res.status(400);
        throw new Error(`Invalid Operator ID format: ${operatorId}`);
    }

    if (!jobId) {
        jobId = await generateBusinessId(ProductionJob, 'JOB', 'jobId', ownerId);
    }

    // Determine if it's a regular Order or a Job Work Order
    let order = null;
    let orderModel = 'Order';

    if (orderId) {
        order = await Order.findOne({ _id: orderId, owner: ownerId, isDeleted: false });
        if (!order) {
            order = await JobWorkOrder.findOne({ _id: orderId, owner: ownerId, isDeleted: false });
            orderModel = 'JobWorkOrder';
        }

        if (!order) {
            // Log for debugging (server side)
            console.log(`[ProductionJob] Record not found. ID: ${orderId}, Owner: ${ownerId}`);
            res.status(404);
            throw new Error(`The linked record (ID: ${orderId}) was not found in your account. Please ensure the order belongs to your organization.`);
        }
    } else {
        orderModel = null;
    }

    // Fallback plannedQty if missing or 0 in payload
    if (!plannedQty || plannedQty <= 0) {
        if (order) {
            if (orderModel === 'Order') {
                plannedQty = order.items?.[0]?.quantity || 1;
            } else {
                plannedQty = order.materialQuantity || 1;
            }
        } else {
            plannedQty = 1;
        }
    }

    // Validation for regular Orders only
    if (orderModel === 'Order' && order) {
        if (!productId) {
            productId = order.items?.[0]?.productId;
        }
        if (!productId) {
            res.status(400);
            throw new Error('Product is required for standard orders');
        }
        if (order.status !== 'Approved') {
            res.status(400);
            throw new Error('Order must be Approved to create a production job');
        }
    } else if (!order) {
        if (!productId && !partId) {
            res.status(400);
            throw new Error('Product or Part must be selected for internal production');
        }
    }

    // Skip BOM check for for Client Provided Material in Job Work
    let skipBOM = false;
    if (orderModel === 'JobWorkOrder' && order.isClientMaterial) {
        skipBOM = true;
    }

    let requiredMaterials = [];
    if (!skipBOM) {
        // Find BOM items based on either Product (for regular orders), Part (sub-assembly), or JobWorkOrder (for custom job work)
        let bomQuery;
        if (orderModel === 'Order' || !order) {
            if (productId) {
                bomQuery = { productId, owner: ownerId, isDeleted: false };
            } else if (partId) {
                bomQuery = { parentPartId: partId, owner: ownerId, isDeleted: false };
            }
        } else if (orderModel === 'JobWorkOrder') {
            bomQuery = { jobWorkOrderId: orderId, owner: ownerId, isDeleted: false };
        }
            
        const bomItems = await BOM.find(bomQuery).populate('materialId').populate('partId');
        const insufficientMaterials = [];

        for (let item of bomItems) {
            const needed = Number((item.qtyPerUnit * plannedQty).toFixed(4));
            const available = item.materialId 
                ? Number((item.materialId.currentStock - item.materialId.reservedStock).toFixed(4)) 
                : (item.partId ? Number((item.partId.currentStock - item.partId.reservedStock).toFixed(4)) : 0);

            if (available < needed) {
                insufficientMaterials.push(`${item.materialId?.name || item.partId?.name || 'Unknown'}: Needed ${needed}, Available ${available}`);
            } else {
                requiredMaterials.push({ entity: item.materialId || item.partId, needed });
            }
        }

        if (insufficientMaterials.length > 0) {
            res.status(400);
            throw new Error('Insufficient inventory: ' + JSON.stringify(insufficientMaterials));
        }

        // Reserve stock
        for (let req of requiredMaterials) {
            if (req.entity) {
                req.entity.reservedStock = Number((req.entity.reservedStock + req.needed).toFixed(4));
                await req.entity.save();
            }
        }
    }

    const job = await ProductionJob.create({
        jobId,
        orderId,
        orderModel,
        productId,
        partId,
        plannedQty,
        endDate,
        priority: priority || 'Normal',
        owner: ownerId,
        machineId: machineId || null,
        operatorId: operatorId || null,
    });

    // If a machine is assigned, set it to Running
    if (machineId) {
        await Machine.findByIdAndUpdate(machineId, {
            currentJobId: job._id,
            operationalStatus: 'Running',
            currentOperatorId: operatorId || null
        });
    }

    await logAudit({
        userId: req.user._id,
        action: 'CREATE',
        entityType: 'ProductionJob',
        entityId: job._id,
        details: { jobId, orderId, productId, partId, plannedQty, endDate, priority, machineId, operatorId },
        ipAddress: req.ip,
    });

    res.status(201).json(job);
});

// @desc    Get all production jobs
// @route   GET /api/production
// @access  Private
const getProductionJobs = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const jobs = await ProductionJob.find({ owner: ownerId, isDeleted: false })
        .populate('productId', 'name productCode standardCost')
        .populate('partId', 'name partCode standardCost')
        .populate('machineId', 'name type operationalStatus')
        .populate('operatorId', 'name role')
        .populate({ 
            path: 'orderId', 
            populate: { 
                path: 'clientId', 
                select: 'name',
                options: { strictPopulate: false }
            },
            select: 'customerName name orderTitle jobType clientId',
            options: { strictPopulate: false }
        });
    res.json(jobs);
});

// @desc    Start Production
// @route   PUT /api/production/start/:id
// @access  Private/Operator
const startProduction = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    
    // Ensure reservations are healthy before starting
    await recalculateInventoryReservations(ownerId);

    const job = await ProductionJob.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });
    if (!job) {
        res.status(404);
        throw new Error('Job not found for your company');
    }
    if (job.status !== 'Planned' && job.status !== 'Pending') {
        res.status(400);
        throw new Error('Job already started or completed');
    }

    job.status = 'Started';
    job.startDate = Date.now();
    await job.save();

    // If a machine is assigned, update its status and operator
    if (job.machineId) {
        await Machine.findByIdAndUpdate(job.machineId, {
            currentJobId: job._id,
            operationalStatus: 'Running',
            currentOperatorId: job.operatorId || null
        });
    }

    await logAudit({
        userId: req.user._id,
        action: 'UPDATE',
        entityType: 'ProductionJob',
        entityId: job._id,
        details: { status: 'Started', startDate: job.startDate },
        ipAddress: req.ip,
    });

    res.json(job);
});

// @desc    Update Production Progress
// @route   PUT /api/production/update/:id
// @access  Private/Operator
const updateProduction = asyncHandler(async (req, res) => {
    const { producedQty } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const job = await ProductionJob.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (!job) {
        res.status(404);
        throw new Error('Job not found for your company');
    }
    if (job.status !== 'Started' && job.status !== 'In Progress') {
        res.status(400);
        throw new Error('Job is not in started status');
    }

    if (producedQty > job.plannedQty) {
        res.status(400);
        throw new Error('Produced quantity cannot exceed planned quantity');
    }

    job.producedQty = producedQty;
    // Move status to In Progress if it was just Started
    if (job.status === 'Started' || job.status === 'Planned') {
        job.status = 'In Progress';
    }
    await job.save();

    await logAudit({
        userId: req.user._id,
        action: 'UPDATE',
        entityType: 'ProductionJob',
        entityId: job._id,
        details: { status: job.status, producedQty: job.producedQty },
        ipAddress: req.ip,
    });

    res.json(job);
});

// @desc    Complete Production
// @route   PUT /api/production/complete/:id
// @access  Private/Operator
const completeProduction = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    // Ensure reservations are healthy before completing/deducting
    await recalculateInventoryReservations(ownerId);

    const job = await ProductionJob.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (!job) {
        res.status(404);
        throw new Error('Job not found for your company');
    }
    if (job.status !== 'Started' && job.status !== 'In Progress') {
        res.status(400);
        throw new Error('Job must be in started status to complete');
    }

    job.status = 'Completed';
    job.actualEndDate = Date.now();
    await job.save();

    // Reset any machine assigned to this job
    await Machine.updateMany(
        { currentJobId: job._id },
        { 
            $set: { 
                currentJobId: null, 
                operationalStatus: 'Idle' 
            } 
        }
    );

    const bomQuery = job.productId 
        ? { productId: job.productId, owner: ownerId, isDeleted: false }
        : job.partId
            ? { parentPartId: job.partId, owner: ownerId, isDeleted: false }
            : { jobWorkOrderId: job.orderId, owner: ownerId, isDeleted: false };
        
    const bomItems = await BOM.find(bomQuery);
    for (let item of bomItems) {
        // Handle Material Deduction
        const material = await Material.findOne({ _id: item.materialId, owner: ownerId, isDeleted: false });
        if (material) {
            const usedQty = Number((item.qtyPerUnit * job.producedQty).toFixed(4));
            const initiallyReserved = Number((item.qtyPerUnit * job.plannedQty).toFixed(4));
            
            material.currentStock = Number((material.currentStock - usedQty).toFixed(4));
            material.reservedStock = Number((material.reservedStock - initiallyReserved).toFixed(4));
            if (material.reservedStock < 0) material.reservedStock = 0;
            if (material.currentStock < 0) material.currentStock = 0;
            await material.save();

            // Record OUT transaction for raw material
            if (usedQty > 0) {
                await InventoryTransaction.create({
                    materialId: material._id,
                    type: 'OUT',
                    quantity: usedQty,
                    referenceType: 'production',
                    referenceId: job._id,
                    owner: ownerId,
                });
            }
        }

        // Handle Part Deduction (Sub-assemblies used as components)
        const Part = mongoose.model('Part');
        const componentPart = await Part.findOne({ _id: item.partId, owner: ownerId, isDeleted: false });
        if (componentPart) {
            const usedQty = Number((item.qtyPerUnit * job.producedQty).toFixed(4));
            const initiallyReserved = Number((item.qtyPerUnit * job.plannedQty).toFixed(4));
            
            componentPart.currentStock = Number((componentPart.currentStock - usedQty).toFixed(4));
            componentPart.reservedStock = Number((componentPart.reservedStock - initiallyReserved).toFixed(4));
            if (componentPart.reservedStock < 0) componentPart.reservedStock = 0;
            if (componentPart.currentStock < 0) componentPart.currentStock = 0;
            await componentPart.save();

            // Record OUT transaction for part
            if (usedQty > 0) {
                await InventoryTransaction.create({
                    partId: componentPart._id,
                    type: 'OUT',
                    quantity: usedQty,
                    referenceType: 'production',
                    referenceId: job._id,
                    owner: ownerId,
                });
            }
        }
    }

    // Update linked status
    if (job.orderModel === 'JobWorkOrder') {
        const jwo = await JobWorkOrder.findOne({ _id: job.orderId, owner: ownerId, isDeleted: false });
        if (jwo) {
            jwo.status = 'Completed';
            await jwo.save();
        }
    } else {
        const order = await Order.findOne({ _id: job.orderId, owner: ownerId, isDeleted: false });
        if (order) {
            order.status = 'Completed';
            await order.save();
        }
    }

    // Update product or part inventory
    if (job.productId) {
        const product = await Product.findOne({ _id: job.productId, owner: ownerId, isDeleted: false });
        if (product) {
            product.currentStock = Number((product.currentStock + job.producedQty).toFixed(4));
            await product.save();

            // Record inventory transaction
            await InventoryTransaction.create({
                productId: product._id,
                type: 'IN',
                quantity: job.producedQty,
                referenceType: 'production',
                referenceId: job._id,
                owner: ownerId,
            });
        }
    } else if (job.partId) {
        const Part = mongoose.model('Part');
        const part = await Part.findOne({ _id: job.partId, owner: ownerId, isDeleted: false });
        if (part) {
            part.currentStock = Number((part.currentStock + job.producedQty).toFixed(4));
            await part.save();

            // Record inventory transaction
            await InventoryTransaction.create({
                partId: part._id,
                type: 'IN',
                quantity: job.producedQty,
                referenceType: 'production',
                referenceId: job._id,
                owner: ownerId,
            });
        }
    }

    await logAudit({
        userId: req.user._id,
        action: 'UPDATE',
        entityType: 'ProductionJob',
        entityId: job._id,
        details: { status: 'Completed', actualEndDate: job.actualEndDate },
        ipAddress: req.ip,
    });

    res.json(job);
});

// @desc    Delete a production job
// @route   DELETE /api/production/:id
// @access  Private/Owner
const deleteProductionJob = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid Job ID');
    }

    const job = await ProductionJob.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    if (job.status === 'Planned' || job.status === 'Started' || job.status === 'In Progress' || job.status === 'Pending') {
        const bomQuery = job.productId 
            ? { productId: job.productId, owner: ownerId, isDeleted: false }
            : job.partId
                ? { parentPartId: job.partId, owner: ownerId, isDeleted: false }
                : { jobWorkOrderId: job.orderId, owner: ownerId, isDeleted: false };

        const bomItems = await BOM.find(bomQuery);
        for (let item of bomItems) {
            const material = await Material.findOne({ _id: item.materialId, owner: ownerId, isDeleted: false });
            const part = await mongoose.model('Part').findOne({ _id: item.partId, owner: ownerId, isDeleted: false });
            
            const amountToRelease = Number((item.qtyPerUnit * job.plannedQty).toFixed(4));
            
            if (material) {
                material.reservedStock = Number((material.reservedStock - amountToRelease).toFixed(4));
                if (material.reservedStock < 0) material.reservedStock = 0;
                await material.save();
            }
            if (part) {
                part.reservedStock = Number((part.reservedStock - amountToRelease).toFixed(4));
                if (part.reservedStock < 0) part.reservedStock = 0;
                await part.save();
            }
        }
    }

    job.isDeleted = true;
    await job.save();

    // Reset any machine assigned to this job
    await Machine.updateMany(
        { currentJobId: job._id },
        { 
            $set: { 
                currentJobId: null, 
                operationalStatus: 'Idle' 
            } 
        }
    );

    await logAudit({
        userId: req.user._id,
        action: 'DELETE',
        entityType: 'ProductionJob',
        entityId: req.params.id,
        details: { deleted: true },
        ipAddress: req.ip,
    });

    res.json({ message: 'Production job removed (soft deleted)' });
});

const recalculateInventoryReservations = async (ownerId) => {
    const allMaterials = await Material.find({ owner: ownerId, isDeleted: false });
    const Part = mongoose.model('Part');
    const allParts = await Part.find({ owner: ownerId, isDeleted: false });
    
    const activeJobs = await ProductionJob.find({ 
        owner: ownerId, 
        status: { $in: ['Planned', 'Started', 'In Progress', 'Pending'] },
        isDeleted: false
    });

    // Reset all reservations first to be clean
    for (const mat of allMaterials) {
        mat.reservedStock = 0;
    }
    for (const prt of allParts) {
        prt.reservedStock = 0;
    }

    for (const job of activeJobs) {
        // Safety check: skip jobs that don't have a valid target association
        if (!job.productId && !job.partId && !job.orderId) continue;

        const bomQuery = job.productId 
            ? { productId: job.productId, owner: ownerId, isDeleted: false }
            : job.partId
                ? { parentPartId: job.partId, owner: ownerId, isDeleted: false }
                : { jobWorkOrderId: (job.orderId?._id || job.orderId), owner: ownerId, isDeleted: false };
            
        const bomItems = await BOM.find(bomQuery);
        for (const item of bomItems) {
            const needed = (item.qtyPerUnit * job.plannedQty);
            if (item.materialId) {
                const mat = allMaterials.find(m => m._id.toString() === item.materialId.toString());
                if (mat) mat.reservedStock += needed;
            }
            if (item.partId) {
                const prt = allParts.find(p => p._id.toString() === item.partId.toString());
                if (prt) prt.reservedStock += needed;
            }
        }
    }

    // Save updated materials
    for (const mat of allMaterials) {
        mat.reservedStock = Number(mat.reservedStock.toFixed(4));
        await mat.save();
    }
    // Save updated parts
    for (const prt of allParts) {
        prt.reservedStock = Number(prt.reservedStock.toFixed(4));
        await prt.save();
    }
};

// @desc    Edit a production job
// @route   PUT /api/production/:id
// @access  Private/Owner or Operator
const editProductionJob = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const { id } = req.params;
    let { orderId, productId, partId, plannedQty, endDate, priority, machineId, operatorId } = req.body;

    const job = await ProductionJob.findOne({ _id: id, owner: ownerId, isDeleted: false });
    if (!job) {
        res.status(404);
        throw new Error('Job not found');
    }

    if (job.status !== 'Planned' && job.status !== 'Pending') {
        res.status(400);
        throw new Error('Cannot edit a job that is already started or completed');
    }

    // Sanitize
    if (productId === "") productId = null;
    if (partId === "") partId = null;
    if (orderId === "") orderId = null;
    if (machineId === "") machineId = null;
    if (operatorId === "") operatorId = null;

    // Determine order model
    let order = null;
    let orderModel = 'Order';
    if (orderId) {
        order = await Order.findOne({ _id: orderId, owner: ownerId, isDeleted: false });
        if (!order) {
            order = await JobWorkOrder.findOne({ _id: orderId, owner: ownerId, isDeleted: false });
            orderModel = 'JobWorkOrder';
        }
        if (!order) {
            res.status(404);
            throw new Error(`The linked record (ID: ${orderId}) was not found.`);
        }
    } else {
        orderModel = null;
    }

    if (!plannedQty || plannedQty <= 0) plannedQty = job.plannedQty;

    if (orderModel === 'Order' && order) {
        if (!productId) productId = order.items?.[0]?.productId;
        if (!productId) { res.status(400); throw new Error('Product required'); }
    } else if (!order) {
        if (!productId && !partId) { res.status(400); throw new Error('Product or Part required'); }
    }

    // Safety check inventory
    let skipBOM = false;
    if (orderModel === 'JobWorkOrder' && order?.isClientMaterial) skipBOM = true;

    if (!skipBOM) {
        const oldBomQuery = job.productId ? { productId: job.productId } : job.partId ? { parentPartId: job.partId } : { jobWorkOrderId: (job.orderId?._id || job.orderId) };
        oldBomQuery.owner = ownerId; oldBomQuery.isDeleted = false;
        const oldBomItems = await BOM.find(oldBomQuery).populate('materialId').populate('partId');
        
        let newBomQuery;
        if (orderModel === 'Order' || !order) {
            newBomQuery = productId ? { productId } : { parentPartId: partId };
        } else if (orderModel === 'JobWorkOrder') {
            newBomQuery = { jobWorkOrderId: orderId };
        }
        newBomQuery.owner = ownerId; newBomQuery.isDeleted = false;
        const newBomItems = await BOM.find(newBomQuery).populate('materialId').populate('partId');
        
        const availabilityMap = new Map();
        for (let item of oldBomItems) {
            const entity = item.materialId || item.partId;
            if (!entity) continue;
            const released = Number((item.qtyPerUnit * job.plannedQty).toFixed(4));
            const availableNow = Number((entity.currentStock - entity.reservedStock).toFixed(4));
            availabilityMap.set(entity._id.toString(), availableNow + released);
        }

        const insufficientMaterials = [];
        for (let item of newBomItems) {
            const entity = item.materialId || item.partId;
            if (!entity) continue;
            const needed = Number((item.qtyPerUnit * plannedQty).toFixed(4));
            let available = availabilityMap.get(entity._id.toString());
            if (available === undefined) {
                available = Number((entity.currentStock - entity.reservedStock).toFixed(4));
            }
            if (available < needed) {
                insufficientMaterials.push(`${entity.name}: Needed ${needed}, Available ${available}`);
            }
        }

        if (insufficientMaterials.length > 0) {
            res.status(400);
            throw new Error('Insufficient inventory for update: ' + JSON.stringify(insufficientMaterials));
        }
    }

    if (job.machineId && String(job.machineId) !== String(machineId)) {
        await Machine.findByIdAndUpdate(job.machineId, { currentJobId: null, operationalStatus: 'Idle' });
    }

    job.orderId = orderId;
    job.orderModel = orderModel;
    job.productId = productId;
    job.partId = partId;
    job.plannedQty = plannedQty;
    job.endDate = endDate;
    job.priority = priority;
    job.machineId = machineId;
    job.operatorId = operatorId;
    
    await job.save();

    if (machineId) {
        await Machine.findByIdAndUpdate(machineId, {
            currentJobId: job._id,
            operationalStatus: 'Running',
            currentOperatorId: operatorId || null
        });
    }

    await recalculateInventoryReservations(ownerId);

    await logAudit({
        userId: req.user._id,
        action: 'UPDATE',
        entityType: 'ProductionJob',
        entityId: job._id,
        details: { updated: true, plannedQty },
        ipAddress: req.ip,
    });

    res.json(job);
});

export { 
    getProductionJobs, 
    createProductionJob, 
    startProduction, 
    updateProduction, 
    completeProduction, 
    deleteProductionJob, 
    editProductionJob,
    recalculateInventoryReservations as recalculateMaterialReservations 
};
