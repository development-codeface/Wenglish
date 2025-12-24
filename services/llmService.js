import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import User from "../models/user.model.js";
import GrammarSubtopic from "../models/grammerSubTopic.model.js";
import GrammarChatHistory from "../models/grammerChatHistory.model.js";
import GeneralChatHistory from "../models/generalChat.model.js";



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
    if (!userInput?.trim()) {
      return {
        reply: { preferred: "", native: "" },
        correctedInput: null
      };
    }

    const user = await User.findById(userId);
    const preferredLanguage = user?.languagePreference || "en";
    const nativeLanguage = user?.nativeLanguage || "ml";

    const cleanSentence = userInput.trim();

const systemPrompt = `
You are a strict bilingual information generator.

PRIMARY GOAL:
Always answer the USER MESSAGE directly. 
Use the category only as contextual guidance — NOT the main answer.

The user message is: "${cleanSentence}"
The topic context is: "${category}"

MANDATORY RULES:
1. The response MUST directly address the user's message in factual, educational style.
2. DO NOT give definitions of the category unless the user explicitly asks.
3. NO greetings, NO casual talk, NO conversation, NO encouragement.
4. NO examples unless the user asks.
5. Output MUST be valid JSON with exactly these fields:
   "preferred": answer only in ${preferredLanguage}
   "native": same answer only in ${nativeLanguage}
6. Strict JSON only. No markdown, no backticks, no commentary.
7. If the user asks for lists (e.g., "Give me some famous destinations"), produce a list based on real locations.
8. If clarification is needed, infer the simplest accurate interpretation and produce an answer.
9. Even when providing lists, ALWAYS output them as a single multiline STRING.
   Never use arrays or brackets. Never return ["item1", "item2"].
   Each list item must be in its own line inside the string.
`;


    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(cleanSentence)
    ]);

    const raw = response?.content?.trim() || "";

    // --- JSON Fixer Stage ---
    // Extract JSON if model adds accidental text
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");

    const jsonSafe =
      first !== -1 && last !== -1
        ? cleaned.slice(first, last + 1)
        : cleaned;

    let parsedReply;
    try {
      parsedReply = JSON.parse(jsonSafe);
    } catch (err) {
      // Ask model to FIX the JSON only
      const fixPrompt = `
The following should be JSON but is invalid. Fix it.
Return ONLY valid JSON with "preferred" and "native".

Content:
${cleaned}
`;

      const fixResponse = await model.invoke([
        new SystemMessage(fixPrompt)
      ]);

      const fixedRaw = fixResponse?.content?.trim() || "{}";
      parsedReply = JSON.parse(
        fixedRaw
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim()
      );
    }

    return {
      reply: {
        preferred: parsedReply.preferred || "",
        native: parsedReply.native || ""
      },
      correctedInput: cleanSentence
    };

  } catch (error) {
    console.error("Chat error:", error);
    return {
      reply: {
        preferred: "",
        native: ""
      },
      correctedInput: null
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
      return { replyNative: "Topic not found.", replyLearning: "Topic not found." };
    }

    const topicTitle =
      subtopic.title?.[learningLang] ||
      subtopic.title?.en ||
      Object.values(subtopic.title)[0];

    // Load last chat entry
    const lastMessage = await GrammarChatHistory.findOne({
      user: userId,
      subtopicId
    }).sort({ createdAt: -1 });

    const stage = lastMessage?.stage || "intro";
    const questionNumber = lastMessage?.questionNumber || 0;

    // ==========================
    // SYSTEM PROMPT (Dual Language)
    // ==========================
    const systemPrompt = `
You are a structured grammar tutor.

Teach the topic: "${topicTitle}"

You must produce TWO VERSIONS of every reply:
1. replyNative → in ${nativeLang}
2. replyLearning → in ${learningLang}

Both replies should contain the SAME meanings.

English example sentences must stay in English inside quotes (" ").

------------------------------------
STAGE LOGIC  
------------------------------------

STAGE: intro
- Explain the grammar rule simply.
- Ask "Do you understand?" in both languages.

STAGE: understanding-check
- If user says "no", re-explain simply.
- If user says "yes", move to "examples".

STAGE: examples
- Give 2 English example sentences.
- Explain them in both languages.
- Ask if they are ready for practice.

STAGE: questions
- Ask practice question based on questionNumber.
- Evaluate user answer.
- Increase questionNumber until 3.
- Then move to "mastered".

STAGE: mastered
- Congratulate the user in both languages.

------------------------------------
OUTPUT FORMAT (MANDATORY)
------------------------------------
Return ONLY valid JSON:

{
  "stage": "<nextStage>",
  "questionNumber": <nextNumber>,
  "replyNative": "<message in ${nativeLang}>",
  "replyLearning": "<message in ${learningLang}>"
}

No extra text. No markdown.  
Only JSON.
`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "assistant", content: lastMessage?.replyNative || "" },
      { role: "assistant", content: lastMessage?.replyLearning || "" },
      { role: "user", content: userInput }
    ];

    const result = await model.invoke(messages);

    const parsed = fixJSON(result.content);

    if (!parsed) {
      return {
        replyNative: "AI format error.",
        replyLearning: "AI format error.",
        stage,
        questionNumber,
        correctedInput: userInput
      };
    }

    return {
      replyNative: parsed.replyNative,
      replyLearning: parsed.replyLearning,
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
      replyNative: "I cannot teach right now.",
      replyLearning: "I cannot teach right now.",
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

async function generateFriendlyMessage(nativeLang, prompt) {
  const system = new SystemMessage(`
You are a warm, kind, supportive friend.
Always reply ONLY in the user's native language: ${nativeLang}.
Tone must be friendly, respectful, gentle, and natural.
Do NOT use romantic or intimate words.
No emojis.
Never mention that you are an AI.
Keep responses short, thoughtful, and human-like.
`);
  const user = new HumanMessage(prompt);
  const result = await model.invoke([system, user]);
  return result.content;
}

export const getGeneralChatResponse = async (userId, userInput) => {
  try {
    const user = await User.findById(userId);
    const nativeLang = user?.nativeLanguage || "en";

    let chat = await GeneralChatHistory.findOne({ user: userId });

    if (!chat) {
      chat = await GeneralChatHistory.create({
        user: userId,
        stage: "start",
        history: []
      });
    }

    const stage = chat.stage;
    let reply = "";

    if (stage === "start") {
      reply = await generateFriendlyMessage(
        nativeLang,
        "Greet the user in a friendly, respectful tone and ask how their day was."
      );
      chat.stage = "asked_day";
      await chat.save();
      return reply;
    }

    if (stage === "asked_day") {
      reply = await generateFriendlyMessage(
        nativeLang,
        `The user said "${userInput}". Acknowledge it kindly and then ask what they want to know or talk about.`
      );

      chat.stage = "asked_interest";

      chat.history.push({
        userMessage: userInput,
        aiMessage: reply
      });

      await chat.save();
      return reply;
    }

    if (stage === "asked_interest") {
      reply = await generateFriendlyMessage(
        nativeLang,
        `The user said "${userInput}". Respond supportively and tell them you are ready to chat and help.`
      );

      chat.stage = "general";

      chat.history.push({
        userMessage: userInput,
        aiMessage: reply
      });

      await chat.save();
      return reply;
    }

    chat.history.push({ userMessage: userInput });

    const messages = [
      new SystemMessage(`
You are a warm, kind, supportive friend.
Always reply in the user's native language: ${nativeLang}.
Tone must be friendly, respectful, gentle, and natural.
No romantic words.
No emojis.
Never mention that you are an AI.
Keep responses short, caring, and human-like.
`)
    ];

    chat.history.forEach(entry => {
      if (entry.userMessage) messages.push(new HumanMessage(entry.userMessage));
      if (entry.aiMessage) messages.push(new AIMessage(entry.aiMessage));
    });

    const llmResponse = await model.invoke(messages);
    reply = llmResponse.content;

    chat.history[chat.history.length - 1].aiMessage = reply;

    await chat.save();

    return reply;

  } catch (err) {
    console.error("General Chat Error:", err);
    return "Something went wrong.";
  }
};

export const evaluatePronunciation = async ({
  transcript,
  learningLang,
  nativeLang
}) => {
  const systemPrompt = `
You are a pronunciation evaluator for language learners.

The user spoke the following sentence:
"${transcript}"

TASK:
Evaluate pronunciation quality based on the transcript.
Assume the user tried to speak in ${learningLang}.

RULES:
1. Give feedback in TWO languages:
   - replyLearning → ${learningLang}
   - replyNative → ${nativeLang}
2. Be encouraging but honest.
3. Focus only on pronunciation and clarity.
4. No emojis. No greetings.
5. Keep feedback short and practical.
6. Output ONLY valid JSON.

FORMAT:
{
  "score": number from 1 to 5,
  "replyLearning": "feedback in ${learningLang}",
  "replyNative": "feedback in ${nativeLang}"
}
`;

  const result = await model.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage("Evaluate the pronunciation.")
  ]);

  return fixJSON(result.content);
};







