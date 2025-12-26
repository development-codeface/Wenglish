import mongoose from "mongoose";

const whyLearnCategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model("WhyLearnCategory", whyLearnCategorySchema);
