import express from "express";
import { getUserPerformanceSummary } from "../controller/userPerfomance.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/summary", authMiddleware, getUserPerformanceSummary);

export default router;
