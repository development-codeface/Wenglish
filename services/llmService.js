import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import User from "../models/user.model.js";
import GrammarSubtopic from "../models/grammerSubTopic.model.js";
import GrammarChatHistory from "../models/grammerChatHistory.model.js";



const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  maxOutputTokens: 1000,
  apiKey: process.env.GOOGLE_API_KEY,
});

const conversationHistory = [
  new SystemMessage("You are a friendly and helpful AI assistant that replies in a conversational tone. Keep answers short and natural and no emojis.")
];

const correctUserInput = async (input, language = "en") => {
  const correctionPrompt = [
    new SystemMessage(
      `You are a kind language teacher helping students improve conversations in ${language}.
If the user’s message is already correct, just say "✅ Looks good!" in ${language}.
If there are mistakes, correct them.

Always use this format:
Corrected Sentence:
👉 [corrected text in ${language}]

Explanation (in ${language}):
- [short reason 1]
- [short reason 2]

Avoid grammar jargon or complicated terms.
Never use emojis.`
    ),
    new HumanMessage(input),
  ];

  const correctionResponse = await model.invoke(correctionPrompt);
  return correctionResponse.content;
};

export const getCategoryChatResponse = async (category, userInput, userId) => {
  try {
    // 🔒 Validate input
    if (!userInput || !userInput.trim()) {
      return {
        reply: "Please type something for me to respond to.",
        correctedInput: null,
        language: "en"
      };
    }

    // 🧠 Get user language
    const user = await User.findById(userId);
    const language = user?.languagePreference || "en";

    // 🧹 Clean the input
    const rawInput = userInput.trim();

    // 🧩 Step 1: Correct input safely
    let correctedInput = await correctUserInput(rawInput, language);

    // Fallback — if correction failed or returned nothing
    if (!correctedInput || typeof correctedInput !== "string" || !correctedInput.trim()) {
      correctedInput = rawInput;
    }

    // Step 2: Build safe system + human messages
    const messages = [
      new SystemMessage(
        `You are a friendly AI assistant who helps users talk about ${category} in only ${language}.
Respond only in ${language}.
Keep your sentences short, natural, and clear.
If the user makes a grammar mistake, correct it gently in ${language}.`
      ),
      new HumanMessage(correctedInput.trim())
    ];

    // Step 3: Guard before invoking Gemini
    const hasEmpty = messages.some(
      (msg) => !msg.content || !msg.content.trim()
    );
    if (hasEmpty) {
      console.error("⚠️ Gemini prompt empty. Messages:", messages);
      return { reply: "I didn’t get that clearly.", correctedInput, language };
    }

    // Step 4: Send to Gemini safely
    const response = await model.invoke(messages);

    const replyText = response?.content?.trim() || "I’m here! Let’s talk.";

    return { reply: replyText, correctedInput, language };
  } catch (error) {
    console.error("Error in category chat:", error);
    return {
      reply: "Sorry, I couldn't generate a response right now.",
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
export const getAlphabetLearningResponse = async (letter) => {
  try {
    const prompt = [
      new SystemMessage(
        `You are a kind teacher helping kids learn the alphabet.
When the user gives you a letter, reply only in this format:
[Letter] for [Word starting with that letter]

Do not add explanations, fun facts, or any other text.
Keep it simple and suitable for kids.
`
      ),
      new HumanMessage(`Letter: ${letter}`)
    ];

    const response = await model.invoke(prompt);
    return response.content;
  } catch (error) {
    console.error("Error generating alphabet response:", error);
    return "Sorry, I couldn’t generate the learning content right now.";
  }
};


export const getGrammarTutorResponse = async (subtopicId, userInput, userId) => {
  try {
    const user = await User.findById(userId);

    const learningLang = user?.languagePreference || "en";   
    const nativeLang = user?.nativeLanguage || "en";          

    const subtopic = await GrammarSubtopic.findById(subtopicId);
    if (!subtopic) {
      return { reply: "Grammar topic not found.", correctedInput: null };
    }

    const topicTitle =
      subtopic.title?.[learningLang] ||
      subtopic.title?.en;

    // fetch last 3 messages only (super fast)
    const previousChats = await GrammarChatHistory.find({
      user: userId,
      subtopicId
    })
      .sort({ createdAt: -1 })
      .limit(3);

    const historyMessages = previousChats
      .reverse()
      .map(chat => [
        { role: "user", content: chat.userMessage },
        { role: "assistant", content: chat.botReply }
      ])
      .flat();

    // tiny system message (fastest)
    const systemMessage = {
      role: "system",
      content: `You are a helpful grammar tutor.
The user is learning English grammar, but you must explain EVERYTHING ONLY in ${nativeLang}.
Never reply in ${learningLang}. Never mix languages.
Teach the topic "${topicTitle}" in ${nativeLang}.

Use this structure:
1) Definition (native language only)
2) 1–2 examples explained in native language
3) Simple explanation in native language
4) A short practice question in native language`
    };

    const messages = [
      systemMessage,
      ...historyMessages,
      { role: "user", content: userInput }
    ];

    const response = await model.invoke(messages);

    return {
      reply: response.content,
      correctedInput: userInput,
      language: learningLang,
      nativeLang,
      topic: topicTitle
    };
  } catch (error) {
    console.error("Grammar Tutor Error:", error);
    return {
      reply: "Sorry, I couldn't teach this right now.",
      correctedInput: null,
    };
  }
};




