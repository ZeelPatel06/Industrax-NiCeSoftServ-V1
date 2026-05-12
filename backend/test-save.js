import mongoose from 'mongoose';
import JobWorkOrder from './models/JobWorkOrder.js';
import dotenv from 'dotenv';
dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
console.log('Connected');
process.exit(0);
