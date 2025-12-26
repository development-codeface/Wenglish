import Letters from "../models/letter.model.js";
import { v4 as uuid } from "uuid";
import { ALPHABETS } from "../utils/letters.js";
// POST /letters
export const saveLetters = async (req, res) => {
  try {
    const { letters } = req.body;

    if (!letters || !Array.isArray(letters)) {
      return res.status(400).json({ message: "letters[] required" });
    }

    // Remove old data
    await Letter.deleteMany({});

    // Insert new data in one go
    await Letter.insertMany(letters);

    res.status(200).json({
      message: "Letters saved successfully",
      count: letters.length
    });

  } catch (err) {
    console.error("Save letters error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getLettersByLanguage = async (req, res) => {
  try {
    const { lang } = req.params;

    // if (!SUPPORTED_LANGS.includes(lang)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Invalid language. Supported: ${SUPPORTED_LANGS.join(", ")}`
    //   });
    // }

    // Fetch only _id + requested language
    const letters = await Letters.find({}, { _id: 1, [lang]: 1 }).lean();

    // Filter out empty letters
    const filtered = letters
      .filter(item => item[lang] && item[lang].trim() !== "")
      .map(item => ({
        id: item._id,
        letter: item[lang]
      }));

    res.status(200).json({
      success: true,
      language: lang,
      count: filtered.length,
      letters: filtered
    });

  } catch (err) {
    console.error("Get letters by lang error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getAllLetters = async (req, res) => {
  try {
    const letters = await Letters.find().sort({ position: 1 });

    res.status(200).json({
      success: true,
      count: letters.length,
      letters
    });

  } catch (err) {
    console.error("Get all letters error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const generateAllLetters = async (req, res) => {
  try {
    const languages = Object.keys(ALPHABETS);

    // longest alphabet among all languages
    const maxLength = Math.max(
      ...languages.map(lang => ALPHABETS[lang].length)
    );

    const rows = [];

    for (let i = 0; i < maxLength; i++) {
      const row = {
        _id: uuid(),
        position: i + 1  // alphabet order
      };

      languages.forEach(lang => {
        row[lang] = ALPHABETS[lang][i] || ""; // fill empty
      });

      rows.push(row);
    }

    // wipe old data
    await Letters.deleteMany({});

    // insert new aligned data
    await Letters.insertMany(rows);

    res.status(200).json({
      success: true,
      message: "All multilingual letters generated automatically",
      count: rows.length,
      sample: rows.slice(0, 5)
    });

  } catch (error) {
    console.error("Generate letters error:", error);
    res.status(500).json({ message: error.message });
  }
};

