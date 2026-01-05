import { createUploader } from "./upload.middleware.js";

export const uploadProfile = createUploader();

export const uploadImages = createUploader();

// Images + Videos
export const uploadLessonMedia = createUploader([
  "image/jpeg",
  "image/png",
  "image/jpg",
  "video/mp4",
  "video/mkv",
  "video/webm",
]);
export const uploadAudio = createUploader([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/mpeg",
]);
