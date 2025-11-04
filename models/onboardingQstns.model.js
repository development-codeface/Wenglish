import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, "Option text is required"],
    trim: true,
  },
  icon: {
    type: String, 
    trim: true,
  },
});

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
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
