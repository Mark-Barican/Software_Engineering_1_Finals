import mongoose from 'mongoose';

const SearchHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('SearchHistory', SearchHistorySchema, 'search_history'); 