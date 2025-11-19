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
    if (!userInput?.trim()) {
      return {
        reply: { preferred: "", native: "" },
        correctedInput: null
      };
    }

    const user = await User.findById(userId);

    const preferred = user?.languagePreference || "en";
    const native = user?.nativeLanguage || "en";

    const rawInput = userInput.trim();

    // -------------------------
    // 1. Get correction result
    // -------------------------
    let correction = await correctUserInput(rawInput, preferred);
    if (!correction?.trim()) correction = rawInput;

    // -------------------------
    // 2. Extract JUST the corrected sentence
    // -------------------------
    const cleanedCorrectedSentence = correction
      .split("Corrected Sentence:").pop()  // remove heading
      .split("Explanation:")[0]            // remove explanation
      .replace("👉", "")                    // remove emojis
      .trim();

    // Fallback if cleaning fails
    const cleanSentence = cleanedCorrectedSentence || rawInput;

    // -------------------------
    // 3. Build system prompt
    // -------------------------
    const systemPrompt = `
You are a bilingual tutor.

Using the message:
"${cleanSentence}"

Respond according to the topic "${category}" in STRICT JSON:

{
  "preferred": "<reply only in ${preferred}>",
  "native": "<same reply only in ${native}>"
}

Rules:
- DO NOT include corrections or explanations.
- DO NOT output markdown.
- DO NOT mix languages.
- Only output JSON.
`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(cleanSentence)
    ];

    const response = await model.invoke(messages);
    const rawReply = response?.content?.trim() || "{}";

    let parsedReply = {};
    try {
      parsedReply = JSON.parse(rawReply);
    } catch (e) {
      console.error("JSON parse fail:", e);
      parsedReply = { preferred: "", native: "" };
    }

    return {
      reply: parsedReply,
      correctedInput: correction,    // send FULL correction back to client
      preferredLanguage: preferred,
      nativeLanguage: native
    };

  } catch (error) {
    console.error("Chat error:", error);
    return {
      reply: { preferred: "", native: "" },
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






