import express from "express"
import Floor from "../models/Floor.js"
import Room from "../models/Room.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

// Get all floors
router.get("/", authenticate, async (req, res, next) => {
  try {
    const floors = await Floor.find().sort({ floorNumber: 1 })
    res.json(floors)
  } catch (error) {
    next(error)
  }
})

// Create floor
router.post("/", authenticate, async (req, res, next) => {
  try {
    const floor = await Floor.create(req.body)
    res.status(201).json(floor)
  } catch (error) {
    next(error)
  }
})

// Update floor
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const floor = await Floor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!floor) {
      return res.status(404).json({ error: "Floor not found" })
    }
    res.json(floor)
  } catch (error) {
    next(error)
  }
})

// Delete floor
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const roomCount = await Room.countDocuments({ floor: req.params.id })
    if (roomCount > 0) {
      return res.status(400).json({ error: "Cannot delete floor with existing rooms" })
    }

    const floor = await Floor.findByIdAndDelete(req.params.id)
    if (!floor) {
      return res.status(404).json({ error: "Floor not found" })
    }
    res.json({ message: "Floor deleted successfully" })
  } catch (error) {
    next(error)
  }
})

export default router
