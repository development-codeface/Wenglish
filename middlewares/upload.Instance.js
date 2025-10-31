import { createUploader } from "./upload.middleware.js";

export const uploadProfile = createUploader("profiles");
export const uploadImages = createUploader("images");

// Allow both images and videos for lessons
export const uploadLessonMedia = createUploader("lessons", [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "video/mp4",
  "video/mkv",
  "video/webm"
]);
