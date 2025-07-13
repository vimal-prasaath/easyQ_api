import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const counterSchema = new Schema({
    _id: { 
        type: String,
        required: true
    },
    sequence_value: { 
        type: Number,
        default: 0
    }
});

const Counter = model('Counter', counterSchema);
export default Counter;