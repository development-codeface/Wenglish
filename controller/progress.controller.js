import UserProgress from "../models/userProgress.model.js";
import Chapter from "../models/chapter.model.js";
import Lesson from "../models/lessons.model.js";

export const initializeUserProgress = async (userId) => {
  const firstChapter = await Chapter.findOne().sort({ order: 1 });
  const firstLesson = await Lesson.findOne({ chapterId: firstChapter._id }).sort({ order: 1 });

  const progress = new UserProgress({
    userId,
    unlockedChapters: [firstChapter._id],
    unlockedLessons: [firstLesson._id],
    completedLessons: [],
  });
  await progress.save();
};
