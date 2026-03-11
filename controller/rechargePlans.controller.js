import Plan from "../models/rechargePlans.model.js";

/**
 * Get all active plans
 */
export const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ amount: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get single plan by ID
 */
export const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create a new plan
 */
export const createPlan = async (req, res) => {
  try {
    const { name, amount, duration, description } = req.body;

    if (!name || !amount || !duration) {
      return res.status(400).json({ success: false, message: "Name, amount, and duration are required" });
    }

    const plan = new Plan({ name, amount, duration, description });
    await plan.save();

    res.status(201).json({ success: true, message: "Plan created", plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update a plan
 */
export const updatePlan = async (req, res) => {
  try {
    const { name, amount, duration, description, isActive } = req.body;

    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    if (name !== undefined) plan.name = name;
    if (amount !== undefined) plan.amount = amount;
    if (duration !== undefined) plan.duration = duration;
    if (description !== undefined) plan.description = description;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();

    res.json({ success: true, message: "Plan updated", plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete / deactivate a plan
 */
export const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    // Soft delete: deactivate plan
    plan.isActive = false;
    await plan.save();

    res.json({ success: true, message: "Plan deactivated", plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
