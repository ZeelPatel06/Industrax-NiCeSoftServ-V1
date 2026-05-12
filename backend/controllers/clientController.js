import Client from '../models/Client.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getClients = asyncHandler(async (req, res) => {
    const clients = await Client.find({ owner: req.user.owner || req.user._id, isDeleted: false });
    res.json(clients);
});

export const createClient = asyncHandler(async (req, res) => {
    const { name, phone, email, address } = req.body;
    const client = new Client({
        name,
        phone,
        email,
        address,
        owner: req.user.owner || req.user._id,
    });
    const createdClient = await client.save();
    res.status(201).json(createdClient);
});

export const updateClient = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id);
    if (client && (client.owner === req.user.owner || client.owner === req.user._id.toString())) {
        client.name = req.body.name || client.name;
        client.phone = req.body.phone || client.phone;
        client.email = req.body.email || client.email;
        client.address = req.body.address || client.address;
        const updatedClient = await client.save();
        res.json(updatedClient);
    } else {
        res.status(404);
        throw new Error('Client not found');
    }
});

export const deleteClient = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id);
    if (client && (client.owner === req.user.owner || client.owner === req.user._id.toString())) {
        client.isDeleted = true;
        await client.save();
        res.json({ message: 'Client removed' });
    } else {
        res.status(404);
        throw new Error('Client not found');
    }
});
