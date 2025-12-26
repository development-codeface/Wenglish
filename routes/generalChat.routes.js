import express from "express";
import { generalChat,getGeneralChatHistory,getGeneralChatHistoryById, resetGeneralChat,generalChatVoice } from "../controller/generalChat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import multer from "multer";
import { checkPronunciation } from "../controller/pronounciation.controller.js";
const router = express.Router();

const upload = multer({
  dest: "uploads/audio/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

router.post("/chat", authMiddleware, generalChat);
router.post("/chat/voice", authMiddleware, generalChatVoice);
router.get("/history", authMiddleware, getGeneralChatHistory);
router.get("/history/:id", authMiddleware, getGeneralChatHistoryById);
router.post("/voice", authMiddleware, upload.single("audio"), generalChatVoice);

export default router;
