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
    const nativeLang = user?.nativeLanguage || "en";
    const learningLang = user?.languagePreference || "en";

    const subtopic = await GrammarSubtopic.findById(subtopicId);
    if (!subtopic) {
      return { reply: "Topic not found.", correctedInput: null };
    }

    const topicTitle = subtopic.title?.[learningLang] || subtopic.title?.en;

    // Load LAST history for stage progression
    const lastMessage = await GrammarChatHistory.findOne({
      user: userId,
      subtopicId
    }).sort({ createdAt: -1 });

    const stage = lastMessage?.stage || "intro";
    const questionNumber = lastMessage?.questionNumber || 0;

    // ---- MASTER PROMPT ----
const systemPrompt = `
You are a structured grammar tutor.
Teach the English grammar topic: "${topicTitle}"
But speak ONLY in the user's native language: ${nativeLang}.

NEVER speak English except inside quotes (" ") when giving example sentences.

-----------------------
STAGE FLOW LOGIC
-----------------------

STAGE: intro
- Give a very simple explanation of the grammar rule **in ${nativeLang}**.
- Then ask the user: 
  "Do you understand?" translated fully into ${nativeLang}.
- Tell the user to reply with the equivalent of "yes" or "no" in ${nativeLang}.

STAGE: understanding-check
- If the user's message means "no" in ${nativeLang}:  
    → Re-explain the rule more simply in ${nativeLang}.  
    → Ask again if they understand (in ${nativeLang}).
- If the user's message means "yes" in ${nativeLang}:  
    → Move to stage "examples".

STAGE: examples
- Give two simple English example sentences inside quotes (" ").
- Explain each sentence clearly in ${nativeLang}.
- Then ask the user: 
  "Are you ready for practice questions?" translated into ${nativeLang}.

STAGE: questions
- Ask a simple practice question based on questionNumber (1, 2, or 3).
- After the user's answer:
    → Give feedback in ${nativeLang}.
    → Increase questionNumber by 1.
- After questionNumber reaches 3:
    → Move to stage "mastered".

STAGE: mastered
- Congratulate the user in ${nativeLang}.
- Confirm they have mastered this topic.


-----------------------
REQUIRED OUTPUT FORMAT
-----------------------
Always respond ONLY in this JSON format:

{
  "stage": "<nextStage>",
  "questionNumber": <nextNumber>,
  "reply": "<your full message in ${nativeLang}>"
}

Do NOT include any text outside the JSON.
Your entire output MUST be valid JSON.
`;


    const messages = [
      { role: "system", content: systemPrompt },
      { role: "assistant", content: lastMessage?.botReply || "" },
      { role: "user", content: userInput }
    ];
const result = await model.invoke(messages);

// Extract and repair JSON
const parsed = fixJSON(result.content);

if (!parsed) {
  console.error("Invalid JSON from model:", result.content);
  return {
    reply: "AI format error.",
    correctedInput: null
  };
}

return {
  reply: parsed.reply,
  stage: parsed.stage,
  questionNumber: parsed.questionNumber,
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

function fixJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch (_) {
    // Attempt to extract JSON block
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
  }

  return null; // still invalid
}






