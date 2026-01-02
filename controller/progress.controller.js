import UserProgress from "../models/userProgress.model.js";
import Chapter from "../models/chapter.model.js";
import Lesson from "../models/lessons.model.js";

export const initializeUserProgress = async (userId) => {
  if (!userId) {
    throw new Error("initializeUserProgress: userId is required");
  }

  // Prevent duplicate progress creation
  const existingProgress = await UserProgress.findOne({ userId });
  if (existingProgress) {
    return existingProgress;
  }

  // Try to find first chapter (may not exist yet)
  const firstChapter = await Chapter.findOne().sort({ order: 1 });

  // Try to find first lesson ONLY if chapter exists
  let firstLesson = null;
  if (firstChapter) {
    firstLesson = await Lesson.findOne({
      chapterId: firstChapter._id,
    }).sort({ order: 1 });
  }

  // Create progress safely with fallbacks
  const progress = await UserProgress.create({
    userId,
    unlockedChapters: firstChapter ? [firstChapter._id] : [],
    unlockedLessons: firstLesson ? [firstLesson._id] : [],
    completedLessons: [],
    isInitialized: Boolean(firstChapter && firstLesson),
  });

  if (!progress?._id) {
    throw new Error("initializeUserProgress: Progress creation failed");
  }

  return progress;
};

