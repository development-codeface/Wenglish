// controllers/pushMessage.controller.js
import PushMessage from "../models/pushMessage.model.js";

export const EMPTY_TRANSLATIONS = {
  en: "",
  ml: "",
  hi: "",
  ta: "",
  te: "",
  kn: ""
};

export const formatPushMessage = (msg, nativeLang = "en") => {
  if (!msg) return null;

  const title = msg.title?.[nativeLang] || msg.title?.en || "";
  const body = msg.body?.[nativeLang] || msg.body?.en || "";

  return {
    _id: msg._id,
    type: msg.type,
    title,
    body,
    fullTitle: msg.title || { ...EMPTY_TRANSLATIONS },
    fullBody: msg.body || { ...EMPTY_TRANSLATIONS },
    imageUrl: msg.imageUrl || "",
    isActive: msg.isActive,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt
  };
};

// CREATE
export const createPushMessage = async (req, res) => {
  try {
    let title = { ...EMPTY_TRANSLATIONS };
    let body = { ...EMPTY_TRANSLATIONS };

    try {
      if (req.body.title) title = JSON.parse(req.body.title);
    } catch {}

    try {
      if (req.body.body) body = JSON.parse(req.body.body);
    } catch {}

    const imageUrl = req.file ? "/uploads/images/" + req.file.filename : "";

    const payload = {
      type: req.body.type || "inactivity",
      title: { ...EMPTY_TRANSLATIONS, ...title },
      body: { ...EMPTY_TRANSLATIONS, ...body },
      imageUrl,
      isActive: req.body.isActive === "true" || req.body.isActive === true
    };

    const created = await PushMessage.create(payload);

    return res.status(201).json({
      message: "Created",
      data: formatPushMessage(created, req.user?.nativeLanguage)
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET ALL (localized)
export const getAllPushMessages = async (req, res) => {
  try {
    const lang = req.user?.nativeLanguage || "en";
    const messages = await PushMessage.find().sort("-createdAt");

    return res.status(200).json({
      messages: messages.map((m) => formatPushMessage(m, lang))
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET ALL (full multilingual)
export const getAllMultilingualMessages = async (req, res) => {
  try {
    const messages = await PushMessage.find().sort("-createdAt");

    return res.status(200).json({
      messages: messages.map((m) => ({
        _id: m._id,
        type: m.type,
        fullTitle: m.title || { ...EMPTY_TRANSLATIONS },
        fullBody: m.body || { ...EMPTY_TRANSLATIONS },
        imageUrl: m.imageUrl || "",
        isActive: m.isActive,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt
      }))
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// UPDATE
export const updatePushMessage = async (req, res) => {
  try {
    const updateData = {};

    try {
      if (req.body.title) {
        updateData.title = {
          ...EMPTY_TRANSLATIONS,
          ...JSON.parse(req.body.title)
        };
      }
    } catch {
      updateData.title = { ...EMPTY_TRANSLATIONS };
    }

    try {
      if (req.body.body) {
        updateData.body = {
          ...EMPTY_TRANSLATIONS,
          ...JSON.parse(req.body.body)
        };
      }
    } catch {
      updateData.body = { ...EMPTY_TRANSLATIONS };
    }

    if (req.body.isActive !== undefined) {
      updateData.isActive = req.body.isActive === "true" || req.body.isActive === true;
    }

    if (req.file) {
      updateData.imageUrl = "/uploads/images/" + req.file.filename;
    }

    const updated = await PushMessage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    return res.status(200).json({
      message: "Updated",
      data: formatPushMessage(updated, req.user?.nativeLanguage)
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// DELETE
export const deletePushMessage = async (req, res) => {
  try {
    await PushMessage.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
