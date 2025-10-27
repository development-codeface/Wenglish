import Lesson from "../models/lessons.model.js";
import Chapter from "../models/chapter.model.js";
import UserProgress from "../models/userProgress.model.js";

export const createLesson = async (req, res) => {
  try {
    const {
      chapterId,
      title,
      description,
      videoUrl,
      thumbnail,
      question,
      correctAnswer,
      order,
      options,
    } = req.body;
    const lesson = new Lesson({
      chapterId,
      title,
      description,
      videoUrl,
      thumbnail,
      question,
      correctAnswer,
      order,
      options,
    });
    await lesson.save();
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLessonsByChapter = async (req, res) => {
  const { chapterId } = req.params;
  const userId = req.user.id;

  const progress = await UserProgress.findOne({ userId });
  const lessons = await Lesson.find({ chapterId }).sort({ order: 1 });

  const lessonsWithLock = lessons.map((lesson) => ({
    ...lesson._doc,
    locked: !progress?.unlockedLessons.includes(lesson._id),
  }));

  res.json(lessonsWithLock);
};

export const answerLessonQuestion = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { answer } = req.body;
    const userId = req.user.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const isCorrect =
      lesson.correctAnswer.trim().toLowerCase() ===
      String(answer).trim().toLowerCase();
    if (!isCorrect)
      return res.json({ correct: false, message: "Wrong answer" });

    let progress = await UserProgress.findOne({ userId });
    if (!progress) progress = await initializeUserProgress(userId);

    if (!progress.completedLessons.includes(lesson._id))
      progress.completedLessons.push(lesson._id);

    // Unlock next lesson
    const nextLesson = await Lesson.findOne({
      chapterId: lesson.chapterId,
      order: lesson.order + 1,
    });
    if (nextLesson && !progress.unlockedLessons.includes(nextLesson._id))
      progress.unlockedLessons.push(nextLesson._id);
    else if (!nextLesson) {
      // Last lesson → unlock next chapter + first lesson
      const currentChapter = await Chapter.findById(lesson.chapterId);

      const nextChapter = await Chapter.findOne({
        order: currentChapter.order + 1,
      });
      if (nextChapter && !progress.unlockedChapters.includes(nextChapter._id))
        progress.unlockedChapters.push(nextChapter._id);

      const firstLesson = await Lesson.findOne({
        chapterId: nextChapter?._id,
      }).sort({ order: 1 });
      if (firstLesson && !progress.unlockedLessons.includes(firstLesson._id))
        progress.unlockedLessons.push(firstLesson._id);
    }

    await progress.save();
    res.json({ correct: true, message: "Correct! Progress saved." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const {
      title,
      description,
      videoUrl,
      thumbnail,
      question,
      options,
      correctAnswer,
      order,
    } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // Validate options if they are being updated
    if (options) {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ message: "Options must contain at least two choices" });
      }

      // Ensure correct answer is part of the updated options
      if (correctAnswer && !options.includes(correctAnswer)) {
        return res.status(400).json({ message: "Correct answer must be one of the options" });
      }

      lesson.options = options;
    }

    if (title) lesson.title = title;
    if (description) lesson.description = description;
    if (videoUrl) lesson.videoUrl = videoUrl;
    if (thumbnail) lesson.thumbnail = thumbnail;
    if (question) lesson.question = question;
    if (correctAnswer) lesson.correctAnswer = correctAnswer;
    if (order !== undefined) lesson.order = order;

    await lesson.save();

    res.status(200).json({ message: "Lesson updated successfully", lesson });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

