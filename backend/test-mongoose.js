import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: String });
schema.pre('save', function(...args) {
    console.log('ARGS:', args.map(a => typeof a));
});
const M = mongoose.model('TestMongoose', schema);
const m = new M({ name: 'test' });
await m.save().catch(console.error);
