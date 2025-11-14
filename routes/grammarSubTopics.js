import express from "express";
import multer from "multer";
import {
  createGrammarSubtopic,
  getGrammarSubtopics,
  deleteGrammarSubtopic,
  getAllGrammarSubtopicsAllLanguages,
  updateGrammarSubtopic,
  grammarChat,
  getGrammarChatHistory,
} from "../controller/grammarSubtopic.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/images/" });

router.post("/", upload.single("imageUrl"), createGrammarSubtopic);
router.get("/", getGrammarSubtopics);
router.get("/all", getAllGrammarSubtopicsAllLanguages);
router.put("/:id", upload.single("imageUrl"), updateGrammarSubtopic);
router.delete("/:id", deleteGrammarSubtopic);
router.post("/chat", authMiddleware,grammarChat);
router.get("/chat-history",authMiddleware, getGrammarChatHistory);


export default router;
