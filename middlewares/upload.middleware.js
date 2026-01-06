import multer from "multer";

export const createUploader = (
  allowedTypes = ["image/jpeg", "image/png", "image/jpg"]
) => {
  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    // ✅ Case 1: allowedTypes is a function (e.g. audio/*)
    if (typeof allowedTypes === "function") {
      if (!allowedTypes(file)) {
        return cb(new Error("Invalid file type"), false);
      }
      return cb(null, true);
    }

    // ✅ Case 2: allowedTypes is an array
    if (Array.isArray(allowedTypes)) {
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Invalid file type"), false);
      }
      return cb(null, true);
    }

    // ✅ Case 3: no filter → allow all
    return cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB (safe for audio)
    },
  });
};
