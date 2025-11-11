import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import User from "../models/user.model.js";
import GrammarSubtopic from "../models/grammerSubTopic.model.js";



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
    // Fetch user's preferred language from DB
    const user = await User.findById(userId);
    const language = user?.languagePreference || "en";

    const conversationHistory = [
      new SystemMessage(
        `You are a friendly AI assistant who talks about ${category}.
Your language for this chat is ${language}.
Use short, natural sentences in ${language}.
If the user makes mistakes, correct them naturally in ${language} without sounding robotic.`
      ),
    ];

    // Correct the user input in their language
    const correctedInput = await correctUserInput(userInput, language);

    conversationHistory.push(new HumanMessage(correctedInput));

    // Get LLM response in that language
    const response = await model.invoke(conversationHistory);

    return {
      reply: response.content,
      correctedInput,
      language,
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
    // 1. Get user language
    const user = await User.findById(userId);
    const language = user?.languagePreference || "en";

    // 2. Get grammar topic details
    const subtopic = await GrammarSubtopic.findById(subtopicId);
    if (!subtopic) {
      return { reply: "Grammar topic not found.", correctedInput: null };
    }

    const topicTitle = subtopic.title?.[language] || subtopic.title?.en;
    const topicDescription = subtopic.description?.[language] || subtopic.description?.en;

    // 3. Correct the user's input humanly
    let correctedInput = await correctUserInput(userInput, language);

    // If no correction needed → keep their original input
    if (correctedInput.includes("✅ Looks good!")) {
      correctedInput = userInput;
    }

    // 4. Conversation prompt for grammar teaching
    const messages = [
      new SystemMessage(
        `You are a friendly language tutor teaching the concept of "${topicTitle}".
Explain in language: ${language}.

Use this structure:
1) Short, simple definition (2-4 sentences).
2) Give 1–2 easy examples in ${language}.
3) Ask the user to try making a sentence using the concept.

Do NOT use emojis. Keep tone simple and natural.`
      ),
      new HumanMessage(correctedInput)
    ];

    // 5. LLM Response
    const response = await model.invoke(messages);

    return {
      reply: response.content,
      correctedInput,
      language,
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


