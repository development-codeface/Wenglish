import express from "express";
import { getUserPerformanceSummary,getPerformanceByModule } from "../controller/userPerfomance.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/summary", authMiddleware, getUserPerformanceSummary);
router.get("/module/:moduleType", authMiddleware, getPerformanceByModule);

export default router;
