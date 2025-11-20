import mongoose from "mongoose";

const PushNotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null  
    },

    title: { type: String, required: true },
    body: { type: String, required: true },

    sentToAll: { type: Boolean, default: false },

    imageUrl: { type: String },

    tokensUsed: [
      {
        token: String,
        status: String,   
        response: Object   
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("PushNotification", PushNotificationSchema);
