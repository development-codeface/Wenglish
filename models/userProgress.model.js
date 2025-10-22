import mongoose from "mongoose";

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  unlockedChapters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chapter" }],
  unlockedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
});

export default mongoose.model("UserProgress", userProgressSchema);
