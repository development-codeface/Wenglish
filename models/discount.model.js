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
  },
  { timestamps: true }
);

export default mongoose.model("Discount", discountSchema);
