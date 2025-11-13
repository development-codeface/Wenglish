import mongoose from "mongoose";

const multilingualField = {
  en: { type: String, default: "" },
  hi: { type: String, default: "" },
  ta: { type: String, default: "" },
  te: { type: String, default: "" },
  kn: { type: String, default: "" },
  ml: { type: String, default: "" }
};

const letterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, 
  en: { type: String, default: "" },
  hi: { type: String, default: "" },
  ta: { type: String, default: "" },
  te: { type: String, default: "" },
  kn: { type: String, default: "" },
  ml: { type: String, default: "" }
});

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
    imageUrl: { type: String },
    hint: multilingualField,
    letters: [letterSchema] 
  },
  { timestamps: true }
);

export default mongoose.model("SubTopicAtoZ", subTopicAtoZSchema);
