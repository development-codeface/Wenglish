import express from "express";
import {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  deleteTopic
} from "../controller/topic.controller.js";
import { adminMiddleware, authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/",authMiddleware,adminMiddleware, createTopic);
router.get("/",authMiddleware, getAllTopics);
router.get("/:id",authMiddleware, getTopicById);
router.put("/:id",authMiddleware,adminMiddleware, updateTopic);
router.delete("/:id",authMiddleware,adminMiddleware, deleteTopic);

export default router;
