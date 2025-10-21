import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    response: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("ChatMessage", chatMessageSchema);
