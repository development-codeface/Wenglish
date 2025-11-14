import mongoose from "mongoose";

const PasswordResetOTPSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model("PasswordResetOTP", PasswordResetOTPSchema);
