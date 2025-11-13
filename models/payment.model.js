import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    address: {
      type: String,
      required: true,
      trim: true
    },

    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending"
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    amount: {
      type: Number
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
