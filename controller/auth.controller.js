
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { initializeUserProgress } from "./progress.controller.js";
import  Subscription  from "../models/subscription.model.js";
import { sendEmail } from "../utils/mailer.js";
import crypto from "crypto";
import OTP from "../models/otp.model.js";


export const registerUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      phone, 
      profileImage, 
      languagePreference, 
      whyLearn 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      phone,
      profileImage: profileImage || "",
      languagePreference: languagePreference || "",
      whyLearn: Array.isArray(whyLearn) ? whyLearn : [], // ensure array
      subscription: {
        plan: null,
        startDate: null,
        endDate: null,
        isActive: false,
      },
      lastActive: new Date(),
            isVerified: false,

    });

    await initializeUserProgress(user._id);
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);


    await OTP.create({ email, otp: otpCode, expiresAt: otpExpiry });

    await sendEmail(email, "Verify Your Email", `Your OTP is ${otpCode}. It expires in 5 minutes.`);


    const { password: _, ...userData } = user.toObject();

    res.status(201).json({ message: "User registered successfully", user: userData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified. Please verify your email before logging in." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


