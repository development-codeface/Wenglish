import cron from "node-cron";
import User from "../models/user.model.js";
import FCMToken from "../models/fcmToken.model.js";
import { sendPushNotification } from "../utils/push.js";

// Runs every day at 9 PM IST
cron.schedule(
  "0 21 * * *",
  async () => {
    try {
      const users = await User.find();
      const now = Date.now();

      const successUsers = new Set();
      const failedUsers = new Set();

      for (const user of users) {
        if (!user.lastActive) continue;

        const lastActiveTime = new Date(user.lastActive).getTime();
        const diffMinutes = (now - lastActiveTime) / 1000 / 60;

        // If user was active within last 24 hours, skip
        if (diffMinutes < 24 * 60) continue;

        const tokens = await FCMToken.find({ user: user._id });
        if (!tokens.length) {
          failedUsers.add(user.email);
          continue;
        }

        let delivered = false;

        for (const t of tokens) {
          const result = await sendPushNotification(
            t.token,
            "We miss you! 👋",
            "Come back and keep learning today."
          );

          if (result.success) {
            delivered = true;
            break;
          }
        }

        if (delivered) successUsers.add(user.email);
        else failedUsers.add(user.email);
      }

      // No logs — silent operation in production
      // But you still have successUsers and failedUsers if needed internally

    } catch (err) {
      console.error("Inactivity cron error:", err.message);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata", // IST timezone
  }
);
