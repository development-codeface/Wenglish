import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import say from "say";
import User from "../models/user.model.js";
import ChatMessage from "../models/chat.model.js";
import ChatSession from "../models/chatSession.model.js"; // new model
import { getResponseFromLLM } from "../services/llmService.js";

export const initChatSocket = (server) => {
  const io = new Server(server, { cors: { origin: "*" } });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id);
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    console.log("User connected:", socket.user.email);

    const sessionStart = Date.now();

    // Create a session record
    const session = await ChatSession.create({
      user: socket.user._id,
      startTime: sessionStart,
    });

    // Auto-disconnect after 1 minute
    const disconnectTimer = setTimeout(async () => {
      const totalDuration = (Date.now() - sessionStart) / 1000;

      await ChatSession.findByIdAndUpdate(session._id, {
        endTime: Date.now(),
        duration: totalDuration,
      });

      socket.emit("sessionEnded", { totalDuration });
      socket.disconnect(true);
    }, 60 * 1000);

    socket.on("chatMessage", async (text) => {
      let botResponse = await getResponseFromLLM(text);
      if (Array.isArray(botResponse)) botResponse = botResponse.join(" ");
      if (typeof botResponse !== "string") botResponse = String(botResponse);

      // Save chat message
      await ChatMessage.create({
        user: socket.user._id,
        sessionId: session._id,
        message: text,
        response: botResponse,
      });

      // TTS generation
      const audioFile = path.join("temp", `${Date.now()}.wav`);
      fs.mkdirSync("temp", { recursive: true });

      say.export(botResponse, "Samantha", 1.2, audioFile, (err) => {
        if (err) {
          console.error("TTS error:", err);
          socket.emit("botMessage", { text: botResponse });
        } else {
          const audioData = fs.readFileSync(audioFile).toString("base64");
          socket.emit("botMessage", { text: botResponse, audio: audioData });
          fs.unlinkSync(audioFile);
        }
      });
    });

    socket.on("hangUp", async () => {
      clearTimeout(disconnectTimer);
      const totalDuration = (Date.now() - sessionStart) / 1000;

      await ChatSession.findByIdAndUpdate(session._id, {
        endTime: Date.now(),
        duration: totalDuration,
      });

      socket.emit("sessionEnded", { totalDuration });
      socket.disconnect(true);
    });

    socket.on("disconnect", async () => {
      clearTimeout(disconnectTimer);
      const totalDuration = (Date.now() - sessionStart) / 1000;

      await ChatSession.findByIdAndUpdate(session._id, {
        endTime: Date.now(),
        duration: totalDuration,
      });
await ChatMessage.updateMany(
  { sessionId: session._id },
  { duration: totalDuration }
);


      console.log(`User disconnected. Total session duration: ${totalDuration.toFixed(2)}s`);
    });
  });
};
