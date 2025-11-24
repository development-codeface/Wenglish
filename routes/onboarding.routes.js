import express from "express";
import {
  addQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getUserAnswers,
  submitAnswer,
  getAllQuestionsAllLanguages,
  getUserQuestionAnswers
} from "../controller/onboarding.controller.js";
import { adminMiddleware, authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadImages } from "../middlewares/upload.Instance.js";

const router = express.Router();

router.post("/",authMiddleware,adminMiddleware,uploadImages.none(), addQuestion);        
router.get("/",authMiddleware, getAllQuestions);     
router.get("/all",authMiddleware, getAllQuestionsAllLanguages); 
router.get("/user/:id",authMiddleware, getUserQuestionAnswers);
router.get("/:id",authMiddleware, getQuestionById); 
router.put("/:id",authMiddleware,adminMiddleware, updateQuestion);  
router.delete("/:id",authMiddleware,adminMiddleware, deleteQuestion);
router.get("/user/answers",authMiddleware, getUserAnswers);
router.post("/user/submit-answer",authMiddleware, submitAnswer);

export default router;
