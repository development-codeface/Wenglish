import express from "express";
import { registerUser, loginUser, subscribeUser } from "../controller/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/subscribe",authMiddleware, subscribeUser);
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: "User authenticated", user: req.user });
});

export default router;
