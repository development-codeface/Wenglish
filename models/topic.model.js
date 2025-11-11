import mongoose from "mongoose";

const localizedFieldSchema = new mongoose.Schema({
  en: { type: String, required: true },
  hi: { type: String },
  ta: { type: String },
  te: { type: String },
  kn: { type: String },
  ml: { type: String },
});

const topicSchema = new mongoose.Schema(
  {
    title: { type: localizedFieldSchema, required: true },
    description: { type: localizedFieldSchema, required: true },
    imageUrl: { type: String, required: true },
    redirect:{ type: String, enum: ["mcq", "topic"], required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Topic", topicSchema);
