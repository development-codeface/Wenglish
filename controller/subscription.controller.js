import  SubscriptionPlan  from "../models/subscription.model.js";

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

// Get all plans (populate discount)
export const getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().populate("discount");
    res.status(200).json(plans);
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

    res.status(200).json({ message: "Subscription plan updated", plan: updatedPlan });
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

