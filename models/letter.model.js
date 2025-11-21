import mongoose from "mongoose";

const letterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // unique ID
  en: { type: String, default: "" },
  hi: { type: String, default: "" },
  ta: { type: String, default: "" },
  te: { type: String, default: "" },
  kn: { type: String, default: "" },
  ml: { type: String, default: "" }
});

export default mongoose.model("Letters", letterSchema);
