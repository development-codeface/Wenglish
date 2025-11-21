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
    let { userIds, title, body } = req.body;

  
    if (req.body["userIds[]"]) {
      userIds = req.body["userIds[]"];
    }

    // Convert single string → array
    if (typeof userIds === "string") {
      userIds = [userIds];
    }

    // Multer may convert it to undefined
    if (!Array.isArray(userIds)) {
      userIds = [];
    }

    if (userIds.length === 0) {
      return res.status(400).json({ message: "userIds must be a non-empty array" });
    }


    if (!title || !body) {
      return res.status(400).json({ message: "title and body are required" });
    }


    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;  // folder matches upload.Instance.js config
    }

    const finalResults = [];
    const successfulPushes = [];


    for (const userId of userIds) {
      const tokens = await FCMToken.find({ user: userId });

      if (!tokens.length) {
        finalResults.push({
          userId,
          message: "No FCM tokens for user",
          results: []
        });
        continue;
      }

      const perUserResults = [];
      const perUserSuccess = [];

      for (const t of tokens) {
        const resp = await sendPushNotification(
          t.token,
          title,
          body,
          imageUrl ? { imageUrl } : {}
        );

        const status = resp?.success ? "success" : "failed";

        const entry = {
          token: t.token,
          status,
          response: resp
        };

        perUserResults.push(entry);
        if (status === "success") perUserSuccess.push(entry);
      }

      // Save only if at least one success for this user
      if (perUserSuccess.length > 0) {
        successfulPushes.push({
          user: userId,
          title,
          body,
          imageUrl,
          tokensUsed: perUserSuccess,
          sentToAll: false
        });
      }

      finalResults.push({
        userId,
        message: "completed",
        results: perUserResults
      });
    }


    if (successfulPushes.length > 0) {
      await PushNotification.insertMany(successfulPushes);
    }

    return res.json({
      success: true,
      totalUsersProcessed: userIds.length,
      savedRecords: successfulPushes.length,
      finalResults
    });

  } catch (err) {
    console.error("pushToUsers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};




export const pushToAllUsers = async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "title and body required" });
    }

    const imageUrl = req.file ? `uploads/images/${req.file.filename}` : null;

    const tokens = await FCMToken.find();
    if (!tokens.length) {
      return res.status(404).json({ message: "No FCM tokens found" });
    }

    const results = [];
    const successOnly = [];

    for (const t of tokens) {
      const resp = await sendPushNotification(
        t.token,
        title,
        body,
        imageUrl ? { imageUrl } : {}
      );

      const status = resp?.success ? "success" : "failed";

      const entry = { user: t.user, token: t.token, status, response: resp };

      results.push(entry);
      if (status === "success") successOnly.push(entry);
    }

    if (successOnly.length > 0) {
      await PushNotification.create({
        user: null,
        title,
        body,
        imageUrl,
        sentToAll: true,
        tokensUsed: successOnly
      });
    }

    return res.json({
      success: true,
      sentTo: tokens.length,
      saved: successOnly.length > 0,
      results,
    });

  } catch (err) {
    console.error("Push to all error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};




