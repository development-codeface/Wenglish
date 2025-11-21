import SubTopicAtoZ from "../models/subtopicAtoZ.model.js";
import Topic from "../models/topic.model.js";
import Letters from "../models/letter.model.js";
import Performance from "../models/perfomance.model.js";

const safeParse = (input, fallback = {}) => {
  if (!input || input === "undefined" || input === "null") return fallback;
  try {
    return JSON.parse(input);
  } catch {
    return fallback;
  }
};


export const createSubTopic = async (req, res) => {
  try {
    const { topicId } = req.body;

    // Topic validation
    const topicExists = await Topic.findById(topicId);
    if (!topicExists)
      return res.status(404).json({ message: "Topic not found" });

    const question = safeParse(req.body.question, {});
    const correctAnswersText = safeParse(req.body.correctAnswers, {}); // comes as text
    const fullWord = safeParse(req.body.fullWord, {});
    const hint = safeParse(req.body.hint, {});

    const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : "";

    // --- Convert Text → Letter ID for each language ---
    const correctAnswers = {};

    for (const lang of Object.keys(correctAnswersText)) {
      const letterText = correctAnswersText[lang];

      if (!letterText || !letterText.trim()) {
        correctAnswers[lang] = null;
        continue;
      }

      // Find matching letter
      const letterDoc = await Letters.findOne({ [lang]: letterText }).lean();

      if (letterDoc) {
        correctAnswers[lang] = letterDoc._id; // store ID
      } else {
        correctAnswers[lang] = null; // or throw error
      }
    }

    const subTopic = new SubTopicAtoZ({
      topicId,
      question,
      correctAnswers, // now contains IDs
      fullWord,
      hint,
      imageUrl
    });

    await subTopic.save();

    res.status(201).json({
      message: "Subtopic created successfully",
      subTopic
    });

  } catch (error) {
    console.error("Create SubTopic Error:", error);
    res.status(400).json({ message: error.message });
  }
};



export const getAllSubTopics = async (req, res) => {
  try {
    const filter = req.query.topicId ? { topicId: req.query.topicId } : {};

    // Fetch subtopics
    const subTopics = await SubTopicAtoZ.find(filter)
      .populate("topicId", "title description imageUrl")
      .sort({ createdAt: -1 });

    const userLang = req.user?.languagePreference || "en";
    const nativeLang = req.user?.nativeLanguage || "en";

    // Fetch all letters sorted
    const allLetters = await Letters.find().sort({ position: 1 }).lean();

    console.log(nativeLang);
    

    const preferredLang = allLetters
      .map((l) => ({
        id: l._id,
        value: l[userLang] || ""
      }))
      .filter((item) => item.value && item.value.trim() !== "");

    // Build direct array (NO wrapper)
    const result = subTopics.map((s) => ({
      _id: s._id,
      question: s.question?.[userLang] || s.question?.en,
      fullWord: s.fullWord?.[userLang] || s.fullWord?.en,
      hint: s.hint?.[nativeLang] || s.hint?.en,
      correctAnswer: s.correctAnswers?.[userLang] || s.correctAnswers?.en,
      imageUrl: s.imageUrl,
      topic: s.topicId
        ? {
            title: s.topicId.title?.[userLang] || s.topicId.title?.en,
            description:
              s.topicId.description?.[userLang] ||
              s.topicId.description?.en,
            imageUrl: s.topicId.imageUrl
          }
        : null,
      letters: preferredLang
    }));

    res.status(200).json(result);

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
      subTopics
    });

  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};



export const getSubTopicById = async (req, res) => {
  try {
    const subTopic = await SubTopicAtoZ.findById(req.params.id)
      .populate("topicId");

    if (!subTopic) {
      return res.status(404).json({ message: "Subtopic not found" });
    }

    const userLang = req.user?.languagePreference || "en";
    const nativeLang = req.user?.nativeLanguage || "en";

    // Get letters sorted correctly
    const allLetters = await Letters.find().sort({ position: 1 }).lean();

    // Only return letters in user's native language
    const letters = allLetters
      .map((l) => ({
        id: l._id,
        value: l[userLang] || ""
      }))
      .filter((item) => item.value && item.value.trim() !== "");

    // Build final response object (NO 'formatted' wrapper)
    const result = {
      _id: subTopic._id,
      question: subTopic.question?.[userLang] || subTopic.question?.en,
      fullWord: subTopic.fullWord?.[userLang] || subTopic.fullWord?.en,
      hint: subTopic.hint?.[nativeLang] || subTopic.hint?.en,
      correctAnswer: subTopic.correctAnswers?.[userLang] || subTopic.correctAnswers?.en,
      imageUrl: subTopic.imageUrl,
      topic: subTopic.topicId
        ? {
            _id: subTopic.topicId._id,
            title: subTopic.topicId.title?.[userLang] || subTopic.topicId.title?.en,
            description:
              subTopic.topicId.description?.[userLang] ||
              subTopic.topicId.description?.en,
            imageUrl: subTopic.topicId.imageUrl
          }
        : null,
      letters
    };

    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const updateSubTopic = async (req, res) => {
  try {
    const existing = await SubTopicAtoZ.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Subtopic not found" });
    }

    const imageUrl =
      req.file ? `/uploads/images/${req.file.filename}` : existing.imageUrl;

    const updatedData = {
      topicId: req.body.topicId || existing.topicId,
      question: safeParse(req.body.question, existing.question),
      correctAnswers: safeParse(req.body.correctAnswers, existing.correctAnswers), // TEXT
      fullWord: safeParse(req.body.fullWord, existing.fullWord),
      hint: safeParse(req.body.hint, existing.hint),
      imageUrl
    };

    const updated = await SubTopicAtoZ.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Subtopic updated successfully",
      updated
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const deleteSubTopic = async (req, res) => {
  try {
    const deleted = await SubTopicAtoZ.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Subtopic not found" });
    }

    res.status(200).json({ message: "Subtopic deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const answerSubTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedLetterId } = req.body;
    const userLang = req.user?.languagePreference || "en";
    const userId = req.user?._id;

    const subTopic = await SubTopicAtoZ.findById(id);
    if (!subTopic) {
      return res.status(404).json({ message: "Subtopic not found" });
    }

    // Correct answer ID for this language
    const correctLetterId = subTopic.correctAnswers[userLang] || subTopic.correctAnswers.en;

    if (!correctLetterId) {
      return res.status(400).json({ message: "Correct answer ID missing" });
    }

    // Fetch correct letter document
    const correctLetter = await Letters.findById(correctLetterId).lean();

    if (!correctLetter) {
      return res.status(400).json({ message: "Correct letter not found in DB" });
    }

    // Compare IDs
    const isCorrect = selectedLetterId === correctLetterId.toString();

    // Save performance
    await Performance.create({
      user: userId,
      moduleType: "atoz",
      moduleId: id,
      score: isCorrect ? 1 : 0,
      total: 1,
      accuracy: isCorrect ? 100 : 0,
      userAnswer: { selectedLetterId },
      correctAnswer: { correctLetterId },
      isCorrect,
      timeTaken: req.body.timeTaken || 0
    });

    res.status(200).json({
      subTopicId: id,
      selectedLetterId,
      correctLetterId,
      correctValue: correctLetter[userLang] || correctLetter.en,
      isCorrect,
      message: isCorrect
        ? "Correct!"
        : `Incorrect. Correct letter is "${correctLetter[userLang] || correctLetter.en}".`
    });

  } catch (err) {
    console.error("Answer error:", err);
    res.status(500).json({ message: err.message });
  }
};


