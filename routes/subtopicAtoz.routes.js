import express from "express";
import {
  createSubTopic,
  getAllSubTopics,
  getSubTopicById,
  updateSubTopic,
  deleteSubTopic,
  answerSubTopic
} from "../controller/subtopicAtoz.controller.js";
import { adminMiddleware, authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware,adminMiddleware, createSubTopic);
router.get("/", authMiddleware, getAllSubTopics);
router.get("/:id", authMiddleware, getSubTopicById);
router.put("/:id", authMiddleware,adminMiddleware, updateSubTopic);
router.delete("/:id", authMiddleware,adminMiddleware, deleteSubTopic);
router.post("/answer/:id", authMiddleware, answerSubTopic);

export default router;
