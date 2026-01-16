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
    const profileImage = req.file ? await uploadToS3(req.file, "images") : "";
    

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
    const { email, password, fcmToken } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Email not verified. Please verify your email before logging in.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
        status: "false",
      });
    }

    // 🔐 ACCESS TOKEN (short-lived)
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // 🔁 REFRESH TOKEN (long-lived)
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" }
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // 📱 FCM TOKEN HANDLING (unchanged)
    if (fcmToken) {
      const exists = await FCMToken.findOne({ token: fcmToken });

      if (!exists) {
        await FCMToken.create({
          user: user._id,
          token: fcmToken,
        });
      } else {
        exists.user = user._id;
        exists.lastUsedAt = new Date();
        await exists.save();
      }
    }

    res.status(200).json({
      message: "Login successful",
      token:accessToken,
      refreshToken,
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

export const refreshLoginToken = async (req, res) => {
  try {
    const { refresh } = req.body;

    // 1️⃣ Check request body
    if (!refresh) {
      return res.status(400).json({
        message: "Refresh token is required",
      });
    }

    // 2️⃣ Verify refresh token signature & expiry
    let decoded;
    try {
      decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: "Refresh token expired or invalid",
      });
    }

    // 3️⃣ Validate decoded payload
    if (!decoded?.id) {
      return res.status(403).json({
        message: "Invalid refresh token payload",
      });
    }

    // 4️⃣ Fetch user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 5️⃣ Match refresh token with DB (rotation check)
    if (!user.refreshToken || user.refreshToken !== refresh) {
      return res.status(403).json({
        message: "Invalid refresh token",
      });
    }

    // 6️⃣ Generate new tokens
    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" }
    );

    // 7️⃣ Rotate refresh token
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    // 8️⃣ Success response
    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

  } catch (err) {
    console.error("Refresh token error:", err);

    return res.status(500).json({
      message: "Something went wrong while refreshing token",
    });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("active");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.active = !user.active;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User has been ${user.active ? "activated" : "deactivated"} successfully`,
      data: {
        userId: user._id,
        active: user.active,
      },
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
