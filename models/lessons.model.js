import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", required: true },
  title: { type: String, required: true },
  description: String,
  videoUrl: { type: String, required: true },
  thumbnail: String,
  question: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  order: { type: Number, required: true },
  
});

export default mongoose.model("Lesson", lessonSchema);
