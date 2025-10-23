import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 2,
        message: "At least two options are required",
      },
      required: true,
    },
    correctAnswers: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.every((ans) => this.options.includes(ans));
        },
        message: "Correct answers must be included in options",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Quiz", quizSchema);
