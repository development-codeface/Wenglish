
import User from "../models/user.model.js";
import  Subscription  from "../models/subscription.model.js";
import UserAnswer from "../models/onboardingUserAnswer.model.js";
import Question from "../models/onboardingQstns.model.js";

export const subscribeUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { planId } = req.body;

    const plan = await Subscription.findById(planId).populate("discount");
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    let finalPrice = plan.price;

    if (plan.discount && plan.discount.isActive) {
      const discountPercentage = plan.discount.discountPercentage || 0;
      finalPrice = plan.price - (plan.price * discountPercentage) / 100;
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.days);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.subscription = {
      plan: plan._id,
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

    // 5️⃣ Respond with details
    res.status(200).json({
      message: "Subscribed successfully",
      subscription: user.subscription,
      status: true,
      pricePaid: finalPrice.toFixed(2),
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
      status: false,
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
