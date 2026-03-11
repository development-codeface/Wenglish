import express from "express";
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} from "../controller/rechargePlans.controller.js";

const router = express.Router();

// Get all active plans
router.get("/", getPlans);

// Get a single plan
router.get("/:id", getPlanById);

// Create a new plan
router.post("/", createPlan);

// Update a plan
router.put("/:id", updatePlan);

// Delete / deactivate a plan
router.delete("/:id", deletePlan);

export default router;
