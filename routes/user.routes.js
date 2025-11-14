import express from "express";
import { completePaymentAndSubscribe, deleteUser, getAllUsers, getUserById, updateUser, completeOnboarding,getAllUsersWithOnboardingAnswers,resetPassword,sendForgotPasswordOTP,verifyForgotPasswordOTP } from "../controller/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadProfile } from "../middlewares/upload.Instance.js";

const router = express.Router();

router.post("/subscribe",authMiddleware, completePaymentAndSubscribe);
router.get("/with-onboarding-answers", authMiddleware, getAllUsersWithOnboardingAnswers);
router.put("/:id", authMiddleware,uploadProfile.single("profileImage"), updateUser);
router.delete("/:id", authMiddleware, deleteUser);
router.get("/:id", authMiddleware, getUserById);
router.get("/", getAllUsers);
router.post("/complete-onboarding", authMiddleware, completeOnboarding);
router.post("/forgot-password/send-otp", sendForgotPasswordOTP);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOTP);
router.post("/reset-password", resetPassword);  


export default router;
