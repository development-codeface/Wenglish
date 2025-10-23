import Discount from "../models/discount.model.js";

// Create a new discount
export const createDiscount = async (req, res) => {
  try {
    const { title, description, image, discountPercentage, isActive } = req.body;

    if (!title || discountPercentage === undefined) {
      return res.status(400).json({ message: "Title and discountPercentage are required" });
    }

    const discount = await Discount.create({
      title,
      description,
      image,
      discountPercentage,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ message: "Discount created", discount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all active discounts
export const getDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find({ isActive: true });
    res.status(200).json(discounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a discount by ID
export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Discount.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) return res.status(404).json({ message: "Discount not found" });

    res.status(200).json({ message: "Discount updated", discount: updated });
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
