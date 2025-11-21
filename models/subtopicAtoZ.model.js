import mongoose from "mongoose";

const multilingualField = {
  en: { type: String, default: "" },
  hi: { type: String, default: "" },
  ta: { type: String, default: "" },
  te: { type: String, default: "" },
  kn: { type: String, default: "" },
  ml: { type: String, default: "" }
};

const subTopicAtoZSchema = new mongoose.Schema(
  {
    topicId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Topic", 
      required: true 
    },

    question: multilingualField,
    fullWord: multilingualField,
    hint: multilingualField,
    imageUrl: { type: String },

   correctAnswers: multilingualField,

  },
  { timestamps: true }
);

export default mongoose.model("SubTopicAtoZ", subTopicAtoZSchema);
