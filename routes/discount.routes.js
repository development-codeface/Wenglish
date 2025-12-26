import express from "express";
import { createDiscount, deleteDiscount, getDiscounts, updateDiscount,getDiscountById,getDiscountsAllLang } from "../controller/discount.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/auth.middleware.js";
import { uploadImages } from "../middlewares/upload.Instance.js";

const router = express.Router();

router.post("/", authMiddleware, adminMiddleware,uploadImages.single('image'), createDiscount);
router.get("/all", authMiddleware, getDiscountsAllLang);
router.get("/",authMiddleware,getDiscounts);
router.get("/:id", authMiddleware, getDiscountById);
router.delete("/:id",authMiddleware,adminMiddleware, deleteDiscount);
router.put("/:id", authMiddleware, adminMiddleware,uploadImages.single('image'), updateDiscount);

export default router;
