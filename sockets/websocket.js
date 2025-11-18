import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import User from "../models/user.model.js";
import ChatMessage from "../models/chat.model.js";
import ChatSession from "../models/chatSession.model.js";
import { getResponseFromLLM } from "../services/llmService.js";
import { synthesizeToBase64 } from "../services/ttsService.js";

export const initChatSocket = (server) => {
  const io = new Server(server, { cors: { origin: "*" } });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id);
      if (!socket.user) return next(new Error("Authentication error"));
      next();
    } catch (err) {
      console.error("Auth error:", err);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const sessionStart = Date.now();
    const session = await ChatSession.create({ user: socket.user._id, startTime: sessionStart });

    const disconnectTimer = setTimeout(async () => {
      const totalDuration = (Date.now() - sessionStart) / 1000;
      await ChatSession.findByIdAndUpdate(session._id, { endTime: Date.now(), duration: totalDuration });
      socket.emit("sessionEnded", { totalDuration });
      socket.disconnect(true);
    }, 60 * 1000);

    socket.on("chatMessage", async (text) => {
      try {
        const botResponse = await getResponseFromLLM(text);
        await ChatMessage.create({ user: socket.user._id, sessionId: session._id, message: text, response: botResponse });

        // synthesize
        const languageCode = mapNativeLangToCode(socket.user.nativeLanguage);
        const audioBase64 = await synthesizeToBase64(botResponse, languageCode);

        socket.emit("botMessage", { text: botResponse, audio: audioBase64 });
      } catch (err) {
        console.error("chatMessage error:", err);
        socket.emit("botMessage", { text: "Sorry, something went wrong." });
      }
    });

    socket.on("hangUp", async () => {
      clearTimeout(disconnectTimer);
      const totalDuration = (Date.now() - sessionStart) / 1000;
      await ChatSession.findByIdAndUpdate(session._id, { endTime: Date.now(), duration: totalDuration });
      socket.emit("sessionEnded", { totalDuration });
      socket.disconnect(true);
    });

    socket.on("disconnect", async () => {
      clearTimeout(disconnectTimer);
      const totalDuration = (Date.now() - sessionStart) / 1000;
      await ChatSession.findByIdAndUpdate(session._id, { endTime: Date.now(), duration: totalDuration });
      await ChatMessage.updateMany({ sessionId: session._id }, { duration: totalDuration });
    });
  });
};

function mapNativeLangToCode(native) {
  switch (native) {
    case "hi": return "hi-IN";
    case "ta": return "ta-IN";
    case "ml": return "ml-IN";
    case "kn": return "kn-IN";
    case "te": return "te-IN";
    default: return "en-US";
  }
}
