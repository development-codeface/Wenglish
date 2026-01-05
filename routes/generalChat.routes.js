import express from "express";
import {
  generalChat,
  getGeneralChatHistory,
  getGeneralChatHistoryById,
  resetGeneralChat,
  generalChatVoice,
} from "../controller/generalChat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import multer from "multer";
import { checkPronunciation } from "../controller/pronounciation.controller.js";
import { uploadAudio } from "../middlewares/upload.Instance.js";
const router = express.Router();

router.post("/chat", authMiddleware, generalChat);
router.post("/chat/voice", authMiddleware, generalChatVoice);
router.get("/history", authMiddleware, getGeneralChatHistory);
router.get("/history/:id", authMiddleware, getGeneralChatHistoryById);
router.post(
  "/voice",
  authMiddleware,
  uploadAudio.single("audio"),
  generalChatVoice
);

export default router;
