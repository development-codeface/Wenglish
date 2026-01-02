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

// 🎙 Google Speech Client
const client = new speech.SpeechClient({
  keyFilename: path.join(
    process.cwd(),
    "keys/gen-lang-client-0187682933-39e35c8a1543.json"
  ),
});

export const initVoiceChatSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", async (socket) => {
    /* ================= 🔐 AUTH ================= */
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.log("❌ No token provided");
      return socket.disconnect();
    }

    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log("❌ Invalid token");
      return socket.disconnect();
    }

    console.log("📞 Call connected:", socket.user.id);

    /* ================= 🗂 CREATE SESSION ================= */
    const session = await ChatSession.create({
      user: socket.user.id,
      startTime: new Date(), // ✅ REQUIRED FIELD
    });

    /* ================= 🧠 STATE ================= */
    let recognizeStream = null;
    const conversationHistory = createConversationHistory();
       const sessionId = socket.id;

    /* ================= 🎙 START STT ================= */
    const startStreaming = () => {
      recognizeStream = client
        .streamingRecognize({
          config: {
            encoding: "WEBM_OPUS",
            sampleRateHertz: 48000,
            languageCode: "ml-IN",
            alternativeLanguageCodes: ["en-IN", "hi-IN", "en-US"],
            enableAutomaticPunctuation: true,
          },
          interimResults: true,
        })
        .on("error", (err) => {
          console.error("STT Error:", err);
          stopStreaming();
        })
        .on("data", async (data) => {
          if (!data.results?.length) return;

          const result = data.results[0];
          const rawTranscript = result.alternatives[0].transcript;
          const transcript = await normalizeUserInput(rawTranscript);

          // 📝 Live typing
          if (!result.isFinal) {
            socket.emit("partialTranscript", transcript);
            return;
          }

         const callStart = Date.now();

          /* ================= 🤖 LLM ================= */
          const botData = await getResponseFromLLM(
            transcript,
            conversationHistory
          );

           /* ================= 💾 SAVE USER MESSAGE ================= */
          await ChatMessage.create({
            user: socket.user.id,
            sessionId,              
            message: transcript,   
            response: botData.aiReply, // bot reply
            duration: Math.floor((Date.now() - callStart) / 1000),
          });

          /* ================= 💾 SAVE BOT MESSAGE ================= */
          await ChatMessage.create({
            user: socket.user.id,
            sessionId: session._id,
            message: botData.aiReply,
            response: botData.aiReply,
            sender: "bot",
          });

          /* ================= 🔊 TTS ================= */
          const audio = await synthesizeToBase64(
            botData.aiReply,
            "ml-IN"
          );

          /* ================= 📤 EMIT ================= */
          socket.emit("botMessage", {
            transcript: botData.correctedTranscript,
            text: botData.aiReply,
            audio,
          });
        });
    };

    /* ================= 🛑 STOP STT ================= */
    const stopStreaming = async () => {
      if (recognizeStream) {
        recognizeStream.end();
        recognizeStream = null;
      }

      // ⏱ End session
      await ChatSession.findByIdAndUpdate(session._id, {
        endTime: new Date(),
      });

      console.log("📴 Call ended:", session._id);
    };

    /* ================= 🎧 AUDIO INPUT ================= */
    socket.on("audioChunk", (chunk) => {
      if (!recognizeStream) startStreaming();
      recognizeStream.write(chunk);
    });

    /* ================= ☎️ HANG UP ================= */
    socket.on("hangUp", async () => {
      await stopStreaming();
      socket.disconnect();
    });

    socket.on("disconnect", async () => {
      await stopStreaming();
    });
  });
};
