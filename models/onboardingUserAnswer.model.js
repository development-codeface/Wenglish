import mongoose from "mongoose";

const userAnswerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },

    answers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("UserAnswer", userAnswerSchema);
