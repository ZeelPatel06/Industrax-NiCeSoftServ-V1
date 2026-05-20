import mongoose from 'mongoose';

// Enforce 4 decimal places globally on all Number schema paths to prevent floating point issues and long numbers
mongoose.plugin((schema) => {
    schema.eachPath((pathname, schemaType) => {
        if (schemaType.instance === 'Number') {
            schemaType.set((val) => {
                if (val === null || val === undefined) return val;
                const num = Number(val);
                if (isNaN(num)) return val;
                return Math.round((num + Number.EPSILON) * 10000) / 10000;
            });
        }
    });
});

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
