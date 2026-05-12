import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: String });
schema.pre('save', function(next) {
    console.log('ARGS:', Array.from(arguments).map(a => typeof a));
    next();
});
const M = mongoose.model('TestMongoose2', schema);
const m = new M({ name: 'test' });
await m.save().catch(console.error);
