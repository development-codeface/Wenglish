import express from "express";
import { createSubscriptionPlan, getAllPlans } from "../controller/subscription.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, createSubscriptionPlan);
router.get("/", getAllPlans);

export default router;
