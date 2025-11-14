import mongoose from "mongoose";

const localizedStringSchema = new mongoose.Schema({
  en: { type: String, },
  ml: { type: String, },
  hi: { type: String, },
  ta: { type: String, },
  te: { type: String, },
  kn: { type: String, },
});

const optionSchema = new mongoose.Schema({
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  en: { type: String, },
  ml: { type: String, },
  hi: { type: String, },
  ta: { type: String, },
  te: { type: String, },
  kn: { type: String, },
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
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Quiz", quizSchema);
