import express from "express";
import {
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getMyPayments
} from "../controller/payment.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.get("/", getAllPayments);
router.get("/me", authMiddleware, getMyPayments);
router.get("/:id", getPaymentById);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

export default router;
