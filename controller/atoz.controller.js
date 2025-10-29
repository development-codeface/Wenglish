import { getAlphabetLearningResponse } from "../services/llmService.js";

export const getAtoZResponse = async (req, res) => {
  try {
    const { letter } = req.body;

    if (!letter || !/^[a-zA-Z]$/.test(letter)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a single valid letter (A–Z)."
      });
    }

    const response = await getAlphabetLearningResponse(letter);

    res.status(200).json({
      success: true,
      data: {
        letter: letter.toUpperCase(),
        response,
      },
    });
  } catch (error) {
    console.error("Error in AtoZ controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate A–Z learning response.",
    });
  }
};
