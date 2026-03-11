import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  checkUserDuration,
  startCall,
  stopCall,
  rechargeUser,
  getRechargeHistory,
} from "../controller/dailyLimict.controller.js";

const router = express.Router();

// Check user's remaining call duration
router.get("/call/check", authMiddleware, checkUserDuration);

// Start a call session
router.post("/call/start", authMiddleware, startCall);

// Stop the active call session
router.post("/call/stop", authMiddleware, stopCall);

// User recharge their own account
router.post("/call/recharge", authMiddleware, rechargeUser);

// History recharge
router.get("/call/history", authMiddleware,getRechargeHistory)

export default router;