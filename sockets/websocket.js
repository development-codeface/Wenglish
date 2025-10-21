import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import say from "say";
import User from "../models/user.model.js";
import ChatMessage from "../models/chat.model.js";
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

  io.on("connection", (socket) => {
    console.log("User connected:", socket.user.email);

    // 1-minute countdown
    setTimeout(() => {
      socket.emit("timeUp", "Your 1-minute chat session is over");
    }, 60 * 1000);

    socket.on("chatMessage", async (text) => {
      let botResponse = await getResponseFromLLM(text);

      // Ensure botResponse is a string
      if (Array.isArray(botResponse)) botResponse = botResponse.join(" ");
      if (typeof botResponse !== "string") botResponse = String(botResponse);

      // Save chat to DB
      await ChatMessage.create({
        user: socket.user._id,
        message: text,
        response: botResponse,
      });

      // Generate voice using say
      const audioFile = path.join("temp", `${Date.now()}.wav`);
      fs.mkdirSync("temp", { recursive: true });
      
      say.export(botResponse, "Samantha", 1.2, audioFile, (err) => {
        if (err) {
          console.error("TTS error:", err);
          socket.emit("botMessage", { text: botResponse }); // fallback text only
        } else {
          // Read the file and send as base64
          const audioData = fs.readFileSync(audioFile).toString("base64");
          socket.emit("botMessage", { text: botResponse, audio: audioData });
          fs.unlinkSync(audioFile); // clean up
        }
      });
    });

    socket.on("disconnect", () => console.log("User disconnected"));
  });
};
