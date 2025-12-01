import express from "express";
import {
  createLanguage,
  getLanguages,
  getActiveLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage,
  getLanguagesExceptEnglish
} from "../controller/language.controller.js";

const router = express.Router();

// POST
router.post("/", createLanguage);

// GET
router.get("/", getLanguages);
router.get("/except-english", getLanguagesExceptEnglish);
router.get("/active", getActiveLanguages);
router.get("/:id", getLanguageById);

// PUT
router.put("/:id", updateLanguage);

// DELETE
router.delete("/:id", deleteLanguage);

export default router;