import express from "express"
import Plan from "../models/Plan.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

// Get all plans
router.get("/", authenticate, async (req, res, next) => {
  try {
    const plans = await Plan.find()
    res.json(plans)
  } catch (error) {
    next(error)
  }
})

// Create plan
router.post("/", authenticate, async (req, res, next) => {
  try {
    const plan = await Plan.create(req.body)
    res.status(201).json(plan)
  } catch (error) {
    next(error)
  }
})

// Initialize default plans
router.post("/init", authenticate, async (req, res, next) => {
  try {
    const existingPlans = await Plan.countDocuments()
    if (existingPlans > 0) {
      return res.status(400).json({ error: "Plans already initialized" })
    }

    const plans = await Plan.insertMany([
      { name: "FULLY_PLAN", price: 7500, description: "Full meal plan with 3 meals per day" },
      { name: "HALF_PLAN", price: 3500, description: "Half meal plan with 2 meals per day" },
    ])

    res.status(201).json(plans)
  } catch (error) {
    next(error)
  }
})

export default router
