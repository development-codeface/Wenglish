import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  checkUserDuration,
  startCall,
  stopCall,
  rechargeUserController,
} from "../controller/dailyLimict.controller.js";

const router = express.Router();

router.get("/call/check", authMiddleware, (req, res) => {
  return checkUserDuration(req.user._id).then(res.json.bind(res));
});

router.post("/call/start", authMiddleware, (req, res) => {
  return startCall(req.user._id).then(res.json.bind(res));
});

router.post("/call/stop", authMiddleware, (req, res) => {
  return stopCall(req.user._id).then(res.json.bind(res));
});

router.post("/call/recharge", authMiddleware, (req, res) => {
  return rechargeUserController(req.user._id, 60).then(res.json.bind(res));
});

export default router;
