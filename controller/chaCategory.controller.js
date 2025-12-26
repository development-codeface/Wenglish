import ChatCategory from "../models/chatCategories.model.js";
import { getCategoryChatResponse } from "../services/llmService.js";
import ChatHistory from "../models/chatHistory.model.js";
import mongoose from "mongoose";

// Create a new chat category 
export const createCategory = async (req, res) => {
  try {
    let { title, description } = req.body;

    // Parse multilingual fields if sent as JSON strings
    if (typeof title === "string") title = JSON.parse(title);
    if (typeof description === "string") description = JSON.parse(description);

    if (!title?.en || !description?.en) {
      return res.status(400).json({
        error: "English (en) title and description are required",
      });
    }

    const newCategory = new ChatCategory({
      image: req.file ? `/uploads/images/${req.file.filename}` : "",
      title,
      description,
    });

    await newCategory.save();
    res.status(201).json({
      message: "Chat category created successfully",
      category: newCategory,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all chat categories — localized for user's preferred language
export const getAllCategories = async (req, res) => {
  try {
    const nativeLang = req.user?.nativeLanguage || "en";
    const preferredLang = req.user?.languagePreference || "en";

    const categories = await ChatCategory.find();

    const localized = categories.map((cat) => ({
      _id: cat._id,
      image: cat.image,

      // return only these two language values
      title: {
        native: cat.title?.[nativeLang] || cat.title?.en,
        preferred: cat.title?.[preferredLang] || cat.title?.en
      },

      description: {
        native: cat.description?.[nativeLang] || cat.description?.en,
        preferred: cat.description?.[preferredLang] || cat.description?.en
      }
    }));

    res.status(200).json(localized);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getAllCategoriesAllLang = async (req, res) => {
  try {
    const categories = await ChatCategory.find().lean();

    const formatted = categories.map((cat) => ({
      _id: cat._id,
      image: cat.image,
      title: typeof cat.title === "object" ? cat.title : { en: cat.title },
      description: typeof cat.description === "object" ? cat.description : { en: cat.description }
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};


// Get a single category by ID — localized
export const getCategoryById = async (req, res) => {
  try {
    const category = await ChatCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    const userLang = req.user?.nativeLanguage || "en";

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
    const { id } = req.params;
    let { title, description } = req.body;

    if (typeof title === "string") title = JSON.parse(title);
    if (typeof description === "string") description = JSON.parse(description);

    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
    };

    if (req.file) {
      updateData.image = `/uploads/images/${req.file.filename}`;
    }

    const updatedCategory = await ChatCategory.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCategory)
      return res.status(404).json({ error: "Category not found" });

    res.status(200).json({
      message: "Chat category updated successfully",
      category: updatedCategory,
    });
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
    const { categoryId, message } = req.body;

    if (!categoryId || !message) {
      return res.status(400).json({
        error: "Category ID and message are required",
      });
    }

    const user = req.user;
    const language = user?.preferredLanguage || "en";

    const category = await ChatCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const categoryName = category.title?.[language] || category.title?.en;

    const {
      reply,
      correctedInput,
      preferred,
      native
    } = await getCategoryChatResponse(categoryName, message, user._id);

    // Save to DB
    const chatRecord = new ChatHistory({
      user: user._id,
      category: categoryId,
      categoryName,
      userMessage: message,
      correctedInput,
      preferred: reply.preferred,
      native: reply.native
    });

    await chatRecord.save();

    // Return flat fields
    return res.status(200).json({
      preferred: reply.preferred,
      native: reply.native,
      correctedInput
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};





// Get chat history for a user (optionally by category)
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const filter = { user: new mongoose.Types.ObjectId(userId) };

    // Convert category filter to ObjectId if provided
    if (req.query.category) {
      filter.category = new mongoose.Types.ObjectId(req.query.category);
    }

    const history = await ChatHistory.aggregate([
      { $match: filter },

      // Sort newest → oldest INSIDE each category
      { $sort: { createdAt: 1 } },

      {
        $group: {
          _id: "$category",
          chats: {
            $push: {
              _id: "$_id",
              userMessage: "$userMessage",
              correctedInput: "$correctedInput",
              preferred: "$preferred",
              native: "$native",
              categoryName: "$categoryName",
              createdAt: "$createdAt"
            }
          }
        }
      },

      {
        $project: {
          category: "$_id",
          chats: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json(history);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getChatHistoryById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({ message: "categoryId is required" });
    }

    // Convert string → ObjectId
    const categoryObjectId = new mongoose.Types.ObjectId(category);

    const history = await ChatHistory.find({
      user: userId,
      category: categoryObjectId
    })
      .sort({ createdAt: -1 })
      .select("userMessage correctedInput preferred native categoryName createdAt");

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
