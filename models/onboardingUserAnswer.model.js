import mongoose from "mongoose";

const userAnswerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },

    answers: [
      {
        text: { type: String, required: true },
        icon: { type: String }
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("UserAnswer", userAnswerSchema);
