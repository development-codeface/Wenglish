import SubscriptionPlan from "../models/subscription.model.js";
import User from "../models/user.model.js";

// Create a new subscription plan
export const createSubscriptionPlan = async (req, res) => {
  try {
    if (typeof req.body.title === "string") req.body.title = JSON.parse(req.body.title);
    if (typeof req.body.description === "string") req.body.description = JSON.parse(req.body.description);
    if (!req.body.discount) {
  req.body.discount = undefined;
}


    // Handle uploaded image
    if (req.file) {
      req.body.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const plan = new SubscriptionPlan(req.body);
    await plan.save();

    res.status(201).json({
      message: "Subscription plan created successfully",
      plan,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all plans (localized for user language)
export const getAllPlans = async (req, res) => {
  try {
    const userLang = req.user?.nativeLanguage || "en";

    const plans = await SubscriptionPlan.find()
      .populate("discount")
      .lean();

    const localizedPlans = plans.map((plan) => {
      const discountActive = plan.discount?.isActive && plan.discount?.discountPercentage > 0;

      // Compute discounted price if applicable
      const discountPercentage = discountActive ? plan.discount.discountPercentage : 0;
      const discountPrice = discountActive
        ? +(plan.price - (plan.price * discountPercentage) / 100).toFixed(2)
        : plan.price;

      return {
        _id: plan._id,
        title: plan.title[userLang] || plan.title.en,
        description: plan.description[userLang] || plan.description.en,
        imageUrl: plan.imageUrl,
        isActive: plan.isActive,
        duration: plan.duration,
        days: plan.days,

        // 💰 Pricing details
        actualPrice: plan.price,
        discountPercentage,
        discountPrice,
      };
    });

    res.status(200).json(localizedPlans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getAllPlansAllLang = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().populate("discount").lean();

    const formattedPlans = plans.map((plan) => ({
      _id: plan._id,

      // ✅ Return multilingual objects fully
      title: typeof plan.title === "object" ? plan.title : { en: plan.title },
      description: typeof plan.description === "object" ? plan.description : { en: plan.description },

      imageUrl: plan.imageUrl,
      price: plan.price,
      duration: plan.duration,
      days: plan.days,
      isActive: plan.isActive,

      // ✅ Discount may also need to carry multilingual — leave as is unless needed
      discount: plan.discount || null,
    }));

    res.status(200).json({
      status: true,
      message: "Subscription plans returned in all languages",
      plans: formattedPlans,
    });

  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};


// Get plan by ID (localized)
export const getPlanById = async (req, res) => {
  try {
    const user = await User.findById(req.user?._id);
    const userLang = user?.nativeLanguage || "en";

    const plan = await SubscriptionPlan.findById(req.params.id)
      .populate("discount")
      .lean();

    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const discountActive = plan.discount?.isActive && plan.discount?.discountPercentage > 0;
    const discountPercentage = discountActive ? plan.discount.discountPercentage : 0;
    const discountPrice = discountActive
      ? +(plan.price - (plan.price * discountPercentage) / 100).toFixed(2)
      : plan.price;

    const localizedPlan = {
      _id: plan._id,
      title: plan.title[userLang] || plan.title.en,
      description: plan.description[userLang] || plan.description.en,
      imageUrl: plan.imageUrl,
      duration: plan.duration,
      days: plan.days,
      isActive: plan.isActive,

      // 💰 Pricing details
      actualPrice: plan.price,
      discountPercentage,
      discountPrice,

      // 🏷 Discount info (optional)
      discount: discountActive
        ? {
            _id: plan.discount._id,
            title: plan.discount.title[userLang] || plan.discount.title.en,
            description:
              plan.discount.description?.[userLang] ||
              plan.discount.description?.en ||
              "",
            discountPercentage: plan.discount.discountPercentage,
            image: plan.discount.image || "",
          }
        : null,
    };

    res.status(200).json(localizedPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Update a plan by ID
export const updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;

      if (req.body.discount === "" || req.body.discount === "null") {
      req.body.discount = null;
    }

    if (typeof req.body.title === "string") {
      req.body.title = JSON.parse(req.body.title);
    }
    if (typeof req.body.description === "string") {
      req.body.description = JSON.parse(req.body.description);
    }

    if (typeof req.body.isActive === "string") {
      req.body.isActive = req.body.isActive === "true";
    }

    if (req.file) {
      req.body.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("discount");

    if (!updatedPlan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    return res.status(200).json({
      message: "Subscription plan updated",
      plan: updatedPlan,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
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
