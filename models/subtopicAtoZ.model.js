import mongoose from "mongoose";

const multilingualField = {
  en: { type: String, required: true }, 
  hi: { type: String }, 
  ta: { type: String }, 
  te: { type: String },
  kn: { type: String },
  ml: { type: String }  
};

const subTopicAtoZSchema = new mongoose.Schema(
  {
    topicId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Topic", 
      required: true 
    },
    question: multilingualField,       
    correctAnswers: multilingualField, 
    fullWord: multilingualField,       
    imageUrl: { type: String }         
  },
  { timestamps: true }
);

export default mongoose.model("SubTopicAtoZ", subTopicAtoZSchema);
