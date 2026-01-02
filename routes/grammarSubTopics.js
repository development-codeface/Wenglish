import express from "express";
import {
  createGrammarSubtopic,
  getGrammarSubtopics,
  deleteGrammarSubtopic,
  getAllGrammarSubtopicsAllLanguages,
  updateGrammarSubtopic,
  grammarChat,
  getGrammarChatHistory,
  grammarVoiceChat,
} from "../controller/grammarSubTopic.controller.js";
import { adminMiddleware, authMiddleware } from "../middlewares/auth.middleware.js";
import {uploadImages} from "../middlewares/upload.Instance.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  uploadImages.single("imageUrl"), // ✅ S3-ready
  createGrammarSubtopic
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  uploadImages.single("imageUrl"), // ✅ S3-ready
  updateGrammarSubtopic
);

router.get("/", authMiddleware, getGrammarSubtopics);
router.get("/all", authMiddleware, getAllGrammarSubtopicsAllLanguages);
router.delete("/:id", authMiddleware, adminMiddleware, deleteGrammarSubtopic);

router.post("/chat", authMiddleware, grammarChat);
router.get("/chat-history", authMiddleware, getGrammarChatHistory);
router.post(
  "/voice-chat",
  authMiddleware,
  uploadImages.single("audio"), 
  grammarVoiceChat
);

export default router;
