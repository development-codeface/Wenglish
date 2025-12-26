import mongoose from "mongoose";

const letterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // uuid string you already use
  position: { type: Number, index: true }, // new stable ordering key
  en: { type: String, default: "" },
  hi: { type: String, default: "" },
  ta: { type: String, default: "" },
  te: { type: String, default: "" },
  kn: { type: String, default: "" },
  ml: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Letters", letterSchema);
