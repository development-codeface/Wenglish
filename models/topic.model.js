import mongoose from "mongoose";

const localizedFieldSchema = new mongoose.Schema({
  en: { type: String, required: true }, 
  hi: { type: String, required: true }, 
  ta: { type: String, required: true }, 
  te: { type: String, required: true }, 
  kn: { type: String, required: true }, 
  ml: { type: String, required: true }, 
});

const topicSchema = new mongoose.Schema(
  {
    title: { type: localizedFieldSchema, required: true },
    description: { type: localizedFieldSchema, required: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Topic", topicSchema);
