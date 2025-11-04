import Chapter from "../models/chapter.model.js";
import Lesson from "../models/lessons.model.js";

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
    const userLang =
      req.query.lang ||
      req.headers["accept-language"]?.split(",")[0]?.slice(0, 2) ||
      "en";

    const chapters = await Chapter.find().sort({ order: 1 });

    const localizedChapters = chapters.map((chapter) => ({
      _id: chapter._id,
      order: chapter.order,
      title: chapter.title[userLang] || chapter.title.en,
      intro: chapter.intro[userLang] || chapter.intro.en,
    }));

    res.status(200).json({
      message: `Chapters in ${userLang}`,
      chapters: localizedChapters,
      status:true,
    });
  } catch (err) {
    console.error("Error fetching chapters:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getAllChaptersWithLessons = async (req, res) => {
  try {
    // Determine user language (priority: ?lang > Accept-Language header > en)
    const userLang =
      req.query.lang ||
      req.headers["accept-language"]?.split(",")[0]?.slice(0, 2) ||
      "en";

    // Fetch chapters and lessons
    const chapters = await Chapter.find().sort({ order: 1 }).lean();
    const lessons = await Lesson.find().sort({ order: 1 }).lean();

    // Group lessons by chapterId
    const lessonsByChapter = lessons.reduce((acc, lesson) => {
      const chapId = lesson.chapterId.toString();
      if (!acc[chapId]) acc[chapId] = [];
      acc[chapId].push({
        _id: lesson._id,
        order: lesson.order,
        title: lesson.title[userLang] || lesson.title.en,
        description: lesson.description[userLang] || lesson.description.en,
        videoUrl: lesson.videoUrl,
        thumbnail: lesson.thumbnail,
        question: lesson.question[userLang] || lesson.question.en,
        options: lesson.options.map((opt) => opt[userLang] || opt.en),
        correctAnswer: lesson.correctAnswer[userLang] || lesson.correctAnswer.en,
      });
      return acc;
    }, {});

    // Combine chapters with their localized lessons
    const data = chapters.map((chapter) => ({
      _id: chapter._id,
      order: chapter.order,
      title: chapter.title[userLang] || chapter.title.en,
      intro: chapter.intro[userLang] || chapter.intro.en,
      lessons: lessonsByChapter[chapter._id.toString()] || [],
    }));

    res.status(200).json({
      status: true,
      message: `Chapters and lessons in ${userLang}`,
      chapters: data,
    });
  } catch (err) {
    console.error("Error fetching chapters with lessons:", err);
    res.status(500).json({ status: false, message: err.message });
  }
};


