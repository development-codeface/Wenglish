import crypto from "crypto";
import jwt from "jsonwebtoken";
import OTP from "../models/otp.model.js";
import TempUser from "../models/tempUser.model.js";
import User from "../models/user.model.js";
import { sendEmail } from "../utils/mailer.js";
import { initializeUserProgress } from "../controller/progress.controller.js";

export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: "Invalid OTP" });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: "OTP expired" });

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) return res.status(404).json({ message: "No pending registration found" });

    const user = await User.create({
      ...tempUser.toObject(),
      isVerified: true,
      lastActive: new Date(),
      subscription: {
        plan: null,
        startDate: null,
        endDate: null,
        isActive: false,
      },
    });

    await initializeUserProgress(user._id);

    await TempUser.deleteOne({ email });
    await OTP.deleteMany({ email });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password, ...userData } = user.toObject();

    res.status(200).json({
      message: "Email verified successfully",
      user: userData,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const lastOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (lastOtp && Date.now() - lastOtp.createdAt.getTime() < 60 * 1000) {
      return res.status(429).json({ message: "Please wait 1 minute before requesting another OTP" });
    }

    await OTP.deleteMany({ email });

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.create({ email, otp: otpCode, expiresAt: otpExpiry });

    await sendEmail(
      email,
      "Resend OTP - LangApp",
      `Your new OTP is ${otpCode}. It expires in 5 minutes.`
    );

    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
