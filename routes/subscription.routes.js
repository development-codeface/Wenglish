import express from "express";
import { createSubscriptionPlan, deleteSubscriptionPlan, getAllPlans, updateSubscriptionPlan, getPlanById} from "../controller/subscription.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/auth.middleware.js";
import { uploadImages } from "../middlewares/upload.Instance.js";

const router = express.Router();

router.post("/", authMiddleware, adminMiddleware,uploadImages.single("imageUrl"), createSubscriptionPlan);
router.get("/", authMiddleware,getAllPlans);
router.get("/:id", authMiddleware,getPlanById);
router.put("/:id", authMiddleware, adminMiddleware, updateSubscriptionPlan);
router.delete("/:id", authMiddleware, adminMiddleware, deleteSubscriptionPlan);

export default router;
