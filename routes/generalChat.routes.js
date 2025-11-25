import express from "express";
import { generalChat,getGeneralChatHistory,getGeneralChatHistoryById, resetGeneralChat } from "../controller/generalChat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/chat", authMiddleware, generalChat);
router.get("/history", authMiddleware, getGeneralChatHistory);
router.get("/history/:id", authMiddleware, getGeneralChatHistoryById);
router.delete("/reset", authMiddleware, resetGeneralChat);

export default router;
