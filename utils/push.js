import admin from "../dbConfig/firebase.js";

export const sendPushNotification = async (token, title, body, data = {}) => {
  try {
    const message = {
      token,
      notification: { title, body },
      data
    };

    const response = await admin.messaging().send(message);
    return { success: true, response };
  } catch (err) {
    console.error("Push Error:", err);
    return { success: false, error: err };
  }
};
