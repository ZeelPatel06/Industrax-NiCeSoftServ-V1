import Material from '../models/Material.js';
import Product from '../models/Product.js';
import BOM from '../models/BOM.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import Order from '../models/Order.js';
import ProductionJob from '../models/ProductionJob.js';
import JobWorkOrder from '../models/JobWorkOrder.js';
import Client from '../models/Client.js';
import Machine from '../models/Machine.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Part from '../models/Part.js';
import Invoice from '../models/Invoice.js';
import { recalculateMaterialReservations } from './productionController.js';
import mongoose from 'mongoose';
import { jsonToCsv, parseCsv } from '../utils/csvHandler.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Export all company data
// @route   GET /api/data/export
// @access  Private/Owner
const exportAllData = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    const [materials, products, parts, boms, inventory, orders, production, jobWorkOrders, clients, machines, employees, attendance, invoices] = await Promise.all([
        Material.find({ owner: ownerId }),
        Product.find({ owner: ownerId }),
        Part.find({ owner: ownerId }),
        BOM.find({ owner: ownerId }).populate('productId', 'productCode').populate('materialId', 'materialCode'),
        InventoryTransaction.find({ owner: ownerId }).populate('materialId', 'materialCode'),
        Order.find({ owner: ownerId }).populate('items.productId', 'productCode'),
        ProductionJob.find({ owner: ownerId }).populate('productId', 'productCode').populate('orderId', '_id'),
        JobWorkOrder.find({ owner: ownerId, isDeleted: false }).populate('clientId', 'name'),
        Client.find({ owner: ownerId, isDeleted: false }),
        Machine.find({ owner: ownerId, isDeleted: false }),
        User.find({ owner: ownerId, role: { $ne: 'Owner' }, isDeleted: false }),
        Attendance.find({ owner: ownerId }).populate('userId', 'email'),
        Invoice.find({ owner: ownerId, isDeleted: false }).populate('clientId', 'name')
    ]);

    const combinedData = [];

    // Add Materials (with new shape/dimension fields)
    materials.forEach(m => {
        combinedData.push({
            Type: 'MATERIAL',
            Code: m.materialCode,
            Name: m.name,
            Unit: m.unit,
            MinLevel: m.minimumLevel,
            Value1: m.currentStock,
            Value2: m.shape || 'Generic',
            Value3: m.dimensions ? [
                m.dimensions.length || '',
                m.dimensions.width || '',
                m.dimensions.thickness || '',
                m.dimensions.diameter || '',
                m.dimensions.wallThickness || '',
                m.dimensions.side || '',
                m.dimensions.dimensionUnit || 'mm'
            ].join('|') : '',
            Date: m.createdAt
        });
    });

    // Add Products
    products.forEach(p => {
        combinedData.push({
            Type: 'PRODUCT',
            Code: p.productCode,
            Name: p.name,
            Unit: p.unit,
            MinLevel: p.category, // using MinLevel for category
            Value1: p.standardCost,
            Value2: p.sellingPrice,
            Value3: p.isActive ? 'Active' : 'Inactive',
            Date: p.createdAt
        });
    });

    // Add Parts
    parts.forEach(p => {
        combinedData.push({
            Type: 'PART',
            Code: p.partCode,
            Name: p.name,
            Unit: p.unit,
            MinLevel: p.category,
            Value1: p.standardCost,
            Value2: p.sellingPrice,
            Value3: p.isActive ? 'Active' : 'Inactive',
            Date: p.createdAt
        });
    });
    
    // Add BOM
    boms.forEach(b => {
        combinedData.push({
            Type: 'BOM',
            Code: b.productId?.productCode || 'Unknown',
            Name: b.materialId?.materialCode || 'Unknown',
            Unit: b.unit || '',
            MinLevel: '',
            Value1: b.qtyPerUnit,
            Value2: '',
            Value3: '',
            Date: b.createdAt
        });
    });

    // Add Inventory Transactions
    inventory.forEach(i => {
        combinedData.push({
            Type: 'INVENTORY_TX',
            Code: i.materialId?.materialCode || 'Unknown',
            Name: i.type,
            Unit: i.referenceType,
            MinLevel: i.referenceId || '',
            Value1: i.quantity,
            Value2: '',
            Value3: '',
            Date: i.date
        });
    });

    // Add Orders
    orders.forEach(o => {
        combinedData.push({
            Type: 'ORDER',
            Code: o._id.toString(),
            Name: o.customerName,
            Unit: o.status,
            MinLevel: '',
            Value1: '',
            Value2: '',
            Value3: '',
            Date: o.deliveryDate
        });

        o.items.forEach(item => {
            combinedData.push({
                Type: 'ORDER_ITEM',
                Code: o._id.toString(),
                Name: item.productId?.productCode || 'Unknown',
                Unit: '',
                MinLevel: '',
                Value1: item.quantity,
                Value2: item.price,
                Value3: '',
                Date: ''
            });
        });
    });

    // Add Production Jobs
    production.forEach(j => {
        combinedData.push({
            Type: 'PRODUCTION_JOB',
            Code: j.jobId,
            Name: j.orderId?._id.toString() || 'N/A',
            Unit: j.productId?.productCode || 'Unknown',
            MinLevel: j.status,
            Value1: j.plannedQty,
            Value2: j.producedQty,
            Value3: '',
            Date: j.endDate
        });
    });

    // Add Job Work Orders
    jobWorkOrders.forEach(jw => {
        combinedData.push({
            Type: 'JOB_WORK_ORDER',
            Code: jw._id.toString(),
            Name: jw.clientId?.name || 'Unknown',
            Unit: jw.unit,
            MinLevel: jw.jobType,
            Value1: jw.totalAmount,
            Value2: jw.materialQuantity || '',
            Value3: [
                jw.orderTitle || '',
                jw.materialName || '',
                jw.isClientMaterial ? '1' : '0',
                jw.status
            ].join('|'),
            Date: jw.deadline || ''
        });
    });

    // Add Clients
    clients.forEach(c => {
        combinedData.push({
            Type: 'CLIENT',
            Code: c._id.toString(),
            Name: c.name,
            Unit: c.email || '',
            MinLevel: c.phone || '',
            Value1: '',
            Value2: '',
            Value3: c.address || '',
            Date: c.createdAt
        });
    });

    // Add Machines
    machines.forEach(m => {
        combinedData.push({
            Type: 'MACHINE',
            Code: m._id.toString(),
            Name: m.name,
            Unit: m.type || '',
            MinLevel: m.status,
            Value1: m.serialNumber || '',
            Value2: m.modelNumber || '',
            Value3: m.operationalStatus,
            Date: m.createdAt
        });
    });

    // Add Employees
    employees.forEach(e => {
        combinedData.push({
            Type: 'EMPLOYEE',
            Code: e._id.toString(),
            Name: e.name,
            Unit: e.email || '',
            MinLevel: e.role,
            Value1: e.dailyWage,
            Value2: e.mobile || '',
            Value3: '',
            Date: e.createdAt
        });
    });

    // Add Attendance
    attendance.forEach(a => {
        combinedData.push({
            Type: 'ATTENDANCE',
            Code: a.userId?.email || 'Unknown',
            Name: a.status,
            Unit: a.checkInTime || '',
            MinLevel: '',
            Value1: '',
            Value2: '',
            Value3: '',
            Date: a.date
        });
    });

    // Add Invoices
    invoices.forEach(inv => {
        combinedData.push({
            Type: 'INVOICE',
            Code: inv.invoiceNumber,
            Name: inv.clientId?.name || 'Unknown',
            Unit: inv.status,
            MinLevel: inv._id.toString(),
            Value1: inv.totalAmount,
            Value2: inv.taxAmount,
            Value3: inv.type || 'Invoice',
            Date: inv.date
        });
    });

    const csv = jsonToCsv(combinedData);
    res.header('Content-Type', 'text/csv');
    res.attachment(`mechsaas_backup_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
});

// @desc    Import all company data
// @route   POST /api/data/import
// @access  Private/Owner or Store Manager
const importAllData = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
    }

    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const rows = await parseCsv(req.file.buffer);

    if (!rows.length) {
        res.status(400);
        throw new Error('CSV file is empty or malformed');
    }

    // Group rows by type for efficient processing
    const grouped = rows.reduce((acc, row) => {
        const type = (row.Type || '').trim().toUpperCase();
        if (!acc[type]) acc[type] = [];
        acc[type].push(row);
        return acc;
    }, {});

    // 1. Bulk Upsert Materials (bulkWrite = single DB round-trip instead of N)
    if (grouped['MATERIAL']?.length) {
        const materialOps = grouped['MATERIAL'].map(row => {
            const dimParts = row.Value3 ? row.Value3.split('|') : [];
            const dimensions = dimParts.length >= 7 ? {
                length: Number(dimParts[0]) || undefined,
                width: Number(dimParts[1]) || undefined,
                thickness: Number(dimParts[2]) || undefined,
                diameter: Number(dimParts[3]) || undefined,
                wallThickness: Number(dimParts[4]) || undefined,
                side: Number(dimParts[5]) || undefined,
                dimensionUnit: dimParts[6] || 'mm'
            } : {};

            return {
                updateOne: {
                    filter: { materialCode: row.Code?.trim(), owner: ownerId },
                    update: {
                        $set: {
                            name: row.Name?.trim(),
                            unit: row.Unit?.trim(),
                            minimumLevel: Number(Number(row.MinLevel).toFixed(4)) || 0,
                            currentStock: Number(Number(row.Value1).toFixed(4)) || 0,
                            shape: row.Value2?.trim() || 'Generic',
                            ...(Object.keys(dimensions).length ? { dimensions } : {})
                        },
                        $setOnInsert: { owner: ownerId }
                    },
                    upsert: true
                }
            };
        });
        await Material.bulkWrite(materialOps, { ordered: false });
    }

    // 2. Bulk Upsert Products
    if (grouped['PRODUCT']?.length) {
        const productOps = grouped['PRODUCT'].map(row => ({
            updateOne: {
                filter: { productCode: row.Code?.trim(), owner: ownerId },
                update: {
                    $set: {
                        name: row.Name?.trim(),
                        category: row.MinLevel?.trim(),
                        unit: row.Unit?.trim(),
                        standardCost: Number(Number(row.Value1).toFixed(4)) || 0,
                        sellingPrice: Number(Number(row.Value2).toFixed(4)) || 0,
                        isActive: row.Value3?.trim() === 'Active',
                    },
                    $setOnInsert: { owner: ownerId }
                },
                upsert: true
            }
        }));
        await Product.bulkWrite(productOps, { ordered: false });
    }

    // 2.5. Upsert BOM
    if (grouped['BOM']) {
        for (const row of grouped['BOM']) {
            const product = await Product.findOne({ productCode: row.Code?.trim(), owner: ownerId });
            const material = await Material.findOne({ materialCode: row.Name?.trim(), owner: ownerId });
            if (product && material) {
                await BOM.findOneAndUpdate(
                    { productId: product._id, materialId: material._id, owner: ownerId },
                    {
                        $set: {
                            qtyPerUnit: Number(row.Value1) || 0,
                            unit: row.Unit?.trim() || material.unit,
                        },
                        $setOnInsert: { owner: ownerId }
                    },
                    { upsert: true, new: true }
                );
            }
        }
    }

    // 3. Upsert Orders & Items
    if (grouped['ORDER']) {
        for (const row of grouped['ORDER']) {
            const itemsForOrder = grouped['ORDER_ITEM']?.filter(i => i.Code === row.Code) || [];
            const resolvedItems = [];

            for (const itemRow of itemsForOrder) {
                const product = await Product.findOne({ productCode: itemRow.Name?.trim(), owner: ownerId });
                if (product) {
                    resolvedItems.push({
                        productId: product._id,
                        quantity: Number(Number(itemRow.Value1).toFixed(4)) || 0,
                        price: Number(Number(itemRow.Value2).toFixed(4)) || 0
                    });
                }
            }

            const orderData = {
                customerName: row.Name?.trim(),
                status: row.Unit?.trim(),
                deliveryDate: row.Date ? new Date(row.Date) : new Date(),
                items: resolvedItems
            };

            if (mongoose.Types.ObjectId.isValid(row.Code)) {
                // Find the existing order first — upsert by _id is unsafe and causes duplicate key errors
                const existingOrder = await Order.findOne({ _id: row.Code, owner: ownerId });
                if (existingOrder) {
                    // Update in place
                    await Order.findByIdAndUpdate(row.Code, { $set: orderData });
                } else {
                    // Order doesn't belong to this owner or doesn't exist: create a fresh one
                    await Order.create({ ...orderData, owner: ownerId });
                }
            } else {
                await Order.create({ ...orderData, owner: ownerId });
            }
        }
    }

    // 4. Inventory Transactions — only insert if not already existing 
    // (matching by materialCode + type + quantity + date to avoid full re-import duplicates)
    if (grouped['INVENTORY_TX']) {
        for (const row of grouped['INVENTORY_TX']) {
            const material = await Material.findOne({ materialCode: row.Code?.trim(), owner: ownerId });
            if (material) {
                const txDate = row.Date ? new Date(row.Date) : new Date();
                const exists = await InventoryTransaction.findOne({
                    materialId: material._id,
                    type: row.Name?.trim(),
                    quantity: Number(Number(row.Value1).toFixed(4)) || 0,
                    date: txDate,
                    owner: ownerId
                });

                if (!exists) {
                    await InventoryTransaction.create({
                        materialId: material._id,
                        type: row.Name?.trim(),
                        referenceType: row.Unit?.trim(),
                        referenceId: row.MinLevel?.trim() || undefined,
                        quantity: Number(Number(row.Value1).toFixed(4)) || 0,
                        date: txDate,
                        owner: ownerId
                    });
                }
            }
        }
    }

    // 5. Upsert Production Jobs
    if (grouped['PRODUCTION_JOB']) {
        for (const row of grouped['PRODUCTION_JOB']) {
            const product = await Product.findOne({ productCode: row.Unit?.trim(), owner: ownerId });
            const order = mongoose.Types.ObjectId.isValid(row.Name?.trim()) ? await Order.findById(row.Name.trim()) : null;

            if (product) {
                await ProductionJob.findOneAndUpdate(
                    { jobId: row.Code?.trim(), owner: ownerId },
                    {
                        $set: {
                            orderId: order ? order._id : null,
                            productId: product._id,
                            plannedQty: Number(Number(row.Value1).toFixed(4)) || 0,
                            producedQty: Number(Number(row.Value2).toFixed(4)) || 0,
                            status: row.MinLevel?.trim(),
                            endDate: row.Date ? new Date(row.Date) : new Date()
                        },
                        $setOnInsert: { owner: ownerId }
                    },
                    { upsert: true, new: true }
                );
            }
        }

    }

    // 6. Upsert Job Work Orders
    if (grouped['JOB_WORK_ORDER']) {
        for (const row of grouped['JOB_WORK_ORDER']) {
            // Find or create the client by name
            let client = await Client.findOne({ name: row.Name?.trim(), owner: ownerId });
            if (!client) {
                client = await Client.create({ name: row.Name?.trim(), owner: ownerId });
            }

            // Parse the pipe-separated Value3: orderTitle|materialName|isClientMaterial|status
            const v3Parts = row.Value3 ? row.Value3.split('|') : [];

            const jobData = {
                clientId: client._id,
                unit: row.Unit?.trim() || 'pcs',
                jobType: row.MinLevel?.trim() || 'General',
                totalAmount: Number(row.Value1) || 0,
                materialQuantity: Number(row.Value2) || 0,
                orderTitle: v3Parts[0] || '',
                materialName: v3Parts[1] || '',
                isClientMaterial: v3Parts[2] === '1',
                status: v3Parts[3] || 'Pending',
                deadline: row.Date ? new Date(row.Date) : undefined
            };

            // Upsert by original _id if valid, otherwise create
            if (mongoose.Types.ObjectId.isValid(row.Code)) {
                const existing = await JobWorkOrder.findOne({ _id: row.Code, owner: ownerId });
                if (existing) {
                    await JobWorkOrder.findByIdAndUpdate(row.Code, { $set: jobData });
                } else {
                    await JobWorkOrder.create({ ...jobData, owner: ownerId });
                }
            } else {
                await JobWorkOrder.create({ ...jobData, owner: ownerId });
            }
        }
    }

    // 7. Bulk Upsert Parts
    if (grouped['PART']?.length) {
        const partOps = grouped['PART'].map(row => ({
            updateOne: {
                filter: { partCode: row.Code?.trim(), owner: ownerId },
                update: {
                    $set: {
                        name: row.Name?.trim(),
                        category: row.MinLevel?.trim(),
                        unit: row.Unit?.trim(),
                        standardCost: Number(row.Value1) || 0,
                        sellingPrice: Number(row.Value2) || 0,
                        isActive: row.Value3?.trim() === 'Active',
                    },
                    $setOnInsert: { owner: ownerId }
                },
                upsert: true
            }
        }));
        await Part.bulkWrite(partOps, { ordered: false });
    }

    // 8. Upsert Clients
    if (grouped['CLIENT']) {
        for (const row of grouped['CLIENT']) {
            const clientData = {
                name: row.Name?.trim(),
                email: row.Unit?.trim(),
                phone: row.MinLevel?.trim(),
                address: row.Value3?.trim(),
            };

            if (mongoose.Types.ObjectId.isValid(row.Code)) {
                await Client.findOneAndUpdate(
                    { _id: row.Code, owner: ownerId },
                    { $set: clientData, $setOnInsert: { owner: ownerId } },
                    { upsert: true }
                );
            } else {
                await Client.create({ ...clientData, owner: ownerId });
            }
        }
    }

    // 9. Upsert Machines
    if (grouped['MACHINE']) {
        for (const row of grouped['MACHINE']) {
            const machineData = {
                name: row.Name?.trim(),
                type: row.Unit?.trim(),
                status: row.MinLevel?.trim(),
                serialNumber: row.Value1?.trim(),
                modelNumber: row.Value2?.trim(),
                operationalStatus: row.Value3?.trim(),
            };

            if (mongoose.Types.ObjectId.isValid(row.Code)) {
                await Machine.findOneAndUpdate(
                    { _id: row.Code, owner: ownerId },
                    { $set: machineData, $setOnInsert: { owner: ownerId } },
                    { upsert: true }
                );
            } else {
                await Machine.create({ ...machineData, owner: ownerId });
            }
        }
    }

    // 10. Upsert Employees (Users with non-owner roles)
    if (grouped['EMPLOYEE']) {
        for (const row of grouped['EMPLOYEE']) {
            const employeeData = {
                name: row.Name?.trim(),
                role: row.MinLevel?.trim(),
                dailyWage: Number(row.Value1) || 0,
                mobile: row.Value2?.trim(),
                email: row.Unit?.trim() || null,
                owner: ownerId,
                isVerified: true
            };

            if (mongoose.Types.ObjectId.isValid(row.Code)) {
                await User.findOneAndUpdate(
                    { _id: row.Code, owner: ownerId },
                    { $set: employeeData },
                    { upsert: true }
                );
            } else {
                await User.create(employeeData);
            }
        }
    }

    // 11. Attendance - insert only if not exists
    if (grouped['ATTENDANCE']) {
        for (const row of grouped['ATTENDANCE']) {
            const user = await User.findOne({ email: row.Code?.trim(), owner: ownerId });
            if (user) {
                const date = row.Date ? new Date(row.Date) : new Date();
                date.setUTCHours(0,0,0,0);

                await Attendance.findOneAndUpdate(
                    { userId: user._id, date, owner: ownerId },
                    { 
                        $set: { 
                            status: row.Name?.trim() || 'Present', 
                            checkInTime: row.Unit?.trim() 
                        },
                        $setOnInsert: { owner: ownerId }
                    },
                    { upsert: true }
                );
            }
        }
    }

    // 12. Invoices (Simplified import - usually system generated but good for backup)
    if (grouped['INVOICE']) {
        for (const row of grouped['INVOICE']) {
            const client = await Client.findOne({ name: row.Name?.trim(), owner: ownerId });
            if (client) {
                await Invoice.findOneAndUpdate(
                    { invoiceNumber: row.Code?.trim(), owner: ownerId },
                    {
                        $set: {
                            clientId: client._id,
                            status: row.Unit?.trim(),
                            totalAmount: Number(row.Value1) || 0,
                            taxAmount: Number(row.Value2) || 0,
                            type: row.Value3?.trim(),
                            date: row.Date ? new Date(row.Date) : new Date()
                        },
                        $setOnInsert: { owner: ownerId }
                    },
                    { upsert: true }
                );
            }
        }
    }

    // ALWAYS RECALCULATE RESERVED STOCK
    await recalculateMaterialReservations(ownerId);

    res.json({ message: 'Data imported successfully', summary: {
        materials: grouped['MATERIAL']?.length || 0,
        products: grouped['PRODUCT']?.length || 0,
        orders: grouped['ORDER']?.length || 0,
        inventoryTx: grouped['INVENTORY_TX']?.length || 0,
        productionJobs: grouped['PRODUCTION_JOB']?.length || 0,
        jobWorkOrders: grouped['JOB_WORK_ORDER']?.length || 0,
        parts: grouped['PART']?.length || 0,
        clients: grouped['CLIENT']?.length || 0,
        machines: grouped['MACHINE']?.length || 0,
        employees: grouped['EMPLOYEE']?.length || 0,
        attendance: grouped['ATTENDANCE']?.length || 0,
        invoices: grouped['INVOICE']?.length || 0,
    }});
});

export { exportAllData, importAllData };
