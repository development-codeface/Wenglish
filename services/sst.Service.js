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

  const request = {
    audio: { content: audioBytes },
    config: {
      encoding: "WEBM_OPUS", 
      sampleRateHertz: 48000,
      languageCode: mapLang(language),
      enableAutomaticPunctuation: true,
       model: "latest_long",
    },
  };

  const [response] = await client.recognize(request);

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
