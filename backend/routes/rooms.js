import express from "express"
import Room from "../models/Room.js"
import Floor from "../models/Floor.js"
import Bed from "../models/Bed.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

// Get all rooms
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { floorId } = req.query
    const query = floorId ? { floor: floorId } : {}
    const rooms = await Room.find(query).populate("floor")
    res.json(rooms)
  } catch (error) {
    next(error)
  }
})

// Create room with beds
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { roomNumber, floor, roomType, totalBeds, gridPosition } = req.body

    const room = await Room.create({ roomNumber, floor, roomType, totalBeds, gridPosition })

    // Create beds for this room
    const beds = []
    for (let i = 1; i <= totalBeds; i++) {
      const bed = await Bed.create({
        bedNumber: `${roomNumber}-B${i}`,
        room: room._id,
        floor: floor,
        gridPosition: { x: i - 1, y: 0 },
      })
      beds.push(bed)
    }

    // Update floor total rooms
    await Floor.findByIdAndUpdate(floor, { $inc: { totalRooms: 1 } })

    res.status(201).json({ room, beds })
  } catch (error) {
    next(error)
  }
})

// Update room
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!room) {
      return res.status(404).json({ error: "Room not found" })
    }
    res.json(room)
  } catch (error) {
    next(error)
  }
})

// Delete room
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) {
      return res.status(404).json({ error: "Room not found" })
    }

    const occupiedBeds = await Bed.countDocuments({ room: req.params.id, status: "OCCUPIED" })
    if (occupiedBeds > 0) {
      return res.status(400).json({ error: "Cannot delete room with occupied beds" })
    }

    await Bed.deleteMany({ room: req.params.id })
    await Room.findByIdAndDelete(req.params.id)
    await Floor.findByIdAndUpdate(room.floor, { $inc: { totalRooms: -1 } })

    res.json({ message: "Room deleted successfully" })
  } catch (error) {
    next(error)
  }
})

export default router
