import SubscriptionPlan from "../models/subscription.model.js";
import User from "../models/user.model.js";

// Create a new subscription plan
export const createSubscriptionPlan = async (req, res) => {
  try {
    const plan = new SubscriptionPlan(req.body);
    await plan.save();
    res.status(201).json({ message: "Subscription plan created", plan });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all plans (localized for user language)
export const getAllPlans = async (req, res) => {
  try {
    const userLang = req.user?.languagePreference || "en";

    const plans = await SubscriptionPlan.find().populate("discount");

    const localizedPlans = plans.map((plan) => ({
      _id: plan._id,
      title: plan.title[userLang] || plan.title.en,
      description: plan.description[userLang] || plan.description.en,
      image: plan.image,
      price: plan.price,
      duration: plan.duration,
      days: plan.days,
      isActive: plan.isActive,
      discount: plan.discount,
    }));

    res.status(200).json(localizedPlans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get plan by ID (localized)
export const getPlanById = async (req, res) => {
  try {
    const user = await User.findById(req.user?._id);
    const userLang = user?.languagePreference || "en";

    const plan = await SubscriptionPlan.findById(req.params.id).populate(
      "discount"
    );
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const localized = {
      _id: plan._id,
      title: plan.title[userLang] || plan.title.en,
      description: plan.description[userLang] || plan.description.en,
      image: plan.image,
      price: plan.price,
      duration: plan.duration,
      days: plan.days,
      isActive: plan.isActive,
      discount: plan.discount,
    };

    res.status(200).json(localized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a plan by ID
export const updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("discount");

    if (!updatedPlan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    res
      .status(200)
      .json({ message: "Subscription plan updated", plan: updatedPlan });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a plan by ID
export const deleteSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPlan = await SubscriptionPlan.findByIdAndDelete(id);

    if (!deletedPlan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    res.status(200).json({ message: "Subscription plan deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
