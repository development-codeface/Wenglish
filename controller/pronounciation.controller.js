import fs from "fs";
import User from "../models/user.model.js";
import { transcribeAudio } from "../services/sst.Service.js";
import { evaluatePronunciation } from "../services/llmService.js";
import { synthesizeToBase64 } from "../services/ttsService.js";

export const checkPronunciation = async (req, res) => {
  try {
    const userId = req.user.id;
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({ message: "Audio file required" });
    }

    const user = await User.findById(userId);
    const learningLang = user?.languagePreference || "en";
    const nativeLang = user?.nativeLanguage || "en";

    // 1) Speech → Text
    const transcript = await transcribeAudio(audioFile.path, learningLang);

    // 2) LLM feedback
    const feedback = await evaluatePronunciation({
      transcript,
      learningLang,
      nativeLang
    });

    // 3) Correct pronunciation audio
    const referenceAudio = await synthesizeToBase64(
      transcript,
      mapLangToGoogleCode(learningLang)
    );

    fs.unlink(audioFile.path, () => {});

    return res.json({
      transcript,
      feedback,
      referenceAudio // base64 MP3
    });

  } catch (err) {
    console.error("Pronunciation Error:", err);
    return res.status(500).json({ message: "Pronunciation check failed" });
  }
};

function mapLangToGoogleCode(lang) {
  return {
    en: "en-US",
    ml: "ml-IN",
    hi: "hi-IN",
    ta: "ta-IN",
    te: "te-IN",
    kn: "kn-IN",
  }[lang] || "en-US";
}
