// middleware/upload.middleware.js
import multer from "multer";
import path from "path";
import fs from "fs";

export const createUploader = (
  folder,
  allowedTypes = ["image/jpeg", "image/png", "image/jpg"]
) => {
  const uploadDir = path.join("uploads", folder);

  // Ensure folder exists
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueName);
    },
  });

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
