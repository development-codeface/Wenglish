import { Server } from "socket.io";
import path from "path";
import speech from "@google-cloud/speech";
import jwt from "jsonwebtoken";
import {
  createConversationHistory,
  getResponseFromLLM,
  normalizeUserInput,
} from "../services/llmService.js";
import { synthesizeToBase64 } from "../services/ttsService.js";
import ChatSession from "../models/chatSession.model.js";
import ChatMessage from "../models/chat.model.js";

// 🎙 Google Speech Client - FIXED for PCM16
const client = new speech.SpeechClient({
  keyFilename: path.join(process.cwd(), "keys/gen-lang-client-0187682933-39e35c8a1543.json"),
});

export const initVoiceChatSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
    // ✅ Enable binary data parsing
    // parser: {
    //   encode: {},
    //   decode: {}
    // }
  });

  io.on("connection", async (socket) => {
    console.log('🔌 Socket connection attempt:', socket.id);

    /* ================= 🔐 AUTH ================= */
    const token = socket.handshake.auth?.token;
    console.log('🔑 Token received:', token ? 'YES' : 'NO');
    
    if (!token) {
      console.log("❌ No token provided");
      return socket.disconnect(true);
    }

    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ User authenticated:", socket.user.id);
    } catch (err) {
      console.log("❌ Invalid token:", err.message);
      return socket.disconnect(true);
    }

    /* ================= 🗂 CREATE SESSION ================= */
    const session = await ChatSession.create({
      user: socket.user.id,
      startTime: new Date(),
    });
    console.log("📁 Session created:", session._id);

    /* ================= 🧠 STATE ================= */
    let recognizeStream = null;
    const conversationHistory = createConversationHistory();
    const sessionId = session._id.toString();

    /* ================= 🎙 START STT (PCM16 @ 16kHz) ================= */
    const startStreaming = () => {
      if (recognizeStream) return;
      
      console.log("🎙️ Starting STT stream...");
      recognizeStream = client
        .streamingRecognize({
          config: {
            encoding: "LINEAR16",        // ✅ PCM16 (Flutter format)
            sampleRateHertz: 16000,     // ✅ 16kHz (Flutter format)
            languageCode: "en-IN",      // ✅ Start with English
            alternativeLanguageCodes: ["ml-IN", "hi-IN", "en-US"],
            enableAutomaticPunctuation: true,
            model: "latest_long",       // ✅ Better for conversation
            singleUtterance: false,     // ✅ Continuous
          },
          interimResults: true,
        })
        .on("error", (err) => {
          console.error("❌ STT Error:", err);
          stopStreaming();
        })
        .on("data", async (data) => {
          if (!data.results?.[0]) return;

          const result = data.results[0];
          const rawTranscript = result.alternatives[0].transcript.trim();
          
          if (!rawTranscript) return;

          const transcript = await normalizeUserInput(rawTranscript);
          console.log("🗣️ Transcript (${result.isFinal ? 'FINAL' : 'PARTIAL'}):", transcript);

          // 📝 Live typing (partial)
          if (!result.isFinal) {
            socket.emit("partialTranscript", transcript);
            return;
          }

          const callStart = Date.now();
          console.log("🤖 Processing with LLM...");

          /* ================= 🤖 LLM ================= */
          const botData = await getResponseFromLLM(transcript, conversationHistory);
          console.log("💬 AI Response:", botData.aiReply);

          /* ================= 💾 SAVE MESSAGES ================= */
          try {
            // User message
            await ChatMessage.create({
              user: socket.user.id,
              sessionId,
              message: transcript,
              response: botData.aiReply,
              duration: Math.floor((Date.now() - callStart) / 1000),
            });

            // Bot message
            await ChatMessage.create({
              user: socket.user.id,
              sessionId,
              message: botData.aiReply,
              response: botData.aiReply,
              sender: "bot",
            });
          } catch (dbErr) {
            console.error("💾 DB Save Error:", dbErr);
          }

          /* ================= 🔊 TTS ================= */
          try {
            const audio = await synthesizeToBase64(botData.aiReply, "en-IN-Wavenet-A");
            console.log("🔊 TTS audio generated:", audio.length, "bytes");

            /* ================= 📤 EMIT ================= */
            socket.emit("botMessage", {
              transcript: botData.correctedTranscript || transcript,
              text: botData.aiReply,
              audio, // base64 string
            });
            console.log("📤 Bot message sent");
          } catch (ttsErr) {
            console.error("❌ TTS Error:", ttsErr);
          }
        });
    };

    /* ================= 🛑 STOP STT ================= */
    const stopStreaming = async () => {
      console.log("🛑 Stopping STT stream...");
      if (recognizeStream) {
        recognizeStream.end();
        recognizeStream = null;
      }

      try {
        await ChatSession.findByIdAndUpdate(session._id, {
          endTime: new Date(),
        });
      } catch (err) {
        console.error("Session update error:", err);
      }
      console.log("📴 Call ended:", session._id);
    };

    /* ================= 🎧 AUDIO INPUT ================= */
    socket.on("audioChunk", (chunk) => {
      console.log("📤 Audio chunk received:", chunk.length, "bytes");
      if (!recognizeStream) startStreaming();
      if (recognizeStream) {
        recognizeStream.write(chunk);
      }
    });

    /* ================= ☎️ HANG UP ================= */
    socket.on("hangUp", async () => {
      console.log("📴 Hangup received");
      await stopStreaming();
      socket.disconnect(true);
    });

    /* ================= 🔌 DISCONNECT ================= */
    socket.on("disconnect", async (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      await stopStreaming();
    });

    console.log("✅ Voice chat ready for user:", socket.user.id);
  });
};