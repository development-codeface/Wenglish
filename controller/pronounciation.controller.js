import fs from "fs";
import User from "../models/user.model.js";
import { transcribeAudioBuffer } from "../services/sst.Service.js";
import {
  evaluatePronunciation,
  evaluateUnclearPronunciation
} from "../services/llmService.js";
import { synthesizeToBase64 } from "../services/ttsService.js";

/**
 * POST /api/pronunciation/check
 */
export const checkPronunciation = async (req, res) => {
  try {
    const userId = req.user.id;
    const audioBuffer = req.file?.buffer;
    const targetWord = req.body.word?.trim();

    /* ---------- VALIDATION ---------- */
    if (!audioBuffer) {
      return res.status(400).json({ message: "Audio file required" });
    }

    if (!targetWord) {
      return res.status(400).json({ message: "Target word is required" });
    }

    /* ---------- USER PREFS ---------- */
    const user = await User.findById(userId).lean();

    const learningLang =
      req.body.language || user?.languagePreference || "en";

    const nativeLang = user?.nativeLanguage || "en";

    /* ---------- SPEECH → TEXT ---------- */
    const transcript = await transcribeAudioBuffer(audioBuffer, {
      primaryLang: mapLangToTTSCode(learningLang),
    });

    /* ---------- UNCLEAR SPEECH ---------- */
    if (!transcript || transcript.trim().length < 2) {
      const feedback = await evaluateUnclearPronunciation({
        targetWord,
        learningLang,
        nativeLang,
      });

      return res.json({
        targetWord,
        transcript: "",
        feedback,
        referenceAudio: null,
        status: "success",
      });
    }

    /* ---------- PRONUNCIATION CHECK ---------- */
    let feedback = await evaluatePronunciation({
      transcript,
      targetWord,
      learningLang,
      nativeLang,
    });

    /* ---------- FALLBACK ---------- */
    if (!feedback || typeof feedback.score !== "number") {
      feedback = await evaluateUnclearPronunciation({
        targetWord,
        learningLang,
        nativeLang,
      });
    }

    /* ---------- REFERENCE AUDIO ---------- */
    const referenceAudio = await synthesizeToBase64(
      targetWord,
      mapLangToTTSCode(learningLang)
    );

    return res.json({
      targetWord,
      transcript,
      feedback,
      referenceAudio,
      status: "success",
    });

  } catch (err) {
    console.error("Pronunciation Error:", err);
    return res.status(500).json({
      message: "Pronunciation check failed",
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