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
  "audio/mpeg",    // .mp3
  "audio/wav",     // .wav
  "audio/x-wav",   // .wav
  "audio/ogg",     // .ogg
  "audio/webm",    // .webm
  "audio/opus",    // .opus
  "audio/mp4",     // .m4a, .mp4
  "audio/x-m4a",   // .m4a
  "audio/m4a",     // .m4a
  "audio/aac",     // .aac
  "audio/x-aac",   // .aac
  "application/octet-stream" // mobile fallback
]);


