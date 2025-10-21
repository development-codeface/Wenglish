import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Create model instance
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  maxOutputTokens: 1000,
  apiKey: process.env.GOOGLE_API_KEY,
});

// Store conversation history in memory
const conversationHistory = [
  new SystemMessage("You are a friendly and helpful AI assistant that replies in a conversational tone. Keep answers short and natural and no emojis.")
];

export const getResponseFromLLM = async (message) => {
  try {
    // Add user message to history
    conversationHistory.push(new HumanMessage(message));

    // Invoke LLM with full conversation history
    const response = await model.invoke(conversationHistory);

    // Add AI reply to history
    conversationHistory.push(new HumanMessage(response.content));

    return response.content;
  } catch (err) {
    console.error("LLM query error:", err);
    return "Error generating response";
  }
};
