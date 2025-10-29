import ChatCategory from '../models/chatCategories.model.js';
import { getCategoryChatResponse } from '../services/llmService.js';
import ChatHistory from '../models/chatHistory.model.js'; 


// Create a new chat category
export const createCategory = async (req, res) => {
  try {
    const { image, title, description } = req.body;
    const newCategory = new ChatCategory({ image, title, description });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all chat categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await ChatCategory.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await ChatCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.status(200).json(category);
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
    if (!updatedCategory) return res.status(404).json({ error: 'Category not found' });
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a category by ID
export const deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await ChatCategory.findByIdAndDelete(req.params.id);
    if (!deletedCategory) return res.status(404).json({ error: 'Category not found' });
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Chat within a category
export const categoryChat = async (req, res) => {
  try {
    const { category, message } = req.body;
    if (!category || !message) {
      return res.status(400).json({ error: 'Category and message are required' });
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


export const getChatHistory = async (req, res) => {
  try {
    const filter = { user: req.user._id }; 
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const history = await ChatHistory.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
