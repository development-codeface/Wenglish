
import User from "../models/user.model.js";
import  Subscription  from "../models/subscription.model.js";
import UserAnswer from "../models/onboardingUserAnswer.model.js";
import Question from "../models/onboardingQstns.model.js";
import Payment from "../models/payment.model.js";
import PasswordResetOTP from "../models/passwordReset.model.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/mailer.js";


export const completePaymentAndSubscribe = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      name,
      phone,
      address,
      transactionId,
      status,
      planId,
      amount
    } = req.body;

    // 1. Validate plan
    const plan = await Subscription.findById(planId).populate("discount");
    if (!plan) {
      return res.status(404).json({
        status: false,
        message: "Plan not found",
      });
    }

    // 2. Store payment
    const payment = await Payment.create({
      name,
      phone,
      address,
      transactionId,
      status,
      amount,
      plan: planId,
      user: userId
    });

    if (status !== "success") {
      return res.status(400).json({
        status: false,
        message: "Payment failed, subscription not activated",
        payment,
      });
    }

    // 3. Calculate final price
    let finalPrice = plan.price;
    const planName = plan.title.en;

    if (plan.discount && plan.discount.isActive) {
      const discountPercentage = plan.discount.discountPercentage || 0;
      finalPrice = plan.price - (plan.price * discountPercentage) / 100;
    }

    // 4. Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.days);

    // 5. Activate subscription
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    user.subscription = {
      plan: plan._id,
      planName,
      startDate,
      endDate,
      isActive: true,
      pricePaid: finalPrice,
      originalPrice: plan.price,
      discountApplied: plan.discount
        ? {
            discountId: plan.discount._id,
            discountPercentage: plan.discount.discountPercentage,
          }
        : null,
    };

    await user.save();

    return res.status(200).json({
      status: true,
      message: "Payment successful, subscription activated",
      payment,
      subscription: user.subscription,
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};


export const updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, phone, languagePreference, whyLearn } = req.body;

    let profileImage;
    if (req.file) {
      profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name,
          phone,
          profileImage,
          languagePreference,
          whyLearn, 
          lastActive: new Date(),
        },
      },
      { new: true, runValidators: true, omitUndefined: true } // omitUndefined ensures undefined fields are not overwritten
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
      status:"true"
    });
  } catch (err) {
    res.status(500).json({ message: err.message, status:"false" });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const userId = req.user._id; 

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User deleted successfully",
      userId: deletedUser._id,
      status:"true"
    });
  } catch (err) {
    res.status(500).json({ message: err.message, status:"false" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id; 

    const user = await User.findById(userId).select("-password"); 

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user , status:"true"});
  } catch (err) {
    res.status(500).json({ message: err.message, status:"false" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); 

    res.status(200).json({ users, status:"true" });
  } catch (err) {
    res.status(500).json({ message: err.message , status:"false"});
  }
};

export const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user.id; 

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isOnboardingComplete: true },
      { new: true, runValidators: true }
    ).select("-password"); 

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      status: true,
      message: "Onboarding marked as complete",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isOnboardingComplete: updatedUser.isOnboardingComplete,
        status:"true"
      },
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({
      status: false,
      message: "Server error while updating onboarding status",
    });
  }
};

export const getAllUsersWithOnboardingAnswers = async (req, res) => {
  try {
    // Fetch all users
    const users = await User.find().select("-password").lean();

    // Fetch all answers grouped by user
    const answers = await UserAnswer.find()
      .populate("questionId", "questionText options") // bring full question & options
      .lean();

    // Group answers by userId
    const userAnswersMap = {};
    answers.forEach((ans) => {
      if (!userAnswersMap[ans.userId]) userAnswersMap[ans.userId] = [];
      userAnswersMap[ans.userId].push(ans);
    });

    // Create final formatted response
    const result = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      languagePreference: user.languagePreference,
      subscription: user.subscription || null,
      onboardingAnswers: (userAnswersMap[user._id] || []).map((ans) => ({
        question: ans.questionId?.questionText || {},
        selectedOptions: ans.answers.map((selectedId) => {
          const option = ans.questionId?.options?.find(
            (opt) => String(opt._id) === String(selectedId)
          );
          return option || null;
        }).filter(Boolean),
      })),
    }));

    return res.status(200).json({
      status: true,
      users: result,
    });

  } catch (error) {
    console.error("Error fetching user onboarding data:", error);
    res.status(500).json({
      status: false,
      message: "Error fetching user onboarding data",
    });
  }
};

export const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove old OTPs
    await PasswordResetOTP.deleteMany({ email });

    // Store new OTP
    await PasswordResetOTP.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) 
    });

    // Send email
    await sendEmail(
      email,
      "Your Blingoo Password Reset OTP",
      `Your OTP for resetting your password is: ${otp}. This code will expire in 5 minutes.`
    );

    console.log("Password Reset OTP:", otp);

    res.status(200).json({
      status: true,
      message: "OTP sent to email",
    });

  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

export const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await PasswordResetOTP.findOne({ email, otp });

    if (!record) return res.status(400).json({ message: "Invalid OTP" });
    if (record.expiresAt < new Date()) 
      return res.status(400).json({ message: "OTP expired" });

    res.status(200).json({
      status: true,
      message: "OTP verified successfully"
    });

  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = await PasswordResetOTP.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: "Invalid OTP" });
    if (record.expiresAt < new Date()) 
      return res.status(400).json({ message: "OTP expired" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    await PasswordResetOTP.deleteMany({ email });

    res.status(200).json({
      status: true,
      message: "Password reset successfully"
    });

  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};


