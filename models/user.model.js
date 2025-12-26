import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    subscription: {
      plan: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
      startDate: { type: Date },
      endDate: { type: Date },
      isActive: { type: Boolean, default: false },
      planName: { type: String }, 
    },
    lastActive: { type: Date, default: null },
    profileImage: { type: String, default: "" },
    nativeLanguage: {
      type: String,
      enum: ["en", "ml", "te", "hi", "ta", "kn"],
      default: "en",
    },
    languagePreference: {
      type: String,
      enum: ["en", "ml", "te", "hi", "ta", "kn"],
      default: "en",
    },
    whyLearn: { type: [String] },
    isVerified: { type: Boolean, default: false },
    usageHistory: [{ type: Date }],
    isOnboardingComplete: { type: Boolean, default: false }, 
    fcmToken: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
