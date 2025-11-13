import mongoose from "mongoose";

const userPerformanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subTopicId: { type: mongoose.Schema.Types.ObjectId, ref: "SubTopicAtoZ", required: true },
    attempts: { type: Number, default: 0 },
    correctAttemptNumber: { type: Number, default: null },
    isCorrect: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    lastAttemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userPerformanceSchema.virtual("efficiency").get(function () {
  if (!this.isCorrect) return 0;
  return Math.max(0, 100 - (this.correctAttemptNumber - 1) * 20);
});

export default mongoose.model("UserPerformance", userPerformanceSchema);
