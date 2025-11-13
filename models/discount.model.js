import mongoose from "mongoose";

const localizedStringSchema = new mongoose.Schema(
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

const discountSchema = new mongoose.Schema(
  {
    title: { type: localizedStringSchema, required: true },

    description: { type: localizedStringSchema, default: {} },

    image: { type: String, default: "" },

    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    isActive: { type: Boolean, default: true },

    duration: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      default: "monthly",
    },

    days: {
      type: Number,
      default: 30,
    },

    actualPrice: {
      type: Number,
      default: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Discount", discountSchema);
