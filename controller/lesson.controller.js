import mongoose from "mongoose";
import Lesson from "../models/lessons.model.js";
import Chapter from "../models/chapter.model.js";
import UserProgress from "../models/userProgress.model.js";
import User from "../models/user.model.js";
import { initializeUserProgress } from "./progress.controller.js";
import fs from "fs";
import path from "path";

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

// ✅ Create Lesson
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

    title = parseIfJson(title);
    description = parseIfJson(description);
    question = parseIfJson(question);
    correctAnswer = parseIfJson(correctAnswer);
    options = parseIfJson(options);

    // Ensure optionId for each option
    options = options.map((opt) => ({
      optionId: opt.optionId || new mongoose.Types.ObjectId(),
      ...opt,
    }));

    if (req.files?.videoUrl) videoUrl = req.files.videoUrl[0].path;
    if (req.files?.thumbnail) thumbnail = req.files.thumbnail[0].path;

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
    return res.status(201).json({ status: true, message: "Lesson created", lesson });

  } catch (err) {
    return res.status(400).json({ status: false, message: err.message });
  }
};

// ✅ Get Lessons (User View - Only Preferred Language)
export const getLessonsByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;
    const user = await User.findById(userId);
    const lang = user?.languagePreference || "en";

    const progress = await UserProgress.findOne({ userId });
    const lessons = await Lesson.find({ chapterId }).sort({ order: 1 });

    const lessonsResponse = lessons.map((lesson) => {
      const correctOpt = lesson.options.find(o => o.en === lesson.correctAnswer.en);

      return {
        _id: lesson._id,
        order: lesson.order,
        title: translate(lesson.title, lang),
        description: translate(lesson.description, lang),
        question: translate(lesson.question, lang),

        options: lesson.options.map((opt) => ({
          optionId: opt.optionId,
          text: translate(opt, lang)
        })),

        correctAnswer: correctOpt ? {
          optionId: correctOpt.optionId,
          text: translate(correctOpt, lang)
        } : null,

        videoUrl: lesson.videoUrl,
        thumbnail: lesson.thumbnail,

        // ✅ Always unlock first lesson
        locked: lesson.order === 1 ? false : !progress?.unlockedLessons.includes(lesson._id),
      };
    });

    return res.status(200).json({ status: true, message: "Lessons returned", lessons: lessonsResponse });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// ✅ Get Lessons (Admin / Full View)
export const getLessonsByChapterAll = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;
    const user = await User.findById(userId);
    const lang = user?.languagePreference || "en";

    const progress = await UserProgress.findOne({ userId });
    const chapter = await Chapter.findById(chapterId);
    const lessons = await Lesson.find({ chapterId }).sort({ order: 1 });

    const chapterResponse = {
      _id: chapter._id,
      order: chapter.order,
      title: translate(chapter.title, lang),
      intro: translate(chapter.intro, lang),
    };

    const lessonsResponse = lessons.map((lesson) => {
      const correctOpt = lesson.options.find(o => o.en === lesson.correctAnswer.en);

      return {
        _id: lesson._id,
        chapterId: lesson.chapterId,
        order: lesson.order,
        title: translate(lesson.title, lang),
        description: translate(lesson.description, lang),
        question: translate(lesson.question, lang),
        options: lesson.options.map((opt) => ({
          optionId: opt.optionId,
          text: translate(opt, lang)
        })),
        correctAnswer: correctOpt ? {
          optionId: correctOpt.optionId,
          text: translate(correctOpt, lang)
        } : null,
        videoUrl: lesson.videoUrl,
        thumbnail: lesson.thumbnail,

        // ✅ First lesson always unlocked
        locked: lesson.order === 1 ? false : !progress?.unlockedLessons.includes(lesson._id),
      };
    });

    return res.status(200).json({
      status: true,
      message: "Data returned",
      chapter: chapterResponse,
      lessons: lessonsResponse,
    });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// ✅ Answer Submission (Check by optionId only)
export const answerLessonQuestion = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { optionId } = req.body;
    const userId = req.user.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const correctOption = lesson.options.find(o => o.en === lesson.correctAnswer.en);

    if (!correctOption)
      return res.status(500).json({ message: "Correct answer not found in options" });

    const isCorrect = String(correctOption.optionId) === String(optionId);

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

// ✅ Update Lesson
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

    if (req.files?.videoUrl) lesson.videoUrl = req.files.videoUrl[0].path;
    if (req.files?.thumbnail) lesson.thumbnail = req.files.thumbnail[0].path;

    if (req.body.order) lesson.order = req.body.order;

    await lesson.save();
    return res.status(200).json({ status: true, message: "Lesson updated", lesson });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// ✅ Delete Lesson
export const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const removeFile = (file) => {
      if (file && !file.startsWith("http") && fs.existsSync(file)) fs.unlinkSync(file);
    };

    removeFile(lesson.videoUrl);
    removeFile(lesson.thumbnail);

    await lesson.deleteOne();
    res.json({ status: true, message: "Lesson deleted" });

  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};
