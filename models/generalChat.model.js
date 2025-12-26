import mongoose from "mongoose";

const GeneralChatHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    stage: {
      type: String,
      enum: ["start", "asked_day", "asked_interest", "general"],
      default: "start"
    },

    history: [
      {
        userMessage: { type: String },    
        aiMessage: { type: String }        
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("GeneralChatHistory", GeneralChatHistorySchema);
