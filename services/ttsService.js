import textToSpeech from "@google-cloud/text-to-speech";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(
    __dirname,
    "../keys/weenglish-6bb28-4ea0e1c02172.json"
  ),
});

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
