import Topic from "../models/topic.model.js";

// Create a new topic
export const createTopic = async (req, res) => {
  try {
    let { title, description, redirect } = req.body;

    // Validate redirect
    if (!redirect || !["mcq", "topic"].includes(redirect)) {
      return res.status(400).json({ message: "redirect must be 'mcq' or 'topic'" });
    }

    // Parse JSON input (in case it's sent as form-data)
    if (typeof title === "string") title = JSON.parse(title);
    if (typeof description === "string") description = JSON.parse(description);

    const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : "";

    const topic = new Topic({
      title,
      description,
      imageUrl,
      redirect,
    });

    await topic.save();

    res.status(201).json({
      message: "Topic created successfully",
      topic,
    });
  } catch (error) {
    console.error("Error creating topic:", error);
    res.status(400).json({ message: error.message });
  }
};


// Get all topics (localized)
export const getAllTopics = async (req, res) => {
  try {
    const userLang = req.user?.nativeLanguage || "en";
    const topics = await Topic.find().sort({ createdAt: -1 });

    const localizedTopics = topics.map((topic) => ({
      _id: topic._id,
      title: topic.title?.[userLang] || topic.title?.en,
      description: topic.description?.[userLang] || topic.description?.en,
      imageUrl: topic.imageUrl,
      redirect: topic.redirect,
      createdAt: topic.createdAt,
    }));

    res.status(200).json(localizedTopics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all topics with all languages
export const getAllTopicsAllLnag = async (req, res) => {
  try {
    const topics = await Topic.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      message: "Topics returned with all languages",
      topics: topics.map((topic) => ({
        _id: topic._id,
        title: topic.title,
        description: topic.description,
        imageUrl: topic.imageUrl,
        redirect: topic.redirect,
        createdAt: topic.createdAt,
      })),
    });

  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};


// Get topic by ID (localized)
export const getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    const userLang = req.user?.nativeLanguage || "en";

    const localizedTopic = {
      _id: topic._id,
      title: topic.title?.[userLang] || topic.title?.en,
      description: topic.description?.[userLang] || topic.description?.en,
      imageUrl: topic.imageUrl,
      redirect: topic.redirect,
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
    const { id } = req.params;
    let updates = {};

    if (req.body.title) updates.title = JSON.parse(req.body.title);
    if (req.body.description) updates.description = JSON.parse(req.body.description);
    if (req.body.redirect && ["mcq", "topic"].includes(req.body.redirect)) {
      updates.redirect = req.body.redirect;
    }

    if (req.file) updates.imageUrl = `/uploads/images/${req.file.filename}`;

    const updatedTopic = await Topic.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      omitUndefined: true,
    });

    if (!updatedTopic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    res.status(200).json({
      message: "Topic updated successfully",
      topic: updatedTopic,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
