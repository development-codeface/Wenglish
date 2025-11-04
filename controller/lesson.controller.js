import Lesson from "../models/lessons.model.js";
import Chapter from "../models/chapter.model.js";
import UserProgress from "../models/userProgress.model.js";
import User from "../models/user.model.js";
import { initializeUserProgress } from "./progress.controller.js";

export const createLesson = async (req, res) => {
  try {
    let {
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

    // Parse all JSON fields if they are strings
    title = typeof title === "string" ? JSON.parse(title) : title;
    description =
      typeof description === "string" ? JSON.parse(description) : description;
    question = typeof question === "string" ? JSON.parse(question) : question;
    correctAnswer =
      typeof correctAnswer === "string"
        ? JSON.parse(correctAnswer)
        : correctAnswer;
    options = typeof options === "string" ? JSON.parse(options) : options;

    // Handle uploaded files if any
    if (req.files?.videoUrl) {
      videoUrl = req.files.videoUrl[0].path;
    }
    if (req.files?.thumbnail) {
      thumbnail = req.files.thumbnail[0].path;
    }

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
    res.status(201).json({ message: "Lesson created successfully", lesson });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const getLessonsByChapter = async (req, res) => {
  const { chapterId } = req.params;
  const userId = req.user.id;

  const user = await User.findById(userId);
  const language = user.languagePreference || "en";

  const progress = await UserProgress.findOne({ userId });
  const lessons = await Lesson.find({ chapterId }).sort({ order: 1 });

  const lessonsWithTranslation = lessons.map((lesson) => {
    const getText = (field) =>
      lesson[field]?.[language] || lesson[field]?.en || "";
    return {
      _id: lesson._id,
      title: getText("title"),
      description: getText("description"),
      question: getText("question"),
      options: lesson.options?.map((opt) => opt?.[language] || opt?.en || ""),
      locked: !progress?.unlockedLessons.includes(lesson._id),
    };
  });

  res.json(lessonsWithTranslation);
};

export const getLessonsByChapterAll = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;

    const progress = await UserProgress.findOne({ userId });
    const lessons = await Lesson.find({ chapterId }).sort({ order: 1 });

    const lessonsFull = lessons.map((lesson) => ({
      _id: lesson._id,
      chapterId: lesson.chapterId,
      title: lesson.title, 
      description: lesson.description,
      videoUrl: lesson.videoUrl,
      thumbnail: lesson.thumbnail,
      question: lesson.question,
      options: lesson.options, 
      correctAnswer: lesson.correctAnswer,
      order: lesson.order,
      locked: !progress?.unlockedLessons.includes(lesson._id),
    }));

    res.status(200).json({
      status: true,
      message: "Lessons returned with all languages",
      lessons: lessonsFull,
    });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};


export const answerLessonQuestion = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { answer } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const lang = user.languagePreference || "en";
    const correct = lesson.correctAnswer[lang] || lesson.correctAnswer.en;
    const isCorrect =
      correct.trim().toLowerCase() === String(answer).trim().toLowerCase();

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

    // Parse any JSON strings from multipart/form-data
    const parseField = (field) => {
      if (!field) return null;
      try {
        return typeof field === "string" ? JSON.parse(field) : field;
      } catch {
        return field;
      }
    };

    // Find the existing lesson
    const lesson = await Lesson.findById(lessonId);
    if (!lesson)
      return res.status(404).json({ message: "Lesson not found" });

    // Parse fields
    const parsedTitle = parseField(req.body.title);
    const parsedDescription = parseField(req.body.description);
    const parsedQuestion = parseField(req.body.question);
    const parsedOptions = parseField(req.body.options);
    const parsedCorrectAnswer = parseField(req.body.correctAnswer);

    // Handle options validation
    if (parsedOptions) {
      if (!Array.isArray(parsedOptions) || parsedOptions.length < 2) {
        return res
          .status(400)
          .json({ message: "Options must contain at least two choices" });
      }

      lesson.options = parsedOptions;
    }

    // Validate correctAnswer if updated
    if (parsedCorrectAnswer) {
      const correctEn = parsedCorrectAnswer.en || parsedCorrectAnswer;
      const optionEnList = parsedOptions
        ? parsedOptions.map((o) => o.en || o)
        : lesson.options.map((o) => o.en || o);

      if (!optionEnList.includes(correctEn)) {
        return res.status(400).json({
          message: "Correct answer must be one of the options",
        });
      }

      lesson.correctAnswer = parsedCorrectAnswer;
    }

    // Update multilingual text fields
    if (parsedTitle) lesson.title = parsedTitle;
    if (parsedDescription) lesson.description = parsedDescription;
    if (parsedQuestion) lesson.question = parsedQuestion;

    // Update files or keep existing URLs
    if (req.files?.videoUrl) {
      lesson.videoUrl = req.files.videoUrl[0].path;
    } else if (req.body.videoUrl && typeof req.body.videoUrl === "string") {
      lesson.videoUrl = req.body.videoUrl;
    }

    if (req.files?.thumbnail) {
      lesson.thumbnail = req.files.thumbnail[0].path;
    } else if (req.body.thumbnail && typeof req.body.thumbnail === "string") {
      lesson.thumbnail = req.body.thumbnail;
    }

    // Update order
    if (req.body.order !== undefined) {
      lesson.order = req.body.order;
    }

    await lesson.save();

    res
      .status(200)
      .json({ status: true, message: "Lesson updated successfully", lesson });
  } catch (err) {
    console.error(" Error updating lesson:", err);
    res.status(500).json({ status: false, message: err.message });
  }
};


export const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    // Find the lesson
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const removeFile = (filePath) => {
      if (!filePath) return;
      const fullPath = path.resolve(filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    };

    if (lesson.videoUrl && !lesson.videoUrl.startsWith("http")) {
      removeFile(lesson.videoUrl);
    }
    if (lesson.thumbnail && !lesson.thumbnail.startsWith("http")) {
      removeFile(lesson.thumbnail);
    }

    // Delete from database
    await lesson.deleteOne();

    res.status(200).json({ message: "Lesson deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
