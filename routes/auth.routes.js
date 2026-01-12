import express from "express";
import { registerUser, loginUser, refreshLoginToken } from "../controller/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadProfile } from "../middlewares/upload.Instance.js";

const router = express.Router();

router.post("/register",uploadProfile.single("profileImage"), registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: "User authenticated", user: req.user });
});
router.post("/login/refresh", refreshLoginToken);


export default router;
