import PushNotification from "../models/pushNotification.model.js";
import User from "../models/user.model.js";

export const getAllPushNotifications = async (req, res) => {
  try {
    const notifications = await PushNotification.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPushNotificationsByUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await PushNotification.find({
      $or: [
        { sentToAll: true },
        { user: userId }
      ]
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notifications.length,
      notifications
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAdminUserNotificationHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await PushNotification.find({
      user: userId
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notifications.length,
      notifications
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

