import Question from "../models/question.model.js";
import Language from "../models/language.model.js";

const EMPTY_TRANSLATIONS = {
  en: "",
  ml: "",
  hi: "",
  ta: "",
  te: "",
  kn: ""
};

// CREATE QUESTION
export const createQuestion = async (req, res) => {
  try {
    const { question, langType } = req.body;

    if (!langType) {
      return res.status(400).json({ message: "langType is required" });
    }

    const questionObj = {
      ...EMPTY_TRANSLATIONS,
      ...(question || {})
    };

    const created = await Question.create({
      question: questionObj,
      langType
    });

    return res.status(201).json({ message: "Question created", question: created });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET ALL QUESTIONS
export const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find().sort("langType");
    return res.status(200).json({ questions });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET BY ID
export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    return res.status(200).json({ question });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateQuestion = async (req, res) => {
  try {
    const { question, langType } = req.body;

    const existing = await Question.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Question not found" });
    }

    const mergedTranslation = {
      ...EMPTY_TRANSLATIONS,
      ...(existing.question || {}),
      ...(question || {})
    };

    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      {
        question: mergedTranslation,
        langType: langType || existing.langType
      },
      { new: true }
    );

    return res.status(200).json({ message: "Updated", question: updated });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE
export const deleteQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ message: "Question not found" });

    await Question.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Deleted" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET QUESTIONS BY langType
export const getQuestionsByLangType = async (req, res) => {
  try {
    const { langType } = req.params;

    if (!langType) {
      return res.status(400).json({ message: "langType is required" });
    }

    // Fetch question
    const question = await Question.findOne({ langType });

    if (!question) {
      return res.status(404).json({ message: "No question found for this langType" });
    }

    // Fetch languages
    const languages = await Language.find({ isActive: true }).sort("name");

    return res.status(200).json({
      question,
      languages
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

