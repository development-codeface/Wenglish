import mongoose from "mongoose";

const userCallSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dailyLimit: { type: Number, default: 60 }, // daily limit in seconds
    remainingSeconds: { type: Number, default: 60 }, // remaining for today
    lastUsed: { type: Date, default: null }, // last call timestamp
     callStart: { type: Date, default: null }, 
  },
  { timestamps: true }
);

const UserCall = mongoose.model("UserCall", userCallSchema);
export default UserCall;
