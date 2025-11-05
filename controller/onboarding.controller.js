import Question from "../models/onboardingQstns.model.js";
import UserAnswer from "../models/onboardingUserAnswer.model.js";

// Create Question
export const addQuestion = async (req, res) => {
  try {
    let { questionText, icon } = req.body;
    let { options } = req.body;

    // Handle form-data formats
    if (typeof options === "string") {
      try {
        const parsed = JSON.parse(options);
        if (Array.isArray(parsed)) {
          options = parsed;
        } else {
          options = [options];
        }
      } catch {
        // Treat as simple string if not JSON
        options = [options];
      }
    }

    // Convert plain values or arrays to structured options
    const formattedOptions = Array.isArray(options)
      ? options.map((opt) => {
          if (typeof opt === "string") {
            // Accept comma-separated "text,icon" format for form-data simplicity
            const [text, optIcon] = opt.split(",").map((s) => s.trim());
            return { text, icon: optIcon || "" };
          }
          return opt; // if already an object
        })
      : [];

    if (!questionText || formattedOptions.length < 2) {
      return res
        .status(400)
        .json({ message: "Please provide question text and at least two options." });
    }

    const newQuestion = await Question.create({
      questionText,
      icon,
      options: formattedOptions,
    });

    res.status(201).json({
      message: "Question added successfully",
      question: newQuestion,
    });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Questions
export const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: "Questions fetched successfully",
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Question by ID
export const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({
      message: "Question fetched successfully",
      question,
    });
  } catch (error) {
    console.error("Error fetching question by ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Question
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    let { questionText, icon } = req.body;
    let { options } = req.body;

    if (typeof options === "string") {
      try {
        const parsed = JSON.parse(options);
        if (Array.isArray(parsed)) {
          options = parsed;
        } else {
          options = [options];
        }
      } catch {
        options = [options];
      }
    }

    const formattedOptions = Array.isArray(options)
      ? options.map((opt) => {
          if (typeof opt === "string") {
            const [text, optIcon] = opt.split(",").map((s) => s.trim());
            return { text, icon: optIcon || "" };
          }
          return opt;
        })
      : [];

    if (!questionText || formattedOptions.length < 2) {
      return res
        .status(400)
        .json({ message: "Please provide question text and at least two options." });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { questionText, icon, options: formattedOptions },
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({
      message: "Question updated successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Question
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedQuestion = await Question.findByIdAndDelete(id);

    if (!deletedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({
      message: "Question deleted successfully",
      deletedQuestion,
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionId, answers } = req.body;

    if (!questionId || !answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "Question ID and at least one answer are required." });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    const saved = await UserAnswer.findOneAndUpdate(
      { userId, questionId },
      { answers },
      { new: true, upsert: true }
    );

    res.status(200).json({
      status: true,
      message: "Answer saved successfully",
      answer: saved,
    });

  } catch (error) {
    console.error("Error saving answer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserAnswers = async (req, res) => {
  try {
    const userId = req.user.id;

    const answers = await UserAnswer.find({ userId })
      .populate("questionId", "questionText icon");

    res.status(200).json({
      status: true,
      message: "User answers fetched successfully",
      answers,
    });

  } catch (error) {
    console.error("Error fetching answers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


