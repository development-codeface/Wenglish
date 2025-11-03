import WhyLearnCategory from "../models/whyLearn.model.js";

// Create
export const createCategory = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const category = new WhyLearnCategory({ title });
    await category.save();

    res.status(201).json({ message: "Category created successfully", category });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Read
export const getAllCategories = async (req, res) => {
  try {
    const categories = await WhyLearnCategory.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const updated = await WhyLearnCategory.findByIdAndUpdate(
      id,
      { title },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category updated", category: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await WhyLearnCategory.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
