import express from "express";
import { createChapter, getAllChapters,getAllChaptersWithLessons,deleteChapter,updateChapter,getAllChaptersAllLang } from "../controller/chapter.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadImages } from "../middlewares/upload.Instance.js";

const router = express.Router();

router.post("/", authMiddleware,uploadImages.single("thumbnail"), createChapter);
router.get("/", authMiddleware, getAllChapters);
router.get("/with-lessons", authMiddleware, getAllChaptersWithLessons);
router.put("/:id", authMiddleware,uploadImages.single("thumbnail"), updateChapter);
router.delete("/:id", authMiddleware, deleteChapter);
router.get("/all-languages", authMiddleware, getAllChaptersAllLang);

export default router;
