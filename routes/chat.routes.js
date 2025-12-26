import {getChatHistoryBySession} from '../controller/chat.controller.js';
import express from "express";
import { authMiddleware } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.get("/session",authMiddleware, getChatHistoryBySession);

export default router;
