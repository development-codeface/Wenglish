import multer from "multer";

export const createUploader = (
  allowedTypes = ["image/jpeg", "image/png", "image/jpg"]
) => {
  const storage = multer.memoryStorage(); // 🔑 key change

  const fileFilter = (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"), false);
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 1024 * 1024 * 1024, // 1 GB
    },
  });
};
