import express from "express";
import { createDiscount, deleteDiscount, getDiscounts, updateDiscount } from "../controller/discount.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, createDiscount);

router.get("/", getDiscounts);
router.delete("/:id",authMiddleware,adminMiddleware, deleteDiscount);
router.put("/:id", authMiddleware, adminMiddleware, updateDiscount);

export default router;
