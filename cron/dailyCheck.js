// cron/inactivityCron.js
import cron from "node-cron";
import User from "../models/user.model.js";
import FCMToken from "../models/fcmToken.model.js";
import PushMessage from "../models/pushMessage.model.js";
import { sendPushNotification } from "../utils/push.js";

// Helper to pick localized text
const getLocalized = (translations, lang) => {
  if (!translations) return "";
  return translations[lang] || translations["en"] || "";
};

// Runs every day at 9 PM IST
cron.schedule(
  "0 21 * * *",
  async () => {
    try {
      const now = Date.now();
      const users = await User.find();

      // Fetch one random active message
      const randomMessage = await PushMessage.aggregate([
        { $match: { isActive: true, type: "inactivity" } },
        { $sample: { size: 1 } }
      ]);

      const fallbackMsg = {
        title: { en: "We miss you! 👋" },
        body: { en: "Come back and keep learning today." }
      };

      const dbMsg = randomMessage[0] || fallbackMsg;

      const successUsers = new Set();
      const failedUsers = new Set();

      for (const user of users) {
        if (!user.lastActive) continue;

        const lastActiveTime = new Date(user.lastActive).getTime();
        const diffMinutes = (now - lastActiveTime) / 1000 / 60;

        if (diffMinutes < 24 * 60) continue;

        const userLang = user.nativeLanguage || "en";

        // Pick correct language version of title/body
        const title = getLocalized(dbMsg.title, userLang);
        const body = getLocalized(dbMsg.body, userLang);

        const tokens = await FCMToken.find({ user: user._id });
        if (!tokens.length) {
          failedUsers.add(user.email);
          continue;
        }

        let delivered = false;

        for (const t of tokens) {
          try {
            const result = await sendPushNotification(
              t.token,
              title,
              body,
              dbMsg.imageUrl // optional if your FCM supports image
            );

            if (result?.success) {
              delivered = true;
              break;
            }
          } catch {}
        }

        if (delivered) successUsers.add(user.email);
        else failedUsers.add(user.email);
      }

    } catch (err) {
      console.error("Inactivity cron error:", err.message);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);
