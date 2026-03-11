import mongoose from "mongoose";

const rechargeHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true },
  duration: { type: Number, required: true }, // seconds added
  rechargeDate: { type: Date, default: Date.now }
});

const userCallSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dailyLimit: { type: Number, default: 60 }, // daily free limit in seconds
    remainingSeconds: { type: Number, default: 60 }, // remaining for today
    lastUsed: { type: Date, default: null }, // last call timestamp
    callStart: { type: Date, default: null },
    rechargeHistory: [rechargeHistorySchema] // track all recharges
  },
  { timestamps: true }
);

const UserCall = mongoose.model("UserCall", userCallSchema);
export default UserCall;