import { getGeneralChatResponse } from "../services/llmService.js";
import GeneralChatHistory from "../models/generalChat.model.js";

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


