import Chapter from "../models/chapter.model.js";
import Lesson from "../models/lessons.model.js";
import User from "../models/user.model.js";
import UserProgress from "../models/userProgress.model.js";

const translate = (value, lang) => {
  const parsed = parseIfJson(value);
  if (typeof parsed === "string") return parsed;
  if (typeof parsed === "object" && parsed !== null) {
    return parsed[lang] || parsed.en || "";
  }
  return "";
};

const parseIfJson = (value) => {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
};

export const createChapter = async (req, res) => {
  try {
    let { title, intro, order } = req.body;
    const thumbnail = req.file ? `/uploads/images/${req.file.filename}` : null;

    // Auto-parse JSON if sent as a string in form-data
    try {
      if (typeof title === "string") title = JSON.parse(title);
    } catch {
      console.warn("Invalid title JSON, using raw string");
      title = { en: title };
    }

    try {
      if (typeof intro === "string") intro = JSON.parse(intro);
    } catch {
      console.warn("Invalid intro JSON, using raw string");
      intro = { en: intro };
    }

    // Ensure order is a number
    const orderNum = Number(order);
    if (isNaN(orderNum)) {
      return res.status(400).json({ message: "Order must be a valid number." });
    }

    const chapter = new Chapter({ title, intro, order: orderNum, thumbnail });
    await chapter.save();

    res.status(201).json({
      status: true,
      message: "Chapter created successfully",
      chapter,
    });
  } catch (err) {
    console.error("Error creating chapter:", err);
    res.status(500).json({ status: false, message: err.message });
  }
};

export const getAllChapters = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const userLang = user.languagePreference || "en";

    const chapters = await Chapter.find().sort({ order: 1 });

    const localizedChapters = chapters.map((chapter, index) => ({
  _id: chapter._id,
  order: chapter.order,
  title: chapter.title[userLang] || chapter.title.en,
  intro: chapter.intro[userLang] || chapter.intro.en,
  locked: index === 0 ? false : true, 
}));

    res.status(200).json({
      message: `Chapters in ${userLang}`,
      chapters: localizedChapters,
      status: true,
    });
  } catch (err) {
    console.error("Error fetching chapters:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getAllChaptersWithLessons = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const userLang = user.languagePreference || "en";

    const progress = await UserProgress.findOne({ userId });

    // Fetch all chapters and lessons
    const chapters = await Chapter.find().sort({ order: 1 }).lean();
    const lessons = await Lesson.find().sort({ order: 1 }).lean();

    // Group lessons by chapterId
    const lessonsByChapter = lessons.reduce((acc, lesson) => {
      const chapId = lesson.chapterId?.toString();
      if (!chapId) return acc;

      const safeText = (obj, lang = "en") =>
        typeof obj === "string" ? obj : (obj && (obj[lang] || obj.en)) || "";

      acc[chapId] = acc[chapId] || [];
      acc[chapId].push({
        _id: lesson._id,
        order: lesson.order,
        title: safeText(lesson.title, userLang),
        description: safeText(lesson.description, userLang),
        videoUrl: lesson.videoUrl || "",
        thumbnail: lesson.thumbnail || "",
        question: safeText(lesson.question, userLang),
       options: lesson.options.map((opt) => ({
        optionId: opt.optionId,
        text: translate(opt, userLang)
      })),
        correctAnswer: safeText(lesson.correctAnswer, userLang),
        locked:
    lesson.order === 1
      ? false
      : !progress?.unlockedLessons.includes(lesson._id),
      });
      return acc;
    }, {});

    // Combine chapters with their lessons
    const data = chapters.map((chapter) => ({
      _id: chapter._id,
      order: chapter.order,
      title:
        typeof chapter.title === "string"
          ? chapter.title
          : chapter.title?.[userLang] || chapter.title?.en || "",
      intro:
        typeof chapter.intro === "string"
          ? chapter.intro
          : chapter.intro?.[userLang] || chapter.intro?.en || "",
      lessons: lessonsByChapter[chapter._id.toString()] || [],
    }));

    res.status(200).json({
      status: true,
      message: `Chapters and lessons in ${userLang}`,
      chapters: data,
    });
  } catch (err) {
    console.error("Error fetching chapters with lessons:", err);
    res.status(500).json({ status: false, message: err.message });
  }
};

export const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, intro, order } = req.body;
    const thumbnail = req.file
      ? `/uploads/images/${req.file.filename}`
      : undefined;

    // Build update object dynamically
    const updateData = {};
    if (title) updateData.title = title;
    if (intro) updateData.intro = intro;
    if (order) updateData.order = order;
    if (thumbnail) updateData.thumbnail = thumbnail;

    const updatedChapter = await Chapter.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedChapter) {
      return res
        .status(404)
        .json({ message: "Chapter not found", status: false });
    }

    res.status(200).json({
      status: true,
      message: "Chapter updated successfully",
      chapter: updatedChapter,
    });
  } catch (err) {
    console.error("Error updating chapter:", err);
    res.status(500).json({ status: false, message: err.message });
  }
};

export const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedChapter = await Chapter.findByIdAndDelete(id);

    if (!deletedChapter) {
      return res
        .status(404)
        .json({ status: false, message: "Chapter not found" });
    }

    await Lesson.deleteMany({ chapterId: id });

    res.status(200).json({
      status: true,
      message: "Chapter and related lessons deleted successfully",
      chapterId: id,
    });
  } catch (err) {
    console.error("Error deleting chapter:", err);
    res.status(500).json({ status: false, message: err.message });
  }
};

export const getAllChaptersAllLang = async (req, res) => {
  try {
    const userId = req.user?.id;
    let userLang = "en";

    if (userId) {
      const user = await User.findById(userId).select("languagePreference");
      if (user && user.languagePreference) {
        userLang = user.languagePreference;
      }
    }

    // Fetch all chapters sorted by order
    const chapters = await Chapter.find().sort({ order: 1 });

    if (!chapters.length) {
      return res.status(404).json({
        status: false,
        message: "No chapters found",
        chapters: [],
      });
    }

    // Return full multilingual data for each chapter
    const allLanguageChapters = chapters.map((chapter) => ({
      _id: chapter._id,
      order: chapter.order,
      title: chapter.title,
      intro: chapter.intro,
      thumbnail: chapter.thumbnail || null,
    }));

    res.status(200).json({
      status: true,
      message: `All chapters returned (user preferred language: ${userLang})`,
      chapters: allLanguageChapters,
    });
  } catch (err) {
    console.error("Error fetching chapters:", err);
    res.status(500).json({ status: false, message: err.message });
  }
};
