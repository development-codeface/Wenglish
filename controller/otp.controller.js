import crypto from "crypto";
import OTP from "../models/otp.model.js";
import User from "../models/user.model.js";
import { sendEmail } from "../utils/mailer.js";


export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OTP.findOne({ email, otp });

    if (!record) return res.status(400).json({ message: "Invalid OTP" });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: "OTP expired" });

    await User.findOneAndUpdate({ email }, { isVerified: true });
    await OTP.deleteMany({ email });

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    await OTP.deleteMany({ email });

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.create({ email, otp: otpCode, expiresAt: otpExpiry });
    await sendEmail(email, "Resend OTP - LangApp", `Your new OTP is ${otpCode}. It expires in 5 minutes.`);

    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
