import  Quiz from "../models/quiz.model.js";

export const createQuiz = async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all quizzes
export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get quiz by ID
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update quiz
export const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
//submit answer to quiz
export const submitAnswer = async (req, res) => {
  try {
    const { quizId, selectedAnswers } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const correctSet = new Set(quiz.correctAnswers.map(a => a.toLowerCase()));
    const selectedSet = new Set(selectedAnswers.map(a => a.toLowerCase()));

    const isCorrect =
      correctSet.size === selectedSet.size &&
      [...correctSet].every(ans => selectedSet.has(ans));

    if (isCorrect) {
      return res.status(200).json({
        message: "Correct answer!",
        next: true,
      });
    } else {
      return res.status(200).json({
        message: "Incorrect answer. Try again.",
        next: false,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
