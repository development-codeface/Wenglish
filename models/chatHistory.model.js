import mongoose from 'mongoose';

const ChatHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatCategory',
    required: true,
  },

  categoryName: { type: String },

  userMessage: {
    type: String,
    required: true,
  },

  correctedInput: {
    type: String,
  },

  // FLAT REPLY FIELDS
  preferred: { type: String },
  native: { type: String }

}, { timestamps: true });

export default mongoose.model('ChatHistory', ChatHistorySchema);
