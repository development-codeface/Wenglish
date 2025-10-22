import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  intro: String,
  order: { type: Number, required: true },
  
});

export default mongoose.model("Chapter", chapterSchema);
