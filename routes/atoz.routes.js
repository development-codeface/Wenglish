import express from "express";
import { getAtoZResponse } from "../controller/atoz.controller.js";

const router = express.Router();

// POST /api/atoz
router.post("/", getAtoZResponse);

export default router;
