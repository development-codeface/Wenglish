import express from "express";
import {
  getAllPushNotifications,
  getAdminUserNotificationHistory,
  getPushNotificationsByUser
} from "../controller/pushNotifiction.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admins only" });
  next();
};

// Admin Routes
router.get("/all", authMiddleware, getAllPushNotifications);
router.get("/user/:userId", authMiddleware, getAdminUserNotificationHistory);

// User Route
router.get("/me", authMiddleware, getPushNotificationsByUser);

export default router;
