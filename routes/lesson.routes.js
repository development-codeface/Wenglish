import express from "express";
import {
  getLessonsByChapter,
  answerLessonQuestion,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonsByChapterAll,
} from "../controller/lesson.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadLessonMedia } from "../middlewares/upload.Instance.js";

const router = express.Router();

router.post(
  "/",
  uploadLessonMedia.fields([
    { name: "video_en", maxCount: 1 },
    { name: "video_ml", maxCount: 1 },
    { name: "video_ta", maxCount: 1 },
    { name: "video_te", maxCount: 1 },
    { name: "video_hi", maxCount: 1 },
    { name: "video_kn", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createLesson
);
router.get("/chapter/:chapterId", authMiddleware, getLessonsByChapter);
router.get("/chapter-all/:chapterId", authMiddleware, getLessonsByChapterAll);
router.post("/:lessonId/answer", authMiddleware, answerLessonQuestion);
router.put(
  "/:lessonId",
  uploadLessonMedia.fields([
    { name: "video_en", maxCount: 1 },
    { name: "video_ml", maxCount: 1 },
    { name: "video_ta", maxCount: 1 },
    { name: "video_te", maxCount: 1 },
    { name: "video_hi", maxCount: 1 },
    { name: "video_kn", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  updateLesson
);
router.delete("/:id", deleteLesson);
export default router;
