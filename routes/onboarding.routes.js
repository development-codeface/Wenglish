import express from "express";
import {
  addQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
} from "../controller/onboarding.controller.js";
import { adminMiddleware, authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadImages } from "../middlewares/upload.Instance.js";

const router = express.Router();

router.post("/",authMiddleware,adminMiddleware,uploadImages.none(), addQuestion);        
router.get("/", getAllQuestions);     
router.get("/:id", getQuestionById); 
router.put("/:id",authMiddleware,adminMiddleware, updateQuestion);  
router.delete("/:id",authMiddleware,adminMiddleware, deleteQuestion); 

export default router;
