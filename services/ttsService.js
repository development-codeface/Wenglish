import textToSpeech from "@google-cloud/text-to-speech";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_SPEECH_CREDENTIALS, "base64").toString("utf8")
);

const client = new textToSpeech.TextToSpeechClient({ credentials });

export async function synthesizeToBase64(
  text,
  languageCode = "en-US",
  gender = "FEMALE"
) {
  const request = {
    input: { text },
    voice: { languageCode, ssmlGender: gender },
    audioConfig: { audioEncoding: "MP3" },
  };

  const [response] = await client.synthesizeSpeech(request);

  return response.audioContent.toString("base64");
}
