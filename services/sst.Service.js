import speech from "@google-cloud/speech";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new speech.SpeechClient({
  keyFilename: path.join(
    __dirname,
    "../keys/gen-lang-client-0187682933-39e35c8a1543.json"
  ),
});

export async function transcribeAudio(filePath, language = "en") {
  const audioBytes = fs.readFileSync(filePath).toString("base64");

  // Define all supported language codes
  const allLanguages = ["en-US", "ml-IN", "hi-IN", "ta-IN", "te-IN", "kn-IN"];
  
  // Set the user's preference as the primary, but allow detection for others
  const primaryLang = mapLang(language);
  const alternativeLangs = allLanguages.filter(l => l !== primaryLang);

  const request = {
    audio: { content: audioBytes },
    config: {
      encoding: "WEBM_OPUS", 
      languageCode: primaryLang, // Primary hint
      alternativeLanguageCodes: alternativeLangs, // Auto-detection list
      enableAutomaticPunctuation: true,
      model: "latest_long",
    },
  };

  const [response] = await client.recognize(request);

  // The response will now contain the transcript in the detected language
  return response.results
    .map(r => r.alternatives[0].transcript)
    .join(" ");
}
export async function transcribeAudioAuto(filePath) {
  const audioBytes = fs.readFileSync(filePath).toString("base64");

  const request = {
    audio: { content: audioBytes },
    config: {
      encoding: "WEBM_OPUS", 
      // REMOVE sampleRateHertz to let Google auto-detect the 48000Hz header
      
      // 1. SET MALAYALAM AS PRIMARY. This stops the English hallucination.
      languageCode: "ml-IN", 
      
      // 2. SET ENGLISH AS ALTERNATIVE. 
      // It will still switch back to English letters if you speak clear English.
      alternativeLanguageCodes: ["en-IN", "en-US", "hi-IN"], 
      
      enableAutomaticPunctuation: true,
      model: "latest_long", 
    },
  };

  const [response] = await client.recognize(request);

  if (!response.results || response.results.length === 0) return "";

  // Log this to see if it finally caught 'ml-IN'
  console.log(`Detected Lang: ${response.results[0].languageCode}`);
  console.log(`Transcript: ${response.results[0].alternatives[0].transcript}`);

  return response.results
    .map(r => r.alternatives[0].transcript)
    .join(" ");
}

function mapLang(lang) {
  return {
    en: "en-US",
    ml: "ml-IN",
    hi: "hi-IN",
    ta: "ta-IN",
    te: "te-IN",
    kn: "kn-IN",
  }[lang] || "en-US";
}

