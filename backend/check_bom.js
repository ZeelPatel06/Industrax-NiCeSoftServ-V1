import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mech_saas'; // replace with actual if needed

mongoose.connect(uri)
  .then(async () => {
    // We need to load models first, but since we are bypassing the app, let's just query raw collections
    const db = mongoose.connection.db;
    
    // Find part
    const parts = await db.collection('parts').find({ name: { $regex: /Aluminium Bearing/i } }).toArray();
    console.log("Parts Found:", JSON.stringify(parts, null, 2));

    for (let part of parts) {
      console.log(`\nBOM for Part: ${part.name} (${part._id})`);
      const boms = await db.collection('boms').find({ parentPartId: part._id }).toArray();
      
      for (let bom of boms) {
        console.log(`BOM Item:`, bom);
        if (bom.materialId) {
          const mat = await db.collection('materials').findOne({ _id: bom.materialId });
          console.log(`  -> Material: ${mat ? mat.name : 'Unknown'}`);
        }
        if (bom.partId) {
          const childPart = await db.collection('parts').findOne({ _id: bom.partId });
          console.log(`  -> Child Part: ${childPart ? childPart.name : 'Unknown'}`);
        }
      }
    }
    
    // Let's also check if it's a product
    const products = await db.collection('products').find({ name: { $regex: /Aluminium Bearing/i } }).toArray();
    console.log("\nProducts Found:", JSON.stringify(products, null, 2));
    for (let prod of products) {
      console.log(`\nBOM for Product: ${prod.name} (${prod._id})`);
      const boms = await db.collection('boms').find({ productId: prod._id }).toArray();
      for (let bom of boms) {
        console.log(`BOM Item:`, bom);
        if (bom.materialId) {
          const mat = await db.collection('materials').findOne({ _id: bom.materialId });
          console.log(`  -> Material: ${mat ? mat.name : 'Unknown'}`);
        }
        if (bom.partId) {
          const childPart = await db.collection('parts').findOne({ _id: bom.partId });
          console.log(`  -> Child Part: ${childPart ? childPart.name : 'Unknown'}`);
        }
      }
    }

    mongoose.disconnect();
  })
  .catch(err => console.error(err));
