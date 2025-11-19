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
  categoryName:{
    type: String,
  },
  userMessage: {
    type: String,
    required: true,
  },
 nativeLanguage: { type: String }, 
languagePreference: { type: String},
  correctedInput: {
    type: String,
  },
}, { timestamps: true });

export default mongoose.model('ChatHistory', ChatHistorySchema);
