import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mech_saas';

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    
    // Find material
    const materials = await db.collection('materials').find({ name: { $regex: /Aluminium Bearing/i } }).toArray();
    console.log("Materials Found:", JSON.stringify(materials, null, 2));

    mongoose.disconnect();
  })
  .catch(err => console.error(err));
