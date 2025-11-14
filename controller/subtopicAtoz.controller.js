import SubTopicAtoZ from "../models/subtopicAtoZ.model.js";
import Topic from "../models/topic.model.js";
import Performance from "../models/perfomance.model.js";
// Create a new subtopic
export const createSubTopic = async (req, res) => {
  try {
    const { topicId } = req.body;

    const topicExists = await Topic.findById(topicId);
    if (!topicExists) {
      return res.status(404).json({ message: "Topic not found" });
    }

    let question = JSON.parse(req.body.question);
    let correctAnswers = JSON.parse(req.body.correctAnswers);
    let fullWord = JSON.parse(req.body.fullWord);
    let hint = req.body.hint ? JSON.parse(req.body.hint) : {};
    let letters = req.body.letters ? JSON.parse(req.body.letters) : [];

    const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : "";

    const subTopic = new SubTopicAtoZ({
      topicId,
      question,
      correctAnswers,
      fullWord,
      hint,
      letters,
      imageUrl,
    });

    await subTopic.save();
    res.status(201).json({ message: "Subtopic created successfully", subTopic });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};


// Get all subtopics (localized)
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
      hint: s.hint?.[userLang] || s.hint?.en || "",
      letters: s.letters?.map((l) => ({
        _id: l._id,
        value: l[userLang] || l.en
      })) || [],
      imageUrl: s.imageUrl,
      topic: s.topicId
        ? {
            title: s.topicId.title?.[userLang] || s.topicId.title?.en,
            description: s.topicId.description?.[userLang] || s.topicId.description?.en,
            imageUrl: s.topicId.imageUrl
          }
        : null,
    }));

    res.status(200).json(localizedSubTopics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Return all languages (no localization)
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
        hint: s.hint,
        letters: s.letters,
        imageUrl: s.imageUrl,
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

    res.status(200).json({
      _id: subTopic._id,
      question: subTopic.question?.[userLang] || subTopic.question?.en,
      correctAnswers: subTopic.correctAnswers?.[userLang] || subTopic.correctAnswers?.en,
      fullWord: subTopic.fullWord?.[userLang] || subTopic.fullWord?.en,
      hint: subTopic.hint?.[userLang] || subTopic.hint?.en || "",
      letters: subTopic.letters?.map((l) => ({
        _id: l._id,
        value: l[userLang] || l.en
      })) || [],
      imageUrl: subTopic.imageUrl,
      topic: {
        title: subTopic.topicId?.title,
        description: subTopic.topicId?.description,
        imageUrl: subTopic.topicId?.imageUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Update subtopic
export const updateSubTopic = async (req, res) => {
  try {
    const existing = await SubTopicAtoZ.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Subtopic not found" });

    const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : existing.imageUrl;

    const updatedData = {
      topicId: req.body.topicId || existing.topicId,
      question: req.body.question ? JSON.parse(req.body.question) : existing.question,
      correctAnswers: req.body.correctAnswers ? JSON.parse(req.body.correctAnswers) : existing.correctAnswers,
      fullWord: req.body.fullWord ? JSON.parse(req.body.fullWord) : existing.fullWord,
      hint: req.body.hint ? JSON.parse(req.body.hint) : existing.hint,
      letters: req.body.letters ? JSON.parse(req.body.letters) : existing.letters,
      imageUrl,
    };

    const updated = await SubTopicAtoZ.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    });

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


// Answer a subtopic question (using letter ids)
export const answerSubTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedLetterId } = req.body; 
    const userId = req.user?._id; 
    const userLang = req.user?.languagePreference || "en";

    const subTopic = await SubTopicAtoZ.findById(id);
    if (!subTopic) {
      return res.status(404).json({ message: "Subtopic not found" });
    }

    const correctText = subTopic.correctAnswers?.[userLang] || subTopic.correctAnswers?.en;
    const correctLetter = subTopic.letters.find(
      l => (l[userLang] || l.en) === correctText
    );

    if (!correctLetter) {
      return res.status(400).json({ message: "Correct letter not found" });
    }

    const isCorrect = selectedLetterId === correctLetter._id.toString();

    // === Universal Performance Tracking ===
    await Performance.create({
      user: userId,
      moduleType: "atoz",
      moduleId: id,
      score: isCorrect ? 1 : 0,
      total: 1,
      accuracy: isCorrect ? 100 : 0,
      userAnswer: { selectedLetterId },
      correctAnswer: { correctLetterId: correctLetter._id },
      isCorrect,
      timeTaken: req.body.timeTaken || 0
    });

    return res.status(200).json({
      subTopicId: subTopic._id,
      selectedLetterId,
      correctLetterId: correctLetter._id,
      correctValue: correctLetter[userLang] || correctLetter.en,
      fullWord: subTopic.fullWord?.[userLang] || subTopic.fullWord?.en,
      userLanguage: userLang,
      isCorrect,
      message: isCorrect
        ? "Correct!"
        : `Incorrect. Correct letter is "${correctLetter[userLang] || correctLetter.en}".`
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



