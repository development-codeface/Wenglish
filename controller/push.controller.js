import User from "../models/user.model.js";
import { sendPushNotification } from "../utils/push.js";


export const saveDeviceToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token required" });
    }

    const user = await User.findById(req.user._id);
    user.fcmToken = fcmToken;
    await user.save();

    res.json({ success: true, message: "Token saved" });
  } catch (err) {
    console.error("Save token error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const testInactivityPush = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.fcmToken) {
      return res.status(400).json({ message: "User does not have fcmToken" });
    }

    // Fake inactivity by setting lastActive to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    user.lastActive = yesterday;
    await user.save();

    // Now manually run push logic
    const result = await sendPushNotification(
      user.fcmToken,
      "Inactivity Test",
      "This is a test notification for inactivity."
    );

    res.json({
      message: "Inactivity push test sent",
      firebaseResponse: result
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



export const testPush = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.fcmToken) {
      return res.status(400).json({ message: "User has no FCM token" });
    }

    const result = await sendPushNotification(
      user.fcmToken,
      "Test Push",
      "Your push notification works 🎉"
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};