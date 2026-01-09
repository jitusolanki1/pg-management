import express from "express";
import Plan from "../models/Plan.js";
import { authenticate } from "../middleware/auth.js";
import { getModel } from "../middleware/dbSelector.js";

const router = express.Router();

// Get all plans
router.get("/", authenticate, async (req, res, next) => {
  try {
    const PlanModel = getModel(req, Plan);
    const plans = await PlanModel.find();
    res.json(plans);
  } catch (error) {
    next(error);
  }
});

// Create plan
router.post("/", authenticate, async (req, res, next) => {
  try {
    const PlanModel = getModel(req, Plan);
    const plan = await PlanModel.create(req.body);
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
});

// Initialize default plans
router.post("/init", authenticate, async (req, res, next) => {
  try {
    const PlanModel = getModel(req, Plan);
    const existingPlans = await PlanModel.countDocuments();
    if (existingPlans > 0) {
      return res.status(400).json({ error: "Plans already initialized" });
    }

    const plans = await PlanModel.insertMany([
      {
        name: "FULLY_PLAN",
        price: 7500,
        description: "Full meal plan with 3 meals per day",
      },
      {
        name: "HALF_PLAN",
        price: 3500,
        description: "Half meal plan with 2 meals per day",
      },
    ]);

    res.status(201).json(plans);
  } catch (error) {
    next(error);
  }
});

// Update plan
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const PlanModel = getModel(req, Plan);
    const plan = await PlanModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

// Delete plan
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const PlanModel = getModel(req, Plan);
    const plan = await PlanModel.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
