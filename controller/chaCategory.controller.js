import ChatCategory from "../models/chatCategories.model.js";
import { getCategoryChatResponse } from "../services/llmService.js";
import ChatHistory from "../models/chatHistory.model.js";

// Create a new chat category (supports multilingual fields)
export const createCategory = async (req, res) => {
  try {
    const { image, title = {}, description = {} } = req.body;

    if (!title.en || !description.en) {
      return res.status(400).json({ error: "English (en) title and description are required" });
    }

    const newCategory = new ChatCategory({
      image,
      title: {
        en: title.en || "",
        hi: title.hi || "",
        ta: title.ta || "",
        te: title.te || "",
        kn: title.kn || "",
        ml: title.ml || "",
      },
      description: {
        en: description.en || "",
        hi: description.hi || "",
        ta: description.ta || "",
        te: description.te || "",
        kn: description.kn || "",
        ml: description.ml || "",
      },
    });

    await newCategory.save();
    res.status(201).json({ message: "Chat category created successfully", category: newCategory });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all chat categories — localized for user's preferred language
export const getAllCategories = async (req, res) => {
  try {
    const userLang = req.user?.languagePreference || "en";
    const categories = await ChatCategory.find();

    const localizedCategories = categories.map((cat) => ({
      _id: cat._id,
      image: cat.image,
      title: cat.title?.[userLang] || cat.title?.en,
      description: cat.description?.[userLang] || cat.description?.en,
    }));

    res.status(200).json(localizedCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single category by ID — localized
export const getCategoryById = async (req, res) => {
  try {
    const category = await ChatCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    const userLang = req.user?.languagePreference || "en";

    const localizedCategory = {
      _id: category._id,
      image: category.image,
      title: category.title?.[userLang] || category.title?.en,
      description: category.description?.[userLang] || category.description?.en,
    };

    res.status(200).json(localizedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a category by ID
export const updateCategory = async (req, res) => {
  try {
    const { image, title, description } = req.body;
    const updatedCategory = await ChatCategory.findByIdAndUpdate(
      req.params.id,
      { image, title, description },
      { new: true, runValidators: true }
    );
    if (!updatedCategory) return res.status(404).json({ error: "Category not found" });
    res.status(200).json({ message: "Chat category updated successfully", category: updatedCategory });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a category by ID
export const deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await ChatCategory.findByIdAndDelete(req.params.id);
    if (!deletedCategory) return res.status(404).json({ error: "Category not found" });
    res.status(200).json({ message: "Chat category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Chat within a category
export const categoryChat = async (req, res) => {
  try {
    const { category, message } = req.body;
    if (!category || !message) {
      return res.status(400).json({ error: "Category and message are required" });
    }

    const { reply, correctedInput } = await getCategoryChatResponse(category, message, req.user._id);

    const chatRecord = new ChatHistory({
      user: req.user._id,
      category,
      userMessage: message,
      botReply: reply,
      correctedInput,
    });

    await chatRecord.save();

    res.status(200).json({ reply, correctedInput });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get chat history for a user (optionally by category)
export const getChatHistory = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const history = await ChatHistory.find(filter).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
