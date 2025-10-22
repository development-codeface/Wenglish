import ChatSession from "../models/chatSession.model.js";
import ChatMessage from "../models/chat.model.js";

export const getChatHistoryBySession = async (req, res) => {
  try {
const userId = req.user._id;    
const limit = 15;
if (!userId) return res.status(400).json({ error: "userId is required" });

    // Get latest sessions for the user
    const sessions = await ChatSession.find({ user: userId })
      .sort({ startTime: -1 })
      .limit(Number(limit))
      .lean()
      .exec();

    // Fetch messages for each session
    const history = await Promise.all(
      sessions.map(async (session) => {
        const messages = await ChatMessage.find({ user: userId, sessionId: session._id })
          .sort({ createdAt: 1 })
          .lean()
          .exec();
        return {
          sessionId: session._id,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          messages,
        };
      })
    );

    res.json({ success: true, data: history });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
