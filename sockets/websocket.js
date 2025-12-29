// sockets/voiceChatSocket.js
import { Server } from "socket.io";
import path from "path";
import speech from "@google-cloud/speech";
import {
  createConversationHistory,
  getResponseFromLLM,
  normalizeUserInput,
} from "../services/llmService.js";
import { synthesizeToBase64 } from "../services/ttsService.js";

// Initialize Google STT client
const client = new speech.SpeechClient({
  keyFilename: path.join(
    process.cwd(),
    "keys/gen-lang-client-0187682933-39e35c8a1543.json"
  ),
});

export const initVoiceChatSocket = (httpServer) => {
  const io = new Server(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    let recognizeStream = null;
    const conversationHistory = createConversationHistory();

    // Start Google STT streaming
    const startStreaming = () => {
      recognizeStream = client
        .streamingRecognize({
          config: {
            encoding: "WEBM_OPUS", // Must match client audio
            sampleRateHertz: 48000,
            languageCode: "ml-IN",
            alternativeLanguageCodes: ["en-IN", "hi-IN", "en-US"],
            enableAutomaticPunctuation: true,
          },
          interimResults: true, // Get partial transcripts
        })
        .on("error", (err) => {
          console.error("STT Stream Error:", err);
          stopStreaming();
        })
        .on("data", async (data) => {
          if (!data.results || data.results.length === 0) return;
          const result = data.results[0];
          const transcriptLanguage = result.alternatives[0].transcript;

          const transcript = await normalizeUserInput(transcriptLanguage);

          if (result.isFinal) {
            // 1️⃣ Send transcript to LLM
            const botData = await getResponseFromLLM(
              transcript,
              conversationHistory
            );
            // 2️⃣ Convert AI response to speech
            const audioBase64 = await synthesizeToBase64(
              botData.aiReply,
              "ml-IN"
            );

            // 3️⃣ Emit final response
            socket.emit("botMessage", {
              transcript: botData.correctedTranscript,
              text: botData.aiReply,
              audio: audioBase64,
            });
          } else {
            // Send partial transcript for "live typing"
            socket.emit("partialTranscript", transcript);
          }
        });
    };

    const stopStreaming = () => {
      if (recognizeStream) {
        recognizeStream.end();
        recognizeStream = null;
      }
    };

    // Receive audio chunks from browser
    socket.on("audioChunk", (chunk) => {
      if (!recognizeStream) startStreaming();
      recognizeStream.write(chunk);
    });

    socket.on("hangUp", () => {
      stopStreaming();
      socket.disconnect();
    });

    socket.on("disconnect", () => stopStreaming());
  });
};
