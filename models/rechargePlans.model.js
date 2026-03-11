import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true, // e.g., cost in INR/USD
    },
    duration: {
      type: Number,
      required: true, // duration in seconds
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
