import Quiz from "../models/quiz.model.js";
import User from "../models/user.model.js";

// Create quiz (multilingual)
export const createQuiz = async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all quizzes (localized based on user preference)
export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    const user = await User.findById(req.user.id);
    const lang = user?.languagePreference || "en";

    const localized = quizzes.map((q) => ({
      _id: q._id,
      question: q.question?.[lang] || q.question?.en || "",
      options: q.options.map((opt) => opt?.[lang] || opt?.en || ""),
      correctAnswer: q.correctAnswer?.[lang] || q.correctAnswer?.en || "",
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    }));

    res.status(200).json(localized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get quiz by ID (localized)
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const user = await User.findById(req.user.id);
    const lang = user?.languagePreference || "en";

    const localizedQuiz = {
      _id: quiz._id,
      question: quiz.question?.[lang] || quiz.question?.en || "",
      options: quiz.options.map((opt) => opt?.[lang] || opt?.en || ""),
      correctAnswer: quiz.correctAnswer?.[lang] || quiz.correctAnswer?.en || "",
    };

    res.status(200).json(localizedQuiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update quiz
export const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.status(200).json({ message: "Quiz updated successfully", quiz });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete quiz
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit answer
export const submitAnswer = async (req, res) => {
  try {
    const { quizId, selectedAnswer } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const user = await User.findById(req.user.id);
    const lang = user?.languagePreference || "en";

    const correctAnswer =
      quiz.correctAnswer?.[lang]?.trim().toLowerCase() ||
      quiz.correctAnswer?.en?.trim().toLowerCase();

    const selected =
      String(selectedAnswer).trim().toLowerCase();

    const isCorrect = correctAnswer === selected;

    res.status(200).json({
      correct: isCorrect,
      message: isCorrect ? "Correct answer!" : "Incorrect answer. Try again.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
