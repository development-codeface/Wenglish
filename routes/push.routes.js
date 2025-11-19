import express from "express";
import { saveDeviceToken, testPush, testInactivityPush } from "../controller/push.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";     

const router = express.Router();

router.post("/save-token", authMiddleware, saveDeviceToken);
router.get("/test", authMiddleware, testPush);
router.get("/test-inactivity", authMiddleware, testInactivityPush);


export default router;