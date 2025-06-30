import mongoose from 'mongoose';

const favouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId: { type: String, ref: 'Hospital', required: true },
    isfavourite:{
         type: Boolean,
         default: false
    },
  createdAt: { type: Date, default: Date.now }
});

favouriteSchema.index({ userId: 1, hospitalId: 1 }, { unique: true });

const Favourite = mongoose.model('Favourite', favouriteSchema);
export default Favourite;
