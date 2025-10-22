import Chapter from "../models/chapter.model.js";

export const createChapter = async (req, res) => {
  try {
    const { title, intro, order } = req.body;
    const chapter = new Chapter({ title, intro, order });
    await chapter.save();
    res.status(201).json(chapter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllChapters = async (req, res) => {
  try {
    const chapters = await Chapter.find().sort({ order: 1 });
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

