import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  maxOutputTokens: 1000,
  apiKey: process.env.GOOGLE_API_KEY,
});

export const getResponseFromLLM = async (message) => {
  try {
    const response = await model.invoke([
        new SystemMessage("You are a friendly and helpful AI assistant that replies in a conversational tone. Keep answers short and natural and no emojis."),
        new HumanMessage(message)]);
    return response.content; // text
  } catch (err) {
    console.error("LLM query error:", err);
    return "Error generating response";
  }
};
