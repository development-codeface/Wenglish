import fs from "fs";
import User from "../models/user.model.js";
import { transcribeAudio } from "../services/sst.Service.js";
import { evaluatePronunciation } from "../services/llmService.js";
import { synthesizeToBase64 } from "../services/ttsService.js";

/**
 * POST /api/pronunciation/check
 */
export const checkPronunciation = async (req, res) => {
  let audioPath;

  try {
    const userId = req.user.id;
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({ message: "Audio file required" });
    }

    audioPath = audioFile.path;

    // 🔹 User preferences
    const user = await User.findById(userId).lean();
    const learningLang =
      req.body.language || user?.languagePreference || "en";
    const nativeLang = user?.nativeLanguage || "en";

    // 1️⃣ Speech → Text (Google STT)
    const transcript = await transcribeAudio(audioPath, learningLang);

    // 🔴 Guard: empty or unclear transcript
    if (!transcript || transcript.trim().length < 2) {
      cleanup(audioPath);
      return res.json({
        transcript: transcript || "",
        feedback: fallbackFeedback(learningLang, nativeLang),
        referenceAudio: null
      });
    }

    // 2️⃣ Pronunciation Evaluation (LLM)
    let feedback = await evaluatePronunciation({
      transcript,
      learningLang,
      nativeLang
    });

    // 🔴 Guard: LLM failed / invalid JSON
    if (!feedback || typeof feedback.score !== "number") {
      feedback = fallbackFeedback(learningLang, nativeLang);
    }

    // 3️⃣ Correct Pronunciation Audio (TTS)
    const referenceAudio = await synthesizeToBase64(
      transcript,
      mapLangToTTSCode(learningLang)
    );

    cleanup(audioPath);

    return res.json({
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



