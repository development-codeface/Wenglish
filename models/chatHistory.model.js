import mongoose from 'mongoose';

const ChatHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  
    required: true,
  },
  category: {
    type: String,  
    required: true,
  },
  userMessage: {
    type: String,
    required: true,
  },
  botReply: {
    type: String,
    required: true,
  },
  correctedInput: {
    type: String,
  },
}, { timestamps: true });

export default mongoose.model('ChatHistory', ChatHistorySchema);
