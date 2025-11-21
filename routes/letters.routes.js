import express from "express";
import {
  saveLetters,
  getAllLetters,
  generateAllLetters,
  getLettersByLanguage
} from "../controller/letters.controller.js";

const router = express.Router();

router.post("/", saveLetters);
router.post("/generate", generateAllLetters);
router.get("/", getAllLetters);
router.get("/:lang", getLettersByLanguage);

export default router;
