import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },         
    description: { type: String, default: "" },        
    image: { type: String, default: "" },             
    discountPercentage: { type: Number, required: true, min: 0, max: 100 }, 
    isActive: { type: Boolean, default: true },      
  },
  { timestamps: true }
);

export default mongoose.model("Discount", discountSchema);
