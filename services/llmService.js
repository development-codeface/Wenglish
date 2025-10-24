import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  maxOutputTokens: 1000,
  apiKey: process.env.GOOGLE_API_KEY,
});

const conversationHistory = [
  new SystemMessage("You are a friendly and helpful AI assistant that replies in a conversational tone. Keep answers short and natural and no emojis.")
];

const correctUserInput = async (input) => {
  const correctionPrompt = [
    new SystemMessage(
      `You are a kind English teacher helping young learners (ages 5–10).
Fix grammar, spelling, and clarity without changing meaning.
Explain things in a simple and friendly way.

Always use this format:
Corrected Sentence:
👉 [corrected text]

Explanation:
- [short and simple reason 1]
- [short and simple reason 2]

Avoid grammar jargon (like "past participle").
Do not use emojis or complicated words.`
    ),
    new HumanMessage(input),
  ];

  const correctionResponse = await model.invoke(correctionPrompt);
  return correctionResponse.content;
};

// --- Category Chat Response ---
export const getCategoryChatResponse = async (category, userInput) => {
  try {
    const conversationHistory = [
      new SystemMessage(
        `You are a friendly AI assistant who talks about ${category}.
Use simple, clear, and short sentences.
If the user makes small grammar mistakes, fix them naturally in your reply.
Never use emojis or sound too formal.`
      ),
    ];

    const correctedInput = await correctUserInput(userInput);

    conversationHistory.push(new HumanMessage(correctedInput));

    const response = await model.invoke(conversationHistory);

    return {
      reply: response.content,
      correctedInput,
    };
  } catch (error) {
    console.error("Error in category chat:", error);
    return {
      reply: "Error generating response",
      correctedInput: null,
    };
  }
};
export const getResponseFromLLM = async (message) => {
  try {
    conversationHistory.push(new HumanMessage(message));

    const response = await model.invoke(conversationHistory);

    conversationHistory.push(new HumanMessage(response.content));

    return response.content;
  } catch (err) {
    console.error("LLM query error:", err);
    return "Error generating response";
  }
};
