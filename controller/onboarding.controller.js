import Question from "../models/onboardingQstns.model.js";
import UserAnswer from "../models/onboardingUserAnswer.model.js";

// Helper for parsing multilingual fields
const parseMultilingual = (value) => {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return { en: value };
    }
  }
  return value;
};

// Create Question
export const addQuestion = async (req, res) => {
  try {
    // Multilingual fields
    let questionText = parseMultilingual(req.body.questionText);
    let options = req.body.options;

    // Handle form-data options
    if (typeof options === "string") {
      try {
        options = JSON.parse(options);
      } catch {
        options = [options];
      }
    }

    const formattedOptions = Array.isArray(options)
      ? options.map((opt) => {
          if (typeof opt === "string") {
            const [text, optIcon] = opt.split(",").map((s) => s.trim());
            return {
              text: parseMultilingual(text),
              icon: optIcon || "",
            };
          }
          return {
            text: parseMultilingual(opt.text),
            icon: opt.icon || "",
          };
        })
      : [];

    if (!questionText || formattedOptions.length < 2) {
      return res.status(400).json({
        message: "Question text and at least two options required.",
      });
    }

    const newQ = await Question.create({
      questionText,
      icon: req.body.icon || "",
      options: formattedOptions,
    });

    res.status(201).json({
      message: "Question added successfully",
      question: newQ,
    });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get All Questions (localized)
export const getAllQuestions = async (req, res) => {
  try {
    const userLang = req.user?.nativeLanguage || "en";
    const questions = await Question.find().sort({ createdAt: -1 });

    const localized = questions.map((q) => ({
      _id: q._id,
      icon: q.icon,
      questionText: q.questionText[userLang],  
      options: q.options.map((o) => ({
        _id: o._id,
        icon: o.icon,
        text: o.text[userLang],  
      })),
    }));

    console.log(userLang);
    

    res.status(200).json({
      message: "Questions fetched successfully",
      count: localized.length,
      questions: localized,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: error.message });
  }
};


// Get Question by ID (localized)
export const getQuestionById = async (req, res) => {
  try {
    const userLang = req.user?.nativeLanguage || "en";
    const { id } = req.params;

    const q = await Question.findById(id);
    if (!q) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({
      message: "Question fetched successfully",
      question: {
        _id: q._id,
        icon: q.icon,
        questionText: q.questionText[userLang],   // ⭐ only native language
        options: q.options.map((o) => ({
          _id: o._id,
          icon: o.icon,
          text: o.text[userLang],                // ⭐ only native language
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ message: error.message });
  }
};


// Update Question
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    let questionText = parseMultilingual(req.body.questionText);
    let options = req.body.options;

    if (typeof options === "string") {
      try {
        options = JSON.parse(options);
      } catch {
        options = [options];
      }
    }

    const formattedOptions = Array.isArray(options)
      ? options.map((opt) => {
          if (typeof opt === "string") {
            const [text, optIcon] = opt.split(",").map((s) => s.trim());
            return {
              text: parseMultilingual(text),
              icon: optIcon || "",
            };
          }
          return {
            text: parseMultilingual(opt.text),
            icon: opt.icon || "",
          };
        })
      : [];

    if (!questionText || formattedOptions.length < 2) {
      return res.status(400).json({
        message: "Question text and two options required.",
      });
    }

    const updated = await Question.findByIdAndUpdate(
      id,
      {
        questionText,
        icon: req.body.icon || "",
        options: formattedOptions,
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({
      message: "Question updated successfully",
      question: updated,
    });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete Question
export const deleteQuestion = async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({
      message: "Question deleted successfully",
      deleted,
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: error.message });
  }
};

// Submit Answers
export const submitAnswer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionId, answers } = req.body;

    if (!questionId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "Question ID and answers required" });
    }

    const q = await Question.findById(questionId);
    if (!q) return res.status(404).json({ message: "Question not found" });

    const validOptionIds = q.options.map((o) => o._id.toString());
    const invalid = answers.filter((a) => !validOptionIds.includes(a));

    if (invalid.length > 0) {
      return res.status(400).json({ message: "Invalid answer selection" });
    }

    const saved = await UserAnswer.findOneAndUpdate(
      { userId, questionId },
      { answers },
      { new: true, upsert: true }
    );

    res.status(200).json({
      status: true,
      message: "Answers saved successfully",
      answer: saved,
    });
  } catch (error) {
    console.error("Error saving answers:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get User Answers (localized)
export const getUserAnswers = async (req, res) => {
  try {
    const userLang = req.user?.languagePreference || "en";

    // FIX: Get correct userId
    const userId = req.user?._id || req.user?.id;

    console.log("Using user ID:", userId);

    // Query with correct userId
    const answers = await UserAnswer.find({ userId })
      .populate("questionId");

    console.log("Fetched answers:", answers);

    if (!answers.length) {
      console.log("No answers found for user:", userId);
    }

    const formatted = answers.map((a) => ({
      _id: a._id,
      questionId: a.questionId?._id,
      questionText:
        a.questionId?.questionText?.[userLang] ||
        a.questionId?.questionText?.en ||
        "No question text",
      icon: a.questionId?.icon,
      answers: a.answers,
    }));

    return res.status(200).json({
      status: true,
      message: "User answers fetched successfully",
      answers: formatted,
    });

  } catch (error) {
    console.error("Error fetching answers:", error);
    res.status(500).json({ message: error.message });
  }
};



export const getAllQuestionsAllLanguages = async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });

    const formatted = questions.map((q) => ({
      _id: q._id,
      icon: q.icon || "",
      questionText: q.questionText || {},      
      options: q.options.map((o) => ({
        _id: o._id,
        icon: o.icon || "",
        text: o.text || {}                     
      })),
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    }));

    res.status(200).json({
      status: true,
      message: "Questions returned with all languages",
      count: formatted.length,
      questions: formatted,
    });

  } catch (error) {
    console.error("Error fetching all-lang questions:", error);
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const getUserQuestionAnswers = async (req, res) => {
  try {
    console.log("Controller hit");

    const userId = req.params.id;
    console.log("Requested user ID:", userId);

    const answers = await UserAnswer.find({ userId })
      .populate({
        path: "questionId",
        populate: {
          path: "options",          // if your Question model has options
          model: "QuestionOption",
        }
      })
      .lean();

    console.log("Fetched answers:", answers);

    if (!answers.length) {
      return res.status(200).json({
        status: true,
        message: "No answers found",
        answers: [],
      });
    }

    const formatted = answers.map((a) => ({
      _id: a._id,
      questionId: a.questionId?._id,
      questionText: a.questionId?.questionText || {},
      icon: a.questionId?.icon || null,
      answers: a.answers || [],
      fullQuestion: a.questionId,
      createdAt: a.createdAt,
    }));

    return res.status(200).json({
      status: true,
      message: "User answers fetched",
      answers: formatted,
    });

  } catch (err) {
    console.error("Error fetching answers:", err);
    return res.status(500).json({ message: err.message });
  }
};