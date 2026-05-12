import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';
import bcrypt from 'bcryptjs';

// @desc    Get all employees (non-owner users)
// @route   GET /api/employees
// @access  Private
export const getEmployees = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const employees = await User.find({ 
        owner: ownerId, 
        role: { $ne: 'Owner' },
        isDeleted: false 
    }).sort({ createdAt: -1 });
    res.json(employees);
});

// @desc    Create an employee (new sub-user)
// @route   POST /api/employees
// @access  Private/Owner
export const createEmployee = asyncHandler(async (req, res) => {
    const { name, phoneNumber, role, dailyWage, email, password } = req.body;
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;

    if (email) {
        const userExists = await User.findOne({ email, isDeleted: false });
        if (userExists) {
            res.status(400);
            throw new Error('User with this email already exists');
        }
    }

    let hashedPassword = undefined;
    if (password) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
    }

    const employee = await User.create({
        name,
        email: email || null,
        password: hashedPassword,
        mobile: phoneNumber,
        role: role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Worker',
        dailyWage: dailyWage || 0,
        owner: ownerId,
        isVerified: true
    });

    res.status(201).json(employee);
});

// @desc    Update an employee
// @route   PUT /api/employees/:id
// @access  Private/Owner
export const updateEmployee = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const employee = await User.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (employee) {
        employee.name = req.body.name || employee.name;
        employee.mobile = req.body.phoneNumber || employee.mobile;
        employee.role = req.body.role ? req.body.role.charAt(0).toUpperCase() + req.body.role.slice(1) : employee.role;
        employee.dailyWage = req.body.dailyWage !== undefined ? req.body.dailyWage : employee.dailyWage;
        
        if (req.body.email && req.body.email !== employee.email) {
            const emailExists = await User.findOne({ email: req.body.email, isDeleted: false });
            if (emailExists) {
                res.status(400);
                throw new Error('Email already in use');
            }
            employee.email = req.body.email;
        }

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            employee.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedEmployee = await employee.save();
        res.json(updatedEmployee);
    } else {
        res.status(404);
        throw new Error('Employee not found');
    }
});

// @desc    Delete an employee (soft delete)
// @route   DELETE /api/employees/:id
// @access  Private/Owner
export const deleteEmployee = asyncHandler(async (req, res) => {
    const ownerId = req.user.role === 'Owner' ? req.user.email : req.user.owner;
    const employee = await User.findOne({ _id: req.params.id, owner: ownerId, isDeleted: false });

    if (employee) {
        employee.isDeleted = true;
        await employee.save();
        res.json({ message: 'Employee removed' });
    } else {
        res.status(404);
        throw new Error('Employee not found');
    }
});
