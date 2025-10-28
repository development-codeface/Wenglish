import mongoose from "mongoose";

const subTopicSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
    title: { type: String, required: true },
    content: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("SubTopic", subTopicSchema);
