import express from "express";
import { createChapter, getAllChapters,getAllChaptersWithLessons } from "../controller/chapter.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createChapter);
router.get("/", authMiddleware, getAllChapters);
router.get("/with-lessons", authMiddleware, getAllChaptersWithLessons);

export default router;
