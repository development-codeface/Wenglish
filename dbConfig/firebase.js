import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Needed because you're using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to JSON key
const serviceAccountPath = path.join(
  __dirname,
  "../keys/weenglish-6bb28-firebase-adminsdk-fbsvc-b16ad4b7ed.json"
);

// Safety check
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error("Firebase service account key file not found");
}

// Load JSON
const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
