import SubTopicAtoZ from "../models/subtopicAtoZ.model.js";
import Topic from "../models/topic.model.js";

// Create a new subtopic
export const createSubTopic = async (req, res) => {
  try {
    const { topicId } = req.body;

    const topicExists = await Topic.findById(topicId);
    if (!topicExists) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : "";

    const subTopic = new SubTopicAtoZ({
      topicId,
      question: JSON.parse(req.body.question),
      correctAnswers: JSON.parse(req.body.correctAnswers),
      fullWord: JSON.parse(req.body.fullWord),
      imageUrl,
    });

    await subTopic.save();
    res.status(201).json({ message: "Subtopic created successfully", subTopic });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};


// Get all subtopics (localized by user language)
export const getAllSubTopics = async (req, res) => {
  try {
    const filter = req.query.topicId ? { topicId: req.query.topicId } : {};
    const subTopics = await SubTopicAtoZ.find(filter)
      .populate("topicId", "title description imageUrl")
      .sort({ createdAt: -1 });

    const userLang = req.user?.languagePreference || "en";

    const localizedSubTopics = subTopics.map((s) => ({
      _id: s._id,
      question: s.question?.[userLang] || s.question?.en,
      correctAnswers: s.correctAnswers?.[userLang] || s.correctAnswers?.en,
      fullWord: s.fullWord?.[userLang] || s.fullWord?.en,
      imageUrl: s.imageUrl,
      topic: {
        title: s.topicId?.title,
        description: s.topicId?.description,
        imageUrl: s.topicId?.imageUrl,
      },
    }));

    res.status(200).json(localizedSubTopics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllSubTopicsAllLanguages = async (req, res) => {
  try {
    const filter = req.query.topicId ? { topicId: req.query.topicId } : {};

    const subTopics = await SubTopicAtoZ.find(filter)
      .populate("topicId", "title description imageUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      message: "Sub-topics returned with all languages",
      subTopics: subTopics.map((s) => ({
        _id: s._id,
        topicId: s.topicId?._id,
        question: s.question,        
        correctAnswers: s.correctAnswers,
        fullWord: s.fullWord,
        imageUrl: s.imageUrl,
        topic: s.topicId
          ? {
              _id: s.topicId._id,
              title: s.topicId.title,     
              description: s.topicId.description,
              imageUrl: s.topicId.imageUrl,
            }
          : null,
      })),
    });

  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};


// Get subtopic by ID (localized)
export const getSubTopicById = async (req, res) => {
  try {
    const subTopic = await SubTopicAtoZ.findById(req.params.id).populate("topicId");
    if (!subTopic) return res.status(404).json({ message: "Subtopic not found" });

    const userLang = req.user?.languagePreference || "en";

    const localized = {
      _id: subTopic._id,
      question: subTopic.question?.[userLang] || subTopic.question?.en,
      correctAnswers: subTopic.correctAnswers?.[userLang] || subTopic.correctAnswers?.en,
      fullWord: subTopic.fullWord?.[userLang] || subTopic.fullWord?.en,
      imageUrl: subTopic.imageUrl,
      topic: {
        title: subTopic.topicId?.title,
        description: subTopic.topicId?.description,
        imageUrl: subTopic.topicId?.imageUrl,
      },
    };

    res.status(200).json(localized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update subtopic
export const updateSubTopic = async (req, res) => {
  try {
    const existing = await SubTopicAtoZ.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Subtopic not found" });

    const imageUrl = req.file
      ? `/uploads/images/${req.file.filename}`
      : existing.imageUrl;

    const updatedData = {
      topicId: req.body.topicId || existing.topicId,
      question: req.body.question ? JSON.parse(req.body.question) : existing.question,
      correctAnswers: req.body.correctAnswers
        ? JSON.parse(req.body.correctAnswers)
        : existing.correctAnswers,
      fullWord: req.body.fullWord
        ? JSON.parse(req.body.fullWord)
        : existing.fullWord,
      imageUrl,
    };

    const updated = await SubTopicAtoZ.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: "Subtopic updated successfully", updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Delete subtopic
export const deleteSubTopic = async (req, res) => {
  try {
    const deleted = await SubTopicAtoZ.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Subtopic not found" });
    res.status(200).json({ message: "Subtopic deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Answer a subtopic question (auto-localized)
export const answerSubTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedWord } = req.body;

    const userLang = req.user?.languagePreference || "en";

    const subTopic = await SubTopicAtoZ.findById(id);
    if (!subTopic) {
      return res.status(404).json({ message: "Subtopic not found" });
    }

    // Get correct answer (localized)
    const correctAnswer =
      subTopic.correctAnswers?.[userLang] || subTopic.correctAnswers?.en || "";

    // Compare user input with correct answer
    const isCorrect =
      selectedWord?.trim().toLowerCase() ===
      correctAnswer?.trim().toLowerCase();

    const fullWord =
      subTopic.fullWord?.[userLang] || subTopic.fullWord?.en || "";

    res.status(200).json({
      subTopicId: subTopic._id,
      selectedWord,
      correctAnswer,
      fullWord,
      userLanguage: userLang,
      isCorrect,
      message: isCorrect
        ? "Correct answer!"
        : `Incorrect. The correct missing part is "${correctAnswer}", forming the word "${fullWord}".`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
