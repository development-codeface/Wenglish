import express from "express";
import {
  saveLetters,
  getLettersByLanguage,
  getAllLetters,
  generateAllLetters
} from "../controller/letters.controller.js";

const router = express.Router();

// Save manually uploaded letters
router.post("/save", saveLetters);

// Generate letters automatically (A-Z Hindi Tamil etc)
router.post("/generate", generateAllLetters);

// Get letters for a specific language
router.get("/:lang", getLettersByLanguage);

// Get ALL multilingual letters
router.get("/", getAllLetters);

export default router;
