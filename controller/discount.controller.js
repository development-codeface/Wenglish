import Discount from "../models/discount.model.js";

// Create a new multilingual discount
export const createDiscount = async (req, res) => {
  try {
    let {
      title,
      description,
      discountPercentage,
      isActive,
      duration,
      days,
      actualPrice,
      discountPrice
    } = req.body;

    // Parse multilingual JSON strings if needed
    if (typeof title === "string") title = JSON.parse(title);
    if (typeof description === "string") description = JSON.parse(description);

    if (!title?.en || discountPercentage === undefined) {
      return res.status(400).json({
        message: "English title and discountPercentage are required",
      });
    }

    const discount = new Discount({
      title,
      description,
      discountPercentage,
      isActive: isActive !== undefined ? isActive : true,

      image: req.file ? `/uploads/images/${req.file.filename}` : "",

      // NEW FIELDS
      duration,
      days,
      actualPrice,
      discountPrice,
    });

    await discount.save();

    res.status(201).json({ message: "Discount created", discount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get all active discounts (with optional language filter)
export const getDiscounts = async (req, res) => {
  try {
    const lang = req.user?.nativeLanguage || "en";
    const discounts = await Discount.find({ isActive: true });

    const localizedDiscounts = discounts.map((d) => ({
      ...d._doc,
      title: d.title[lang] || d.title.en,
      description: d.description?.[lang] || d.description?.en || "",
    }));

    res.status(200).json(localizedDiscounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getDiscountById = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.user?.nativeLanguage || "en";

    const discount = await Discount.findById(id);
    if (!discount) return res.status(404).json({ message: "Discount not found" });

    const localized = {
      ...discount._doc,
      title: discount.title[lang] || discount.title.en,
      description: discount.description?.[lang] || discount.description?.en || "",
    };

    res.status(200).json(localized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// Get discount by ID with language selection
export const getDiscountsAllLang = async (req, res) => {
  try {
    const discounts = await Discount.find({ isActive: true });

    const allLangDiscounts = discounts.map((d) => ({
      _id: d._id,

      // full multilingual title + description
      title: d.title,
      description: d.description || {},

      // image
      image: d.image,

      // discount info
      discountPercentage: d.discountPercentage,
      isActive: d.isActive,

      // ⭐ NEW FIELDS INCLUDED HERE
      duration: d.duration,
      days: d.days,
      actualPrice: d.actualPrice,
      discountPrice: d.discountPrice,

      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    res.status(200).json(allLangDiscounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Update a discount (multilingual-safe)
export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (req.file) {
      updates.image = `/uploads/images/${req.file.filename}`;
    }

    // Parse multilingual JSON if needed
    if (updates.title) updates.title = JSON.parse(updates.title);
    if (updates.description) updates.description = JSON.parse(updates.description);


    const updated = await Discount.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Discount not found" });

    res.status(200).json({
      message: "Discount updated",
      discount: updated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Delete a discount by ID
export const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Discount.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: "Discount not found" });

    res.status(200).json({ message: "Discount deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
