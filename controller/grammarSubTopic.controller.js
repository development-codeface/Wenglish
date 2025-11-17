import GrammarSubtopic from "../models/grammerSubTopic.model.js";
import Topic from "../models/topic.model.js";
import { getGrammarTutorResponse } from "../services/llmService.js";
import GrammarChatHistory from "../models/grammerChatHistory.model.js";

export const createGrammarSubtopic = async (req, res) => {
  try {
    const { topicId } = req.body;

    const topicExists = await Topic.findById(topicId);
    if (!topicExists) return res.status(404).json({ message: "Topic not found" });

    let title = JSON.parse(req.body.title);
    let description = JSON.parse(req.body.description);
    const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : "";

    const subtopic = new GrammarSubtopic({ topicId, title, description, imageUrl });
    await subtopic.save();

    res.status(201).json({ message: "Grammar subtopic created successfully", subtopic });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getGrammarSubtopics = async (req, res) => {
  try {
    const userLang = req.user?.nativeLanguage || "en";
    const { topicId } = req.query;

    const filter = topicId ? { topicId } : {};
    const subtopics = await GrammarSubtopic.find(filter).sort({ createdAt: -1 });

    const localized = subtopics.map(s => ({
      _id: s._id,
      title: s.title[userLang] || s.title.en,
      description: s.description[userLang] || s.description.en,
      imageUrl: s.imageUrl,
      createdAt: s.createdAt
    }));

    res.status(200).json(localized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteGrammarSubtopic = async (req, res) => {
  try {
    const deleted = await GrammarSubtopic.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Subtopic not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllGrammarSubtopicsAllLanguages = async (req, res) => {
  try {
    const subtopics = await GrammarSubtopic.find()
      .populate("topicId", "title description imageUrl");

    res.status(200).json({
      status: true,
      message: "Grammar Subtopics (All languages)",
      data: subtopics.map(s => ({
        _id: s._id,
        topicId: s.topicId?._id,
        title: s.title,            
        description: s.description, 
        imageUrl: s.imageUrl,
        createdAt: s.createdAt
      }))
    });

  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

export const updateGrammarSubtopic = async (req, res) => {
  try {
    const { id } = req.params;

    const subtopic = await GrammarSubtopic.findById(id);
    if (!subtopic) {
      return res.status(404).json({ message: "Subtopic not found" });
    }

    // Parse multilingual fields only if received
    let title = req.body.title ? JSON.parse(req.body.title) : subtopic.title;
    let description = req.body.description
      ? JSON.parse(req.body.description)
      : subtopic.description;

    // Replace image only if new one uploaded
    const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : subtopic.imageUrl;

    // Apply updates
    subtopic.title = title;
    subtopic.description = description;
    subtopic.imageUrl = imageUrl;

    if (req.body.topicId) {
      const topicExists = await Topic.findById(req.body.topicId);
      if (!topicExists) return res.status(404).json({ message: "Topic not found" });
      subtopic.topicId = req.body.topicId;
    }

    await subtopic.save();

    res.status(200).json({
      message: "Grammar subtopic updated successfully",
      subtopic,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const grammarChat = async (req, res) => {
  try {
    const { subtopicId, message } = req.body;
    const userId = req.user?.id;

    if (!subtopicId || !message) {
      return res.status(400).json({ message: "subtopicId and message are required" });
    }

    // Get subtopic for storing readable name
    const subtopic = await GrammarSubtopic.findById(subtopicId);
    if (!subtopic) {
      return res.status(404).json({ message: "Subtopic not found" });
    }

    const subtopicName = subtopic.title?.en || "Grammar";

    const { reply, correctedInput } = await getGrammarTutorResponse(
      subtopicId,
      message,
      userId
    );

    // Save chat into GrammarChatHistory
    await GrammarChatHistory.create({
      user: userId,
      subtopicId,
      subtopicName,
      userMessage: message,
      botReply: reply,
      correctedInput: correctedInput || null,
    });

    res.status(200).json({ reply, correctedInput });

  } catch (error) {
    console.error("Grammar Chat Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getGrammarChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subtopicId } = req.query;

    const filter = { user: userId };

    // If subtopicId is given, filter by it
    if (subtopicId) {
      filter.subtopicId = subtopicId;
    }

    const history = await GrammarChatHistory
      .find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      count: history.length,
      history
    });

  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};



