import mongoose from "mongoose";

const localizedStringSchema = new mongoose.Schema({
  en: { type: String, required: true },
  ml: { type: String, required: true },
  hi: { type: String, required: true },
  ta: { type: String, required: true },
  te: { type: String, required: true },
  kn: { type: String, required: true },
});

const optionSchema = new mongoose.Schema({
  en: { type: String, required: true },
  ml: { type: String, required: true },
  hi: { type: String, required: true },
  ta: { type: String, required: true },
  te: { type: String, required: true },
  kn: { type: String, required: true },
});

const quizSchema = new mongoose.Schema(
  {
    question: {
      type: localizedStringSchema,
      required: true,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (arr) => arr.length >= 2,
        message: "At least two options are required",
      },
      required: true,
    },
    correctAnswer: {
      type: localizedStringSchema,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Quiz", quizSchema);
