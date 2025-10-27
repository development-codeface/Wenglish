import express from "express";
import { verifyEmailOTP , resendOtp} from "../controller/otp.controller.js";

const router = express.Router();

router.post("/verify-otp", verifyEmailOTP);
router.post("/resend-otp", resendOtp);

export default router;
