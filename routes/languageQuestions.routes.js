import express from "express";
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionsByLangType,
} from "../controller/languageQuestion.controller.js";

const router = express.Router();

// CREATE
router.post("/", createQuestion);

// GET ALL
router.get("/", getQuestions);

// GET BY LANG TYPE
router.get("/langType/:langType", getQuestionsByLangType);

// GET BY ID
router.get("/:id", getQuestionById);

// UPDATE
router.put("/:id", updateQuestion);

// DELETE
router.delete("/:id", deleteQuestion);

export default router;
