import mongoose from "mongoose";

const { Schema, model } = mongoose;

const reviewSchema = new Schema({
    hospitalId: {
        type: String,
        required: true,
        ref: 'Hospital'
    },
    reviewerName: {
        type: String,
        trim: true,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 500
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

reviewSchema.post('save', async function() {
    const hospitalId = this.hospitalId;

    const result = await mongoose.model('Review').aggregate([
        { $match: { hospitalId: hospitalId } },
        {
            $group: {
                _id: '$hospitalId',
                averageRating: { $avg: '$rating' }
            }
        }
    ]);

    let newAverageRating = 0;
    if (result.length > 0) {
        newAverageRating = parseFloat(result[0].averageRating.toFixed(1));
    }

    await mongoose.model('Hospital').updateOne(
        { hospitalId: hospitalId },
        { $set: { averageRating: newAverageRating } }
    );
});


const Review = model('Review', reviewSchema);
export default Review;