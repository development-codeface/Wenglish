import fs from "fs";
import User from "../models/user.model.js";
import { transcribeAudio } from "../services/sst.Service.js";
import {
  evaluatePronunciation,
  evaluateUnclearPronunciation
} from "../services/llmService.js";
import { synthesizeToBase64 } from "../services/ttsService.js";

/**
 * POST /api/pronunciation/check
 */
export const checkPronunciation = async (req, res) => {
  let audioPath;

  try {
    const userId = req.user.id;
    const audioFile = req.file;
    const targetWord = req.body.word?.trim();

    if (!audioFile) {
      return res.status(400).json({ message: "Audio file required" });
    }

    if (!targetWord) {
      return res.status(400).json({ message: "Target word is required" });
    }

    audioPath = audioFile.path;

    // 🔹 User preferences
    const user = await User.findById(userId).lean();
    const learningLang =
      req.body.language || user?.languagePreference || "en";
    const nativeLang = user?.nativeLanguage || "en";

    // 1️⃣ Speech → Text
    const transcript = await transcribeAudio(audioPath, learningLang);

    // 2️⃣ If transcript unclear → LLM guidance only
    if (!transcript || transcript.trim().length < 2) {
      const feedback = await evaluateUnclearPronunciation({
        targetWord,
        learningLang,
        nativeLang
      });

      cleanup(audioPath);

      return res.json({
        targetWord,
        transcript: "",
        feedback,
        referenceAudio: null,
        status: "success"
      });
    }

    // 3️⃣ Normal pronunciation evaluation
    let feedback = await evaluatePronunciation({
      transcript,
      targetWord,
      learningLang,
      nativeLang
    });

    // 4️⃣ If LLM response invalid → fallback to LLM again
    if (!feedback || typeof feedback.score !== "number") {
      feedback = await evaluateUnclearPronunciation({
        targetWord,
        learningLang,
        nativeLang
      });
    }

    // 5️⃣ Correct pronunciation audio (always target word)
    const referenceAudio = await synthesizeToBase64(
      targetWord,
      mapLangToTTSCode(learningLang)
    );

    cleanup(audioPath);

    return res.json({
      targetWord,
      transcript,
      feedback,
      referenceAudio,
      status: "success"
    });

  } catch (err) {
    console.error("Pronunciation Error:", err);
    if (audioPath) cleanup(audioPath);

    return res.status(500).json({
      message: "Pronunciation check failed"
    });
  }
};

/* ------------------ Helpers ------------------ */

function cleanup(filePath) {
  fs.unlink(filePath, () => {});
}

function mapLangToTTSCode(lang) {
  return {
    en: "en-US",
    ml: "ml-IN",
    hi: "hi-IN",
    ta: "ta-IN",
    te: "te-IN",
    kn: "kn-IN"
  }[lang] || "en-US";
}
