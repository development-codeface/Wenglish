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
      sampleRateHertz: 48000,
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
  try {
    const audioBytes = fs.readFileSync(filePath).toString("base64");

    const request = {
      audio: { content: audioBytes },
      config: {
        encoding: "WEBM_OPUS",
        // HARD FIX: Prevents the "sample rate (0)" crash
        sampleRateHertz: 48000, 
        
        // Use ml-IN as primary to catch Malayalam sounds immediately
        languageCode: "ml-IN", 
        
        // Add Hindi and English for auto-switching script
        alternativeLanguageCodes: ["hi-IN", "en-IN", "en-US"], 
        
        enableAutomaticPunctuation: true,
        // Using 'latest_long' with enhanced mode for better clarity
        model: "latest_long", 
        useEnhanced: true, 
      },
    };

    const [response] = await client.recognize(request);

    // If no results, log for debugging
    if (!response.results || response.results.length === 0) {
      console.error("STT returned no results for file:", filePath);
      return "";
    }

    const transcript = response.results
      .map(r => r.alternatives[0].transcript)
      .join(" ");
    
    return transcript;

  } catch (error) {
    console.error("Speech API Error Details:", error.details || error.message);
    return "";
  }
}

export async function transcribeAudioAutoFromBuffer(buffer) {
  const audioBytes = buffer.toString("base64");

  const request = {
    audio: { content: audioBytes },
    config: {
      encoding: "WEBM_OPUS",
      languageCode: "ml-IN",
      alternativeLanguageCodes: ["hi-IN", "en-IN"],
      enableAutomaticPunctuation: true,
      model: "latest_short",
    },
  };

  const [response] = await client.recognize(request);

  if (!response.results?.length) return "";

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

