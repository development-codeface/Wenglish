import Language from "../models/nativeLanguage.model.js";

export const createLanguage = async (req, res) => {
  try {
    const { code, name } = req.body;

    if (!code || !name) {
      return res.status(400).json({ message: "Code and name are required" });
    }

    const exists = await Language.findOne({ code });
    if (exists) {
      return res.status(409).json({ message: "Language already exists" });
    }

    const language = await Language.create({ code, name });
    return res.status(201).json({ message: "Language created", language });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getLanguages = async (req, res) => {
  try {
    const languages = await Language.find().sort("name");
    return res.status(200).json({ languages });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getActiveLanguages = async (req, res) => {
  try {
    const languages = await Language.find({ isActive: true }).sort("name");
    return res.status(200).json({ languages });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getLanguageById = async (req, res) => {
  try {
    const { id } = req.params;
    const language = await Language.findById(id);

    if (!language) {
      return res.status(404).json({ message: "Language not found" });
    }

    return res.status(200).json({ language });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateLanguage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, isActive } = req.body;

    const language = await Language.findById(id);
    if (!language) {
      return res.status(404).json({ message: "Language not found" });
    }

    if (code) {
      const exists = await Language.findOne({ code, _id: { $ne: id } });
      if (exists) {
        return res.status(409).json({ message: "Code already in use" });
      }
    }

    const updated = await Language.findByIdAndUpdate(
      id,
      { name, code, isActive },
      { new: true }
    );

    return res.status(200).json({ message: "Language updated", language: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteLanguage = async (req, res) => {
  try {
    const { id } = req.params;

    const language = await Language.findById(id);
    if (!language) {
      return res.status(404).json({ message: "Language not found" });
    }

    // Hard delete (delete from DB)
    await Language.findByIdAndDelete(id);

    return res.status(200).json({ message: "Language deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

