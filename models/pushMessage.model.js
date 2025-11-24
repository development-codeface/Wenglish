// models/pushMessage.model.js
import mongoose from "mongoose";

const translationSchema = new mongoose.Schema({
  en: { type: String },
  ml: { type: String },
  hi: { type: String },
  ta: { type: String },
  te: { type: String},
  kn: { type: String }
}, { _id: false });

const pushMessageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["inactivity"],
      default: "inactivity"
    },

    title: translationSchema,
    body: translationSchema,

    imageUrl: {
      type: String,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);


export default mongoose.model("PushMessage", pushMessageSchema);
