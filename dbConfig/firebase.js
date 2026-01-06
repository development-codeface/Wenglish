import admin from "firebase-admin";

// 1. Function to decode the Base64 ENV variable safely
const getFirebaseCredentials = () => {
  try {
    const base64Str = process.env.FIREBASE_CREDENTIALS;
    
    if (!base64Str) {
      throw new Error("FIREBASE_CREDENTIALS environment variable is missing!");
    }

    // Decodes the string back into JSON
    const decodedJson = Buffer.from(base64Str, "base64").toString("utf8");
    return JSON.parse(decodedJson);
  } catch (error) {
    console.error("Firebase Admin Init Error:", error.message);
    // If it fails, the app will crash here with a clear message
    throw error;
  }
};

// 2. Initialize using the decoded object
admin.initializeApp({
  credential: admin.credential.cert(getFirebaseCredentials()),
});

export default admin;