import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // lesson, quiz, atoz, grammar
    moduleType: {
      type: String,
      enum: ["lesson", "quiz", "atoz", "grammar"],
      required: true,
    },

    // ID of the specific lesson/quiz/subtopic
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // For multiple attempts (A-Z needs this)
    attempts: { type: Number, default: 1 },

    // Basic scoring
    score: { type: Number, default: 0 },
    total: { type: Number, default: 1 },
    accuracy: { type: Number, default: 0 }, // percentage

    // Raw answer info
    userAnswer: { type: mongoose.Schema.Types.Mixed },
    correctAnswer: { type: mongoose.Schema.Types.Mixed },

    // Correct or wrong
    isCorrect: { type: Boolean, default: false },

    // To track improvement
    timeTaken: { type: Number, default: 0 },

    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


performanceSchema.virtual("efficiency").get(function () {
  if (!this.isCorrect) return 0;

  
  return Math.max(0, 100 - (this.attempts - 1) * 20);
});

export default mongoose.model("Performance", performanceSchema);
