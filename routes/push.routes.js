import express from "express";
import { saveDeviceToken, testPush, testInactivityPush, pushToAllUsers, pushToUser } from "../controller/push.controller.js";
import { adminMiddleware, authMiddleware } from "../middlewares/auth.middleware.js";     
import { uploadImages } from "../middlewares/upload.Instance.js";

const router = express.Router();

router.post("/save-token", authMiddleware, saveDeviceToken);
router.get("/test", authMiddleware, testPush);
router.get("/test-inactivity", authMiddleware, testInactivityPush);
router.post(
  "/push-to-user",
  authMiddleware,
  adminMiddleware,
  uploadImages.single("imageUrl"),
  pushToUser
);

router.post(
  "/push-to-all",
  authMiddleware,
  adminMiddleware,
  uploadImages.single("imageUrl"),
  pushToAllUsers
);

export default router;