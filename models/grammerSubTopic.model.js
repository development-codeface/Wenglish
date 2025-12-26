import mongoose from "mongoose";

const localizedFieldSchema = new mongoose.Schema(
  {
    en: { type: String, required: true },
    hi: { type: String },
    ta: { type: String },
    te: { type: String },
    kn: { type: String },
    ml: { type: String },
  },
  { _id: false }
);

const grammarSubtopicSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },

    stage: {
      type: String,
      enum: [
        "intro",
        "understanding-check",
        "examples",
        "questions",
        "mastered",
      ],
      default: "intro",
    },

    title: { type: localizedFieldSchema, required: true },
    description: { type: localizedFieldSchema, required: true },

    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("GrammarSubtopic", grammarSubtopicSchema);
