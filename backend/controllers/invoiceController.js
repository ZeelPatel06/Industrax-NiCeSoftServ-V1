import Invoice from '../models/Invoice.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getInvoices = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const invoices = (await Invoice.find({ owner: ownerId, isDeleted: false })
        .populate('orderId')
        .populate('clientId')
        .lean()).map(inv => ({
            ...inv,
            items: inv.items || [],
            materials: inv.materials || [],
            extraCosts: inv.extraCosts || []
        }));
    res.json(invoices);
});

export const createInvoice = asyncHandler(async (req, res) => {
    const { 
        orderId, clientId, customerName, invoiceNumber, totalAmount, subTotal, orderModel, 
        gstType, cgst, sgst, igst, gstRate, items, materials, extraCosts, notes 
    } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    
    // Ensure invoice number uniqueness
    const exists = await Invoice.findOne({ invoiceNumber, owner: ownerId });
    if (exists) {
        res.status(400);
        throw new Error('Invoice Number already exists');
    }

    const invoice = new Invoice({
        orderId,
        clientId,
        customerName,
        orderModel: orderModel || 'JobWorkOrder',
        invoiceNumber,
        subTotal,
        totalAmount,
        gstType: gstType || 'none',
        cgst: cgst || 0,
        sgst: sgst || 0,
        igst: igst || 0,
        gstRate: gstRate || 18,
        items,
        materials,
        extraCosts,
        notes,
        owner: ownerId,
    });
    
    const createdInvoice = await invoice.save();
    res.status(201).json(createdInvoice);
});

export const getInvoiceById = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const invoice = await Invoice.findById(req.params.id)
        .populate('orderId')
        .populate('clientId');

    if (invoice && invoice.owner === ownerId) {
        res.json(invoice);
    } else {
        res.status(404);
        throw new Error('Invoice not found');
    }
});

export const updatePayment = asyncHandler(async (req, res) => {
    const { paidAmount } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const invoice = await Invoice.findById(req.params.id);

    if (invoice && invoice.owner === ownerId) {
        invoice.paidAmount = paidAmount;
        if (invoice.paidAmount >= invoice.totalAmount) {
            invoice.paymentStatus = 'Paid';
        } else if (invoice.paidAmount > 0) {
            invoice.paymentStatus = 'Partially Paid';
        } else {
            invoice.paymentStatus = 'Unpaid';
        }
        await invoice.save();
        res.json(invoice);
    } else {
        res.status(404);
        throw new Error('Invoice not found');
    }
});

export const deleteInvoice = asyncHandler(async (req, res) => {
    if (req.user.role !== 'Owner') {
        res.status(403);
        throw new Error('Not authorized to delete invoices');
    }
    const ownerId = req.user.email; // Owner is always email in user reference
    const invoice = await Invoice.findById(req.params.id);

    if (invoice && invoice.owner === ownerId) {
        invoice.isDeleted = true;
        await invoice.save();
        res.json({ message: 'Invoice removed' });
    } else {
        res.status(404);
        throw new Error('Invoice not found');
    }
});
