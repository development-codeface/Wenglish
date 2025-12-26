import express from "express";
import multer from "multer";
import { checkPronunciation } from "../controller/pronounciation.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Multer config for audio upload
const upload = multer({
  dest: "uploads/audio/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// POST /api/pronunciation/check
router.post(
  "/check",
  authMiddleware,
  upload.single("audio"),
  checkPronunciation
);

export default router;
