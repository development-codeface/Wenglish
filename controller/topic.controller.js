import Topic from "../models/topic.model.js";

// Create a new topic
export const createTopic = async (req, res) => {
  try {
    const topic = new Topic(req.body);
    await topic.save();
    res.status(201).json({ message: "Topic created successfully", topic });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all topics
export const getAllTopics = async (req, res) => {
  try {
    const userLang = req.user?.languagePreference || "en";
    const topics = await Topic.find().sort({ createdAt: -1 });

    const localizedTopics = topics.map((topic) => ({
      _id: topic._id,
      title: topic.title?.[userLang] || topic.title?.en,
      description: topic.description?.[userLang] || topic.description?.en,
      imageUrl: topic.imageUrl,
      createdAt: topic.createdAt,
    }));

    res.status(200).json(localizedTopics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get topic by ID
export const getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    const userLang = req.user?.languagePreference || "en";

    const localizedTopic = {
      _id: topic._id,
      title: topic.title?.[userLang] || topic.title?.en,
      description: topic.description?.[userLang] || topic.description?.en,
      imageUrl: topic.imageUrl,
      createdAt: topic.createdAt,
    };

    res.status(200).json(localizedTopic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update topic
export const updateTopic = async (req, res) => {
  try {
    const updatedTopic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedTopic) return res.status(404).json({ message: "Topic not found" });
    res.status(200).json({ message: "Topic updated successfully", updatedTopic });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete topic
export const deleteTopic = async (req, res) => {
  try {
    const deletedTopic = await Topic.findByIdAndDelete(req.params.id);
    if (!deletedTopic) return res.status(404).json({ message: "Topic not found" });
    res.status(200).json({ message: "Topic deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
