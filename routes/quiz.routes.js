import express from "express";
import {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  submitAnswer,
} from "../controller/quiz.controller.js";
import { adminMiddleware, authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/",authMiddleware, adminMiddleware, createQuiz);
router.get("/",authMiddleware, getAllQuizzes);
router.get("/:id",authMiddleware, getQuizById);
router.put("/:id",authMiddleware, adminMiddleware,updateQuiz);
router.delete("/:id",authMiddleware,adminMiddleware, deleteQuiz);
router.post("/submit", authMiddleware,submitAnswer);

export default router;
