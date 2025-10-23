import express from "express";
import { createSubscriptionPlan, deleteSubscriptionPlan, getAllPlans, updateSubscriptionPlan } from "../controller/subscription.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, createSubscriptionPlan);
router.get("/", getAllPlans);
router.put("/:id", authMiddleware, adminMiddleware, updateSubscriptionPlan);
router.delete("/:id", authMiddleware, adminMiddleware, deleteSubscriptionPlan);

export default router;
