import Performance from "../models/perfomance.model.js";
import SubTopicAtoZ from "../models/subtopicAtoZ.model.js";
import Quiz from "../models/quiz.model.js";
import Lesson from "../models/lessons.model.js";

export const getUserPerformanceSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { moduleType, topicId } = req.query; 
    const userLang = req.user?.languagePreference || "en";

    const filter = { user: userId };

    // Optional filter by module type (quiz / atoz / lesson)
    if (moduleType) filter.moduleType = moduleType;

    // Optional filter: topicId → only for A-Z (subtopics)
    if (topicId) {
      const subTopics = await SubTopicAtoZ.find({ topicId }).select("_id");
      filter.moduleId = { $in: subTopics.map(s => s._id) };
    }

    const performances = await Performance.find(filter)
      .sort({ updatedAt: -1 });

    if (!performances.length) {
      return res.status(200).json({
        message: "No performance data found",
        stats: {
          totalItems: 0,
          correctCount: 0,
          totalScore: 0,
          accuracy: 0,
          avgScore: 0
        },
        details: []
      });
    }

    const totalItems = performances.length;
    const correctCount = performances.filter(p => p.isCorrect).length;
    const totalScore = performances.reduce((sum, p) => sum + p.score, 0);
    const accuracy = Math.round((correctCount / totalItems) * 100);
    const avgScore = Math.round(totalScore / totalItems);

    // Fetch module details for each performance
    const details = [];

    for (let p of performances) {
      let moduleData = null;

      if (p.moduleType === "atoz") {
        const sub = await SubTopicAtoZ.findById(p.moduleId).lean();
        if (sub) {
          moduleData = {
            question: sub.question?.[userLang] || sub.question?.en,
            fullWord: sub.fullWord?.[userLang] || sub.fullWord?.en,
            imageUrl: sub.imageUrl
          };
        }
      }

      if (p.moduleType === "quiz") {
        const quiz = await Quiz.findById(p.moduleId).lean();
        if (quiz) {
          moduleData = {
            question: quiz.question?.[userLang] || quiz.question?.en,
            imageUrl: quiz.imageUrl
          };
        }
      }

      if (p.moduleType === "lesson") {
        const lesson = await Lesson.findById(p.moduleId).lean();
        if (lesson) {
          moduleData = {
            title: lesson.title?.[userLang] || lesson.title?.en,
            description: lesson.description?.[userLang] || lesson.description?.en,
            videoUrl: lesson.videoUrl?.[userLang] || lesson.videoUrl?.en
          };
        }
      }

      details.push({
        moduleType: p.moduleType,
        moduleId: p.moduleId,

        userAnswer: p.userAnswer,
        correctAnswer: p.correctAnswer,

        score: p.score,
        accuracy: p.accuracy,
        isCorrect: p.isCorrect,
        timeTaken: p.timeTaken,
        updatedAt: p.updatedAt,

        ...moduleData
      });
    }

    res.status(200).json({
      message: "Performance summary generated successfully",
      stats: {
        totalItems,
        correctCount,
        totalScore,
        accuracy,
        avgScore
      },
      details
    });

  } catch (error) {
    console.error("Performance Summary Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getPerformanceByModule = async (req, res) => {
  try {
    const userId = req.user._id;
    const { moduleType } = req.query;
    const userLang = req.user?.languagePreference || "en";

    if (!moduleType) {
      return res.status(400).json({
        status: false,
        message: "moduleType is required (atoz, quiz, lesson)"
      });
    }

    const validModules = ["atoz", "quiz", "lesson"];
    if (!validModules.includes(moduleType)) {
      return res.status(400).json({
        status: false,
        message: "Invalid moduleType. Must be atoz, quiz, or lesson."
      });
    }

    // Get all performance entries for this moduleType
    const performances = await Performance.find({
      user: userId,
      moduleType
    }).sort({ updatedAt: -1 });

    if (!performances.length) {
      return res.status(200).json({
        status: true,
        message: "No performance available for this module type",
        data: []
      });
    }

    const result = [];

    for (let p of performances) {
      let moduleData = null;

      if (moduleType === "atoz") {
        const sub = await SubTopicAtoZ.findById(p.moduleId).lean();
        if (sub) {
          moduleData = {
            question: sub.question?.[userLang] || sub.question?.en,
            fullWord: sub.fullWord?.[userLang] || sub.fullWord?.en,
            imageUrl: sub.imageUrl
          };
        }
      }

      if (moduleType === "quiz") {
        const quiz = await Quiz.findById(p.moduleId).lean();
        if (quiz) {
          moduleData = {
            question: quiz.question?.[userLang] || quiz.question?.en,
            imageUrl: quiz.imageUrl
          };
        }
      }

      if (moduleType === "lesson") {
        const lesson = await Lesson.findById(p.moduleId).lean();
        if (lesson) {
          moduleData = {
            title: lesson.title?.[userLang] || lesson.title?.en,
            description: lesson.description?.[userLang] || lesson.description?.en,
            videoUrl: lesson.videoUrl?.[userLang] || lesson.videoUrl?.en,
            thumbnail: lesson.thumbnail
          };
        }
      }

      result.push({
        performanceId: p._id,
        moduleId: p.moduleId,
        moduleType: p.moduleType,

        isCorrect: p.isCorrect,
        score: p.score,
        accuracy: p.accuracy,
        timeTaken: p.timeTaken,
        updatedAt: p.updatedAt,

        userAnswer: p.userAnswer,
        correctAnswer: p.correctAnswer,

        ...moduleData
      });
    }

    return res.status(200).json({
      status: true,
      message: "Performance fetched successfully",
      count: result.length,
      data: result
    });

  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};