import Quiz from "../models/quiz.model.js";
import User from "../models/user.model.js";
import Performance from "../models/perfomance.model.js";

// Create quiz (multilingual + optionId handling)
export const createQuiz = async (req, res) => {
  try {
    let { question, options, correctAnswer } = req.body;

    // Ensure JSON parsing in case data sent as strings (form-data)
    try {
      question = typeof question === "string" ? JSON.parse(question) : question;
    } catch {}
    try {
      options = typeof options === "string" ? JSON.parse(options) : options;
    } catch {}
    try {
      correctAnswer =
        typeof correctAnswer === "string"
          ? JSON.parse(correctAnswer)
          : correctAnswer;
    } catch {}

    const quiz = new Quiz({
      question,
      options: options.map((opt) => ({
        optionId: opt.optionId || undefined, // auto-generated if missing
        ...opt,
      })),
      correctAnswer: {
        optionId: correctAnswer.optionId,
        ...correctAnswer,
      },
    });

    await quiz.save();
    res
      .status(201)
      .json({ status: true, message: "Quiz created successfully", quiz });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};

// Get all quizzes (localized for user)
export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    const user = await User.findById(req.user.id);
    const lang = user?.languagePreference || "en";

    const localized = quizzes.map((q) => ({
      _id: q._id,
      question: q.question?.[lang] || q.question?.en,
      options: q.options.map((opt) => ({
        optionId: opt.optionId,
        text: opt?.[lang] || opt?.en,
      })),
      correctAnswer: {
        optionId: q.correctAnswer.optionId,
        text: q.correctAnswer?.[lang] || q.correctAnswer?.en,
      },
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    }));

    res.status(200).json({ status: true, quizzes: localized });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// Get quizzes (full multilingual for admin)
export const getAllQuizzesAll = async (req, res) => {
  try {
    const quizzes = await Quiz.find().lean();

    res.status(200).json({
      status: true,
      message: "Quizzes returned in all languages",
      quizzes,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// Get quiz by ID (localized for user)
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz)
      return res.status(404).json({ status: false, message: "Quiz not found" });

    const user = await User.findById(req.user.id);
    const lang = user?.languagePreference || "en";

    const localizedQuiz = {
      _id: quiz._id,
      question: quiz.question?.[lang] || quiz.question?.en,
      options: quiz.options.map((opt) => ({
        optionId: opt.optionId,
        text: opt?.[lang] || opt?.en,
      })),
      correctAnswer: {
        optionId: quiz.correctAnswer.optionId,
        text: quiz.correctAnswer?.[lang] || quiz.correctAnswer?.en,
      },
    };

    res.status(200).json({ status: true, quiz: localizedQuiz });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// Update quiz
export const updateQuiz = async (req, res) => {
  try {
    let { question, options, correctAnswer } = req.body;

    try {
      question = typeof question === "string" ? JSON.parse(question) : question;
    } catch {}
    try {
      options = typeof options === "string" ? JSON.parse(options) : options;
    } catch {}
    try {
      correctAnswer =
        typeof correctAnswer === "string"
          ? JSON.parse(correctAnswer)
          : correctAnswer;
    } catch {}

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        question,
        options: options.map((opt) => ({
          optionId: opt.optionId || undefined,
          ...opt,
        })),
        correctAnswer,
      },
      { new: true }
    );

    if (!updatedQuiz)
      return res.status(404).json({ status: false, message: "Quiz not found" });

    res
      .status(200)
      .json({ status: true, message: "Quiz updated", quiz: updatedQuiz });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};

// Delete quiz
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz)
      return res.status(404).json({ status: false, message: "Quiz not found" });

    res
      .status(200)
      .json({ status: true, message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// Submit answer (based on optionId)
export const submitAnswer = async (req, res) => {
  try {
    const { quizId, optionId } = req.body;
    console.log(optionId);
    
    const userId = req.user.id;
    const userLang = req.user?.languagePreference || "en";

    const quiz = await Quiz.findById(quizId);
    if (!quiz)
      return res.status(404).json({
        status: false,
        message: "Quiz not found"
      });

    // --- Find correct option (matching optionId stored inside correctAnswer) ---
  const correctOption = quiz.options.find(
  opt => opt[userLang] === quiz.correctAnswer[userLang]
);


    if (!correctOption) {
      return res.status(400).json({
        status: false,
        message: "Correct answer optionId does not match any option in quiz. Data invalid."
      });
    }

    // --- Find selected option from options array ---
    const selectedOption = quiz.options.find(
      opt => String(opt.optionId) === String(optionId)
    );

    if (!selectedOption) {
      return res.status(400).json({
        status: false,
        message: "Selected optionId does not exist for this quiz."
      });
    }

    const isCorrect = String(optionId) === String(correctOption.optionId);

    // === UNIVERSAL PERFORMANCE TRACKING (same structure as A–Z) ===
    await Performance.create({
      user: userId,
      moduleType: "quiz",
      moduleId: quizId,

      score: isCorrect ? 1 : 0,
      total: 1,
      accuracy: isCorrect ? 100 : 0,

      userAnswer: {
        optionId,
        value: selectedOption[userLang] || selectedOption.en
      },

      correctAnswer: {
        optionId: correctOption.optionId,
        value: correctOption[userLang] || correctOption.en
      },

      isCorrect,
      timeTaken: req.body.timeTaken || 0
    });

    // === RESPONSE (same as A–Z style) ===
    return res.status(200).json({
      quizId,
      selectedOptionId: optionId,
      selectedValue: selectedOption[userLang] || selectedOption.en,

      correctOptionId: correctOption.optionId,
      correctValue: correctOption[userLang] || correctOption.en,

      isCorrect,
      userLanguage: userLang,

      message: isCorrect
        ? "Correct!"
        : `Incorrect. Correct answer is "${correctOption[userLang] || correctOption.en}".`
    });

  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};


