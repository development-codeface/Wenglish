import cron from "node-cron";
import User from "../models/user.model.js";
import { sendPushNotification } from "../utils/push.js";

cron.schedule("0 20 * * *", async () => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // get all users who have fcmToken saved
    const users = await User.find({
      fcmToken: { $exists: true, $ne: null }
    });

    for (const user of users) {
      if (!user.lastActive) continue;

      const lastActive = user.lastActive.toISOString().split("T")[0];

      // if the user did NOT open the app today
      if (lastActive !== today) {
        await sendPushNotification(
          user.fcmToken,
          "We miss you! 👋",
          "Come back and continue learning today."
        );

        console.log(`Push sent to inactive user: ${user._id}`);
      }
    }

  } catch (err) {
    console.error("Inactivity cron error:", err);
  }
});
