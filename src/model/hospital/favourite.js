import mongoose from 'mongoose';

const favouriteSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true },
  favouriteHospitals: [ 
        {
            hospitalId: {
                type: String, 
                required: true
            },
            isFavourite: { 
                type: Boolean,
                default: false 
            },
             _id: false
           }
    ],

  createdAt: { type: Date, default: Date.now }
});

favouriteSchema.index({ userId: 1, hospitalId: 1 }, { unique: true });

const Favourite = mongoose.model('Favourite', favouriteSchema);
export default Favourite;
