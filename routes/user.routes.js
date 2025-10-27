import express from "express";
import { subscribeUser, deleteUser, getAllUsers, getUserById, updateUser } from "../controller/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/subscribe",authMiddleware, subscribeUser);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, deleteUser);
router.get("/:id", authMiddleware, getUserById);
router.get("/", getAllUsers);


export default router;
