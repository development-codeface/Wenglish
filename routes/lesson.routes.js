import express from "express";
import { getLessonsByChapter, answerLessonQuestion, createLesson, updateLesson } from "../controller/lesson.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js"; 

const router = express.Router();

router.post("/", createLesson);
router.get("/chapter/:chapterId", authMiddleware, getLessonsByChapter);
router.post("/:lessonId/answer", authMiddleware, answerLessonQuestion);
router.put("/:lessonId", updateLesson);

export default router;
