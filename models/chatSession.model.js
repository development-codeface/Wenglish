import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number },
});

export default mongoose.model("ChatSession", chatSessionSchema);
