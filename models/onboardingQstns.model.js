import mongoose from "mongoose";

const multilingualField = {
  en: { type: String, default: "" },
  hi: { type: String, default: "" },
  ta: { type: String, default: "" },
  te: { type: String, default: "" },
  kn: { type: String, default: "" },
  ml: { type: String, default: "" }
};

const optionSchema = new mongoose.Schema({
  text: multilingualField,        
  icon: {
    type: String,
    trim: true,
  },
});

const questionSchema = new mongoose.Schema(
  {
    questionText: multilingualField,    
    icon: {
      type: String,
      trim: true,
    },
    options: {
      type: [optionSchema],
      required: [true, "Options are required"],
      validate: {
        validator: (arr) => arr.length >= 2,
        message: "At least two options are required.",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
