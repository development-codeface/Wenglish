import mongoose from "mongoose";

const multilingualField = {
  en: { type: String, required: true },
  hi: { type: String, default: "" },
  ta: { type: String, default: "" },
  te: { type: String, default: "" },
  kn: { type: String, default: "" },
  ml: { type: String, default: "" },
};

const ChatCategorySchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    title: multilingualField,
    description: multilingualField,
  },
  { timestamps: true }
);

export default mongoose.model("ChatCategory", ChatCategorySchema);
