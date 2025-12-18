import mongoose from "mongoose";
import Lesson from "../models/lessons.model.js";
import Chapter from "../models/chapter.model.js";
import UserProgress from "../models/userProgress.model.js";
import User from "../models/user.model.js";
import { initializeUserProgress } from "./progress.controller.js";
import fs from "fs";
import Performance from "../models/perfomance.model.js";
// Helpers
const parseIfJson = (value) => {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
};

const translate = (value, lang) => {
  const parsed = parseIfJson(value);
  if (typeof parsed === "string") return parsed;
  if (typeof parsed === "object" && parsed !== null) {
    return parsed[lang] || parsed.en || "";
  }
  return "";
};

// Create Lesson
export const createLesson = async (req, res) => {
  try {
    let {
      chapterId,
      title,
      description,
      question,
      correctAnswer,
      order,
      options,
    } = req.body;

    title = parseIfJson(title);
    description = parseIfJson(description);
    question = parseIfJson(question);
    correctAnswer = parseIfJson(correctAnswer);
    options = parseIfJson(options) || [];

    options = options.map((opt) => ({
      optionId: opt.optionId || new mongoose.Types.ObjectId(),
      ...opt,
    }));

    // Collect videos per language
    const videoUrl = {
      en: req.files?.video_en?.[0]?.path || "",
      ml: req.files?.video_ml?.[0]?.path || "",
      ta: req.files?.video_ta?.[0]?.path || "",
      te: req.files?.video_te?.[0]?.path || "",
      hi: req.files?.video_hi?.[0]?.path || "",
      kn: req.files?.video_kn?.[0]?.path || "",
    };

    const thumbnail = req.files?.thumbnail?.[0]?.path || "";

    const lesson = await Lesson.create({
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

    return res.status(201).json({ status: true, message: "Lesson created", lesson });

  } catch (err) {
    return res.status(400).json({ status: false, message: err.message });
  }
};


//Get Lessons (User View - Only Preferred Language)
export const getLessonsByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const nativeLang = user?.nativeLanguage || "en";      // User mother tongue
    const preferredLang = user?.languagePreference || "en"; // Study language

    const progress = await UserProgress.findOne({ userId });

    const lessons = await Lesson.find({ chapterId }).sort({ order: 1 });

    const lessonsResponse = lessons.map((lesson) => {
      const correctOpt = lesson.options.find(o => o.en === lesson.correctAnswer.en);

      return {
        _id: lesson._id,
        order: lesson.order,

        title: {
          native: translate(lesson.title, nativeLang),
          preferred: translate(lesson.title, preferredLang)
        },

        description: {
          native: translate(lesson.description, nativeLang),
          preferred: translate(lesson.description, preferredLang)
        },

        question: {
          native: translate(lesson.question, nativeLang),
          preferred: translate(lesson.question, preferredLang)
        },

        options: lesson.options.map((opt) => ({
          optionId: opt.optionId,
          native: translate(opt, nativeLang),
          preferred: translate(opt, preferredLang)
        })),

        correctAnswer: correctOpt
          ? {
              optionId: correctOpt.optionId,
              native: translate(correctOpt, nativeLang),
              preferred: translate(correctOpt, preferredLang)
            }
          : null,

        videoUrl: lesson.videoUrl,
        thumbnail: lesson.thumbnail,

        locked:
          lesson.order === 1
            ? false
            : !progress?.unlockedLessons.includes(lesson._id)
      };
    });

    return res.status(200).json({
      status: true,
      message: "Lessons returned",
      lessons: lessonsResponse
    });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};


// Get Lessons (Admin / Full View)
export const getLessonsByChapterAll = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;

    const progress = await UserProgress.findOne({ userId });
    const chapter = await Chapter.findById(chapterId);
    const lessons = await Lesson.find({ chapterId }).sort({ order: 1 });

    if (!chapter) {
      return res.status(404).json({ status: false, message: "Chapter not found" });
    }

    const chapterResponse = {
      _id: chapter._id,
      order: chapter.order,
      title: chapter.title,     // include all languages
      intro: chapter.intro,     // include all languages
    };

    const lessonsResponse = lessons.map((lesson) => ({
      _id: lesson._id,
      chapterId: lesson.chapterId,
      order: lesson.order,
      title: lesson.title,              // all languages
      description: lesson.description,  // all languages
      question: lesson.question,        // all languages
      options: lesson.options.map((opt) => ({
        optionId: opt.optionId,
        en: opt.en,
        ml: opt.ml,
        ta: opt.ta,
        te: opt.te,
        hi: opt.hi,
        kn: opt.kn
      })),
      correctAnswer: lesson.correctAnswer,  // multilingual correct answer
      videoUrl: lesson.videoUrl,            // multilingual URLs
      thumbnail: lesson.thumbnail,
      locked: lesson.order === 1 ? false : !progress?.unlockedLessons.includes(lesson._id)
    }));

    return res.status(200).json({
      status: true,
      message: "All language data returned successfully",
      chapter: chapterResponse,
      lessons: lessonsResponse
    });

  } catch (err) {
    console.error("Error in getLessonsByChapterAll:", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};


// Answer Submission (Check by optionId only)
export const answerLessonQuestion = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { optionId } = req.body;
    const userId = req.user.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const correctOption = lesson.options.find(
      (o) => o.en === lesson.correctAnswer.en
    );

    if (!correctOption)
      return res.status(500).json({ message: "Correct answer not found" });

    const isCorrect =
      String(correctOption.optionId) === String(optionId);

    // 👉 Save Lesson Performance
    await Performance.create({
      user: userId,
      moduleType: "lesson",
      moduleId: lessonId,
      score: isCorrect ? 1 : 0,
      total: 1,
      accuracy: isCorrect ? 100 : 0,
      userAnswer: { optionId },
      correctAnswer: { optionId: correctOption.optionId },
      isCorrect,
      timeTaken: req.body.timeTaken || 0
    });

    // ✨ Continue your progress logic
    if (!isCorrect)
      return res.json({ correct: false, message: "Wrong answer" });

    let progress = await UserProgress.findOne({ userId });
    if (!progress) progress = await initializeUserProgress(userId);

    if (!progress.completedLessons.includes(lesson._id))
      progress.completedLessons.push(lesson._id);

    const nextLesson = await Lesson.findOne({
      chapterId: lesson.chapterId,
      order: lesson.order + 1,
    });

    if (nextLesson && !progress.unlockedLessons.includes(nextLesson._id)) {
      progress.unlockedLessons.push(nextLesson._id);
    }

    await progress.save();

    return res.json({ correct: true, message: "Correct!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Update Lesson
export const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ status: false, message: "Not found" });

    const parse = (v) => (typeof v === "string" ? JSON.parse(v) : v);

    if (req.body.title) lesson.title = parse(req.body.title);
    if (req.body.description) lesson.description = parse(req.body.description);
    if (req.body.question) lesson.question = parse(req.body.question);
    if (req.body.correctAnswer) lesson.correctAnswer = parse(req.body.correctAnswer);

    if (req.body.options) {
      let options = parse(req.body.options);
      options = options.map((opt) => ({
        optionId: opt.optionId || new mongoose.Types.ObjectId(),
        ...opt,
      }));
      lesson.options = options;
    }

    //  Update per-language videos only if replaced
    const videoFields = {
      en: "video_en",
      ml: "video_ml",
      ta: "video_ta",
      te: "video_te",
      hi: "video_hi",
      kn: "video_kn",
    };

    for (const lang in videoFields) {
      const field = videoFields[lang];
      if (req.files?.[field]?.[0]?.path) {
        lesson.videoUrl[lang] = req.files[field][0].path;
      }
    }

    //  Update thumbnail
    if (req.files?.thumbnail?.[0]?.path) {
      lesson.thumbnail = req.files.thumbnail[0].path;
    }

    if (req.body.order) lesson.order = req.body.order;

    await lesson.save();
    return res.status(200).json({ status: true, message: "Lesson updated", lesson });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};


//  Delete Lesson
export const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid lesson ID",
      });
    }

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "Lesson not found",
      });
    }

    await Lesson.findByIdAndDelete(id);

    return res.json({
      status: true,
      message: "Lesson deleted successfully",
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

