import UserPerformance from "../models/perfomance.model.js";
import SubTopicAtoZ from "../models/subtopicAtoZ.model.js";


export const getUserPerformanceSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { topicId } = req.query; 

    const filter = { userId };
    if (topicId) {
      const subTopics = await SubTopicAtoZ.find({ topicId }).select("_id");
      filter.subTopicId = { $in: subTopics.map((s) => s._id) };
    }

    const performances = await UserPerformance.find(filter)
      .populate("subTopicId", "question correctAnswers fullWord")
      .sort({ updatedAt: -1 });

    if (!performances.length) {
      return res.status(200).json({
        message: "No performance data found for this user",
        stats: {
          totalSubtopics: 0,
          correctCount: 0,
          totalAttempts: 0,
          accuracy: 0,
          averageScore: 0,
        },
      });
    }

    const totalSubtopics = performances.length;
    const totalAttempts = performances.reduce((sum, p) => sum + p.attempts, 0);
    const correctCount = performances.filter((p) => p.isCorrect).length;
    const totalScore = performances.reduce((sum, p) => sum + p.score, 0);

    const accuracy = Math.round((correctCount / totalSubtopics) * 100);
    const averageScore = Math.round(totalScore / totalSubtopics);

    res.status(200).json({
      message: "User performance summary calculated successfully",
      stats: {
        totalSubtopics,
        totalAttempts,
        correctCount,
        accuracy,
        totalScore,
        averageScore,
      },
      details: performances.map((p) => ({
        subTopicId: p.subTopicId?._id,
        question: p.subTopicId?.question?.en || p.subTopicId?.question,
        fullWord: p.subTopicId?.fullWord?.en || p.subTopicId?.fullWord,
        attempts: p.attempts,
        correctAttemptNumber: p.correctAttemptNumber,
        score: p.score,
        efficiency: p.efficiency,
        isCorrect: p.isCorrect,
        lastAttemptedAt: p.lastAttemptedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching performance summary:", error);
    res.status(500).json({ message: error.message });
  }
};
