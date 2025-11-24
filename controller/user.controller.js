
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

    // 2. Store payment record
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

    // If payment failed → stop
    if (status !== "success") {
      return res.status(400).json({
        status: false,
        message: "Payment failed, subscription not activated",
        payment,
      });
    }

    // 3. Calculate final payable price
    let finalPrice = plan.price;
    const planName = plan.title.en;

    if (plan.discount && plan.discount.isActive) {
      const discountPercentage = plan.discount.discountPercentage || 0;
      finalPrice = plan.price - (plan.price * discountPercentage) / 100;
    }

    // 4. Calculate subscription dates
    const now = new Date();
    let startDate = now;
    let endDate;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // If user already has an active subscription → extend it
    if (
      user.subscription?.isActive &&
      user.subscription.endDate &&
      user.subscription.endDate > now
    ) {
      startDate = user.subscription.startDate; // keep original start date
      endDate = new Date(user.subscription.endDate);
      endDate.setDate(endDate.getDate() + plan.days); // extend
    } else {
      // New subscription or expired subscription
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + plan.days);
    }

    // 5. Activate subscription
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
    const { name, phone, languagePreference, whyLearn , nativeLanguage} = req.body;

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
          nativeLanguage,
        },
      },
      { new: true, runValidators: true, omitUndefined: true } 
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

export const updateNativeLanguage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { nativeLanguage } = req.body;

    if (!nativeLanguage || typeof nativeLanguage !== "string") {
      return res.status(400).json({
        status: false,
        message: "nativeLanguage is required and must be a string",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { nativeLanguage, lastActive: new Date() } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Native language updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error updating native language:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
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

    // Fetch user
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    // Fetch onboarding answers and populate question + options
    const onboardingAnswers = await UserAnswer.find({ userId })
      .populate({
        path: "questionId",
        model: "Question",
        populate: {
          path: "options", // if your Question model uses options[]
          model: "QuestionOption"
        }
      })
      .lean();

    // Format answers
    const formattedAnswers = onboardingAnswers.map((ans) => ({
      _id: ans._id,
      questionId: ans.questionId?._id,
      questionText: ans.questionId?.questionText || {},
      icon: ans.questionId?.icon || null,
      options: ans.questionId?.options || [],
      userSelected: ans.answers || [],
      createdAt: ans.createdAt,
    }));

    return res.status(200).json({
      status: true,
      user,
      onboardingAnswers: formattedAnswers,
    });

  } catch (err) {
    console.error("Get user detail error:", err);
    return res.status(500).json({ message: err.message, status: false });
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

    const answers = await UserAnswer.find()
      .populate("questionId", "questionText options") 
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


