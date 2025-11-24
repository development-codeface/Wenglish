import mongoose from "mongoose";

const multiFieldSchema = {
  en: { type: String, default: "" },
  ml: { type: String, default: "" },
  hi: { type: String, default: "" },
  ta: { type: String, default: "" },
  te: { type: String, default: "" },
  kn: { type: String, default: "" }
};

const questionSchema = new mongoose.Schema(
  {
    question: multiFieldSchema,    
    langType: {
      type: String,
      required: true,
      enum: ["native", "preferred"], 
    }
  },
  { timestamps: true }
);

export default mongoose.model("langQuetions", questionSchema);
