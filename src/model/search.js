import mongoose from 'mongoose';

const searchSuggestionSchema = new mongoose.Schema({
      userId: {
        type: String, 
        required: true, 
        index: true 
    },
    lastquery: {
        type: [String],
        default: []
    },
    lastSearchedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// searchSuggestionSchema.index({ query: 1 });

const SearchSuggestion = mongoose.model('SearchSuggestion', searchSuggestionSchema);

export default SearchSuggestion;