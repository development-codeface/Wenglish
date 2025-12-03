import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { initializeUserProgress } from "./progress.controller.js";
import Subscription from "../models/subscription.model.js";
import { sendEmail } from "../utils/mailer.js";
import crypto from "crypto";
import OTP from "../models/otp.model.js";
import TempUser from "../models/tempUser.model.js";
import { on } from "events";
import FCMToken from "../models/fcmToken.model.js";

export const registerUser = async (req, res) => {
  try {
    let { name, email, password, role, phone, languagePreference, whyLearn, nativeLanguage, fcmToken } = req.body;

    // Clean up languagePreference
    if (typeof languagePreference === "string") {
      languagePreference = languagePreference.trim();
      if (languagePreference === "" || languagePreference === "null") {
        languagePreference = null;
      }
    }
    if (typeof nativeLanguage === "string") {
      nativeLanguage = nativeLanguage.trim();
      if (nativeLanguage === "" || nativeLanguage === "null") {
        nativeLanguage = null;
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    await TempUser.deleteOne({ email });

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImage = req.file ? `/uploads/profiles/${req.file.filename}` : "";

    await TempUser.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      phone,
      profileImage,
      languagePreference,
      whyLearn,
      nativeLanguage,
      fcmToken
    });

    // Generate and send OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.create({ email, otp: otpCode, expiresAt: otpExpiry });
    await sendEmail(
      email,
      "Verify Your Email",
      `Your OTP is ${otpCode}. It expires in 5 minutes.`
    );

    res.status(200).json({
      message: "OTP sent successfully. Please verify to complete registration.",
      status: "true",
    });
  } catch (err) {
    res.status(500).json({ message: err.message, status: "false" });
  }
};



export const loginUser = async (req, res) => {
  try {
    const { email, password ,fcmToken} = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if email is verified
    if (!user.isVerified) {
      return res
        .status(403)
        .json({
          message:
            "Email not verified. Please verify your email before logging in.",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" ,status:"false"});

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

  if (fcmToken) {
  // Check if token exists for ANY user (globally unique)
  const exists = await FCMToken.findOne({ token: fcmToken });

  if (!exists) {
    // Create new token entry
    await FCMToken.create({
      user: user._id,
      token: fcmToken
    });
  } else {
    exists.user = user._id;
    exists.lastUsedAt = new Date();
    await exists.save();
  }
}

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboardingComplete: user.isOnboardingComplete,
        status: "true",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message, status: "false" });
  }
};
