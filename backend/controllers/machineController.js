import Machine from '../models/Machine.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Create a machine
// @route   POST /api/machines
// @access  Private/Owner
const createMachine = asyncHandler(async (req, res) => {
    if (req.user.role !== 'Owner') {
        res.status(403);
        throw new Error('Only owners can create machines');
    }

    const { name, type, serialNumber, modelNumber, operationalStatus, currentJobId } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    const machineExists = await Machine.findOne({ name, owner: ownerId, isDeleted: false });

    if (machineExists) {
        res.status(400);
        throw new Error('Machine with this name already exists');
    }

    const machine = await Machine.create({
        name,
        type,
        serialNumber,
        modelNumber,
        operationalStatus: operationalStatus || (currentJobId ? 'Running' : 'Idle'),
        currentJobId: currentJobId || null,
        owner: ownerId,
    });

    res.status(201).json(machine);
});

// @desc    Get all active machines
// @route   GET /api/machines
// @access  Private
const getMachines = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    
    // Default to only active machines
    const machines = await Machine.find({ 
        owner: ownerId, 
        isDeleted: false,
        status: 'active' 
    }).sort({ createdAt: -1 })
    .populate('currentJobId', 'jobId status producedQty plannedQty')
    .populate('currentOperatorId', 'name role');

    res.json(machines);
});

// @desc    Update a machine
// @route   PUT /api/machines/:id
// @access  Private
const updateMachine = asyncHandler(async (req, res) => {
    const { name, type, status, serialNumber, modelNumber, operationalStatus, currentJobId } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    const machine = await Machine.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (machine) {
        // Only Owners can change core identification and status fields
        if (req.user.role === 'Owner') {
            machine.name = name || machine.name;
            machine.type = type !== undefined ? type : machine.type;
            machine.status = status || machine.status;
            machine.serialNumber = serialNumber !== undefined ? serialNumber : machine.serialNumber;
            machine.modelNumber = modelNumber !== undefined ? modelNumber : machine.modelNumber;
        }

        // Managers/Operators/Engineers can only update currentJobId and operationalStatus
        if (currentJobId !== undefined) {
            const oldJobId = machine.currentJobId?.toString();
            machine.currentJobId = currentJobId || null;
            
            // Auto-update status if job is changed and status isn't explicitly changed
            if (!operationalStatus) {
                if (currentJobId && currentJobId !== oldJobId) {
                    machine.operationalStatus = 'Running';
                } else if (!currentJobId && oldJobId) {
                    machine.operationalStatus = 'Idle';
                }
            }
        }
        
        machine.operationalStatus = operationalStatus || machine.operationalStatus;

        const updatedMachine = await machine.save();
        res.json(updatedMachine);
    } else {
        res.status(404);
        throw new Error('Machine not found');
    }
});

// @desc    Deactivate a machine (soft delete)
// @route   DELETE /api/machines/:id
// @access  Private/Owner
const deactivateMachine = asyncHandler(async (req, res) => {
    if (req.user.role !== 'Owner') {
        res.status(403);
        throw new Error('Only owners can deactivate machines');
    }

    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    const machine = await Machine.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (machine) {
        machine.status = 'inactive';
        await machine.save();
        res.json({ message: 'Machine deactivated' });
    } else {
        res.status(404);
        throw new Error('Machine not found');
    }
});

export {
    createMachine,
    getMachines,
    updateMachine,
    deactivateMachine,
};
