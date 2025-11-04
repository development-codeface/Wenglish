import express from "express";
import { subscribeUser, deleteUser, getAllUsers, getUserById, updateUser, completeOnboarding } from "../controller/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadProfile } from "../middlewares/upload.Instance.js";

const router = express.Router();

router.post("/subscribe",authMiddleware, subscribeUser);
router.put("/:id", authMiddleware,uploadProfile.single("profileImage"), updateUser);
router.delete("/:id", authMiddleware, deleteUser);
router.get("/:id", authMiddleware, getUserById);
router.get("/", getAllUsers);
router.post("/complete-onboarding", authMiddleware, completeOnboarding);


export default router;
