import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Needed to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your JSON file
const serviceAccountPath = path.join(__dirname, "../keys/weenglish-6bb28-firebase-adminsdk-fbsvc-3f1bc882cc.json");

// Read the file manually
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
