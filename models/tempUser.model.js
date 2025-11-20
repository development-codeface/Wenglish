import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true },
    password: String,
    role: { type: String, default: "user" },
    phone: String,
    profileImage: String,
    languagePreference: String,
    whyLearn: [String],
    isOnboardingComplete: { type: Boolean, default: false },
    fcmToken: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("TempUser", tempUserSchema);
