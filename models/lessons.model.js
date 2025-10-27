import mongoose from "mongoose";

const multilingualField = {
  en: { type: String, required: true },
  ml: { type: String },
  ta: { type: String },
  te: { type: String },
  hi: { type: String },
  kn: { type: String }
};

const optionSchema = new mongoose.Schema({
  en: { type: String, required: true },
  ml: { type: String },
  ta: { type: String },
  te: { type: String },
  hi: { type: String },
  kn: { type: String }
});

const lessonSchema = new mongoose.Schema({
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chapter",
    required: true
  },
  title: multilingualField,
  description: multilingualField,
  videoUrl: { type: String, required: true },
  thumbnail: { type: String },
  question: multilingualField,
  options: [optionSchema],
  correctAnswer: { type: String, required: true },
  order: { type: Number, required: true }
});

export default mongoose.model("Lesson", lessonSchema);
