import mongoose from "mongoose";

const multilingualField = {
  en: { type: String, required: true },
  ml: { type: String },
  ta: { type: String },
  te: { type: String },
  hi: { type: String },
  kn: { type: String }
};

const chapterSchema = new mongoose.Schema({
  title: multilingualField,
  intro: multilingualField,
  order: { type: Number, required: true }
});

export default mongoose.model("Chapter", chapterSchema);
