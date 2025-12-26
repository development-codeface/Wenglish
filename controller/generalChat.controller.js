import { getGeneralChatResponse } from "../services/llmService.js";
import GeneralChatHistory from "../models/generalChat.model.js";
import fs from "fs";
import { transcribeAudio } from "../services/sst.Service.js";

export const generalChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message?.trim()) {
      return res.status(400).json({ reply: "Message cannot be empty." });
    }

    const reply = await getGeneralChatResponse(userId, message);

    res.status(200).json({ reply });

  } catch (error) {
    console.error("General Chat Error:", error);
    res.status(500).json({ reply: "Server error." });
  }
};

export const getGeneralChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const chat = await GeneralChatHistory.findOne({ user: userId });

    if (!chat) {
      return res.status(200).json({
        history: [],
        stage: "start"
      });
    }

    return res.status(200).json({
      history: chat.history,
      stage: chat.stage
    });

  } catch (error) {
    console.error("History Fetch Error:", error);
    res.status(500).json({
      message: "Could not fetch chat history."
    });
  }
};
export const getGeneralChatHistoryById = async (req, res) => {
  try {
    const userId = req.user._id; 

    const chat = await GeneralChatHistory.findOne({ user: userId });

    if (!chat) {
      return res.status(200).json({
        history: [],
        stage: "start"
      });
    }

    return res.status(200).json({
      history: chat.history,
      stage: chat.stage
    });
  } catch (error) {
    console.error("History Fetch Error:", error);
    res.status(500).json({
      message: "Unable to fetch chat history."
    });
  }
};

export const resetGeneralChat = async (req, res) => {
  try {
    const userId = req.user._id;

    await GeneralChatHistory.findOneAndDelete({ user: userId });

    return res.status(200).json({
      message: "Chat reset successfully."
    });
  } catch (error) {
    console.error("Reset Chat Error:", error);
    res.status(500).json({
      message: "Unable to reset chat."
    });
  }
};

export const generalChatVoice = async (req, res) => {
  try {
    const userId = req.user._id;
    const language = req.user?.languagePreference || "en";

    console.log(language);

    /* ---------- VALIDATION ---------- */
    if (!req.file) {
      return res.status(400).json({ message: "Audio file required" });
    }

    const filePath = req.file.path;

    /* ---------- SPEECH → TEXT (multilanguage) ---------- */
    const transcript = await transcribeAudio(filePath, language);

    // Delete the audio file after transcription
    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to delete audio file:", err);
    });

    if (!transcript || !transcript.trim()) {
      return res.status(422).json({
        message: "Could not understand audio",
      });
    }

    /* ---------- LLM CHAT ---------- */
    const reply = await getGeneralChatResponse(userId, transcript.trim());

    /* ---------- RESPONSE ---------- */
    return res.status(200).json({
      transcript: transcript.trim(),
      reply,
    });

  } catch (err) {
    console.error("Voice Chat Error:", err);

    // Try deleting the file if an error occurred before deletion
    if (req.file?.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error("Failed to delete audio file:", unlinkErr);
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
};
