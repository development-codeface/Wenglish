import User from "../models/user.model.js";
import { sendPushNotification } from "../utils/push.js";
import FCMToken from "../models/fcmToken.model.js";
import PushNotification from "../models/pushNotification.model.js";


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

export const pushToUser = async (req, res) => {
  try {
    const { userId, title, body } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ message: "userId, title, and body required" });
    }

    const tokens = await FCMToken.find({ user: userId });

    

    if (!tokens || tokens.length === 0) {
      return res.status(404).json({ message: "No FCM token found for this user" });
    }

    const results = [];
    const successOnly = [];

    for (const entry of tokens) {
      const resp = await sendPushNotification(entry.token, title, body);
      
      const status = resp?.success ? "success" : "failed";
      
      results.push({
        token: entry.token,
        status,
        response: resp
      });

      if (status === "success") {
        successOnly.push({
          token: entry.token,
          status,
          response: resp
        });
      }
    }

    // ⭐ Only save if at least one success
    if (successOnly.length > 0) {
      await PushNotification.create({
        user: userId,
        title,
        body,
        sentToAll: false,
        tokensUsed: successOnly
      });
    }

    res.json({
      success: true,
      sentTo: tokens.length,
      results
    });

  } catch (err) {
    console.error("pushToUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const pushToAllUsers = async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "title and body required" });
    }

    const tokens = await FCMToken.find();
    if (!tokens.length) {
      return res.status(404).json({ message: "No FCM tokens found" });
    }

    const results = [];
    const successOnly = [];

    for (const t of tokens) {
      const resp = await sendPushNotification(t.token, title, body);
      const status = resp?.success ? "success" : "failed";

      results.push({
        user: t.user,
        token: t.token,
        status,
        response: resp
      });

      if (status === "success") {
        successOnly.push({
          user: t.user,
          token: t.token,
          status,
          response: resp
        });
      }
    }

    // ⭐ Save only successful push sends
    if (successOnly.length > 0) {
      await PushNotification.create({
        user: null,
        title,
        body,
        sentToAll: true,
        tokensUsed: successOnly
      });
    }

    res.json({
      success: true,
      sentTo: tokens.length,
      message: "Push processed",
      results
    });

  } catch (err) {
    console.error("Push to all error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

