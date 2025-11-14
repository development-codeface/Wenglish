import mongoose from "mongoose";

const GrammarChatHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subtopicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrammarSubtopic",
      required: true,
    },
    subtopicName: {
      type: String,
      required: true,
    },
    userMessage: {
      type: String,
      required: true,
    },
    botReply: {
      type: String,
      required: true,
    },
    correctedInput: {
      type: String,
    }
  },
  { timestamps: true }
);

export default mongoose.model("GrammarChatHistory", GrammarChatHistorySchema);
