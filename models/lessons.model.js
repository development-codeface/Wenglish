import mongoose from "mongoose";

const multilingualField = {
  en: { type: String, required: true },
  ml: { type: String },
  ta: { type: String },
  te: { type: String },
  hi: { type: String },
  kn: { type: String }
};

const multilingualVideoField = {
  en: { type: String, default: "" },
  ml: { type: String, default: "" },
  ta: { type: String, default: "" },
  te: { type: String, default: "" },
  hi: { type: String, default: "" },
  kn: { type: String, default: "" }
};

const optionSchema = new mongoose.Schema(
  {
    optionId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    en: { type: String, required: true },
    ml: { type: String },
    ta: { type: String },
    te: { type: String },
    hi: { type: String },
    kn: { type: String }
  },
  { _id: false } 
);

const lessonSchema = new mongoose.Schema({
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chapter",
    required: true
  },
  title: multilingualField,
  description: multilingualField,
  videoUrl: multilingualVideoField,
  thumbnail: { type: String },
  question: multilingualField,
  options: [optionSchema],
  correctAnswer: multilingualField,
  order: { type: Number, required: true }
});

export default mongoose.model("Lesson", lessonSchema);
