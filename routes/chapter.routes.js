import express from "express";
import { createChapter, getAllChapters } from "../controller/chapter.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createChapter);
router.get("/", authMiddleware, getAllChapters);

export default router;
