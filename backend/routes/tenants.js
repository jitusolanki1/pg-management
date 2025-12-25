import express from "express"
import Tenant from "../models/Tenant.js"
import Bed from "../models/Bed.js"
import Room from "../models/Room.js"
import Plan from "../models/Plan.js"
import { authenticate } from "../middleware/auth.js"
import { validateTenant } from "../middleware/validator.js"

const router = express.Router()

// Get all tenants
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { status } = req.query
    const query = status ? { status } : {}
    const tenants = await Tenant.find(query)
      .populate("plan")
      .populate("bed")
      .populate({ path: "bed", populate: { path: "room floor" } })
    res.json(tenants)
  } catch (error) {
    next(error)
  }
})

// Get single tenant
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate("plan")
      .populate("bed")
      .populate({ path: "bed", populate: { path: "room floor" } })
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" })
    }
    res.json(tenant)
  } catch (error) {
    next(error)
  }
})

// Create tenant
router.post("/", authenticate, validateTenant, async (req, res, next) => {
  try {
    const { name, age, profilePhoto, aadhaarFront, aadhaarBack, plan, bed, clothWashing, depositMonths, phone } =
      req.body

    // Check if bed is available
    const bedDoc = await Bed.findById(bed)
    if (!bedDoc) {
      return res.status(404).json({ error: "Bed not found" })
    }
    if (bedDoc.status === "OCCUPIED") {
      return res.status(400).json({ error: "Bed is already occupied" })
    }

    // Get plan details
    const planDoc = await Plan.findById(plan)
    if (!planDoc) {
      return res.status(404).json({ error: "Plan not found" })
    }

    // Calculate rent and deposit
    const clothWashingFee = clothWashing ? 500 : 0
    const monthlyRent = planDoc.price + clothWashingFee
    const depositAmount = planDoc.price * depositMonths

    // Create tenant
    const tenant = await Tenant.create({
      name,
      age,
      profilePhoto,
      aadhaarFront,
      aadhaarBack,
      plan,
      bed,
      clothWashing,
      monthlyRent,
      phone,
      deposit: {
        amount: depositAmount,
        months: depositMonths,
        paidDate: new Date(),
      },
    })

    // Update bed status
    await Bed.findByIdAndUpdate(bed, { status: "OCCUPIED", tenant: tenant._id })

    // Update room occupied beds count
    await Room.findByIdAndUpdate(bedDoc.room, { $inc: { occupiedBeds: 1 } })

    const populatedTenant = await Tenant.findById(tenant._id)
      .populate("plan")
      .populate("bed")
      .populate({ path: "bed", populate: { path: "room floor" } })

    res.status(201).json(populatedTenant)
  } catch (error) {
    next(error)
  }
})

// Update tenant
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("plan")
      .populate("bed")
      .populate({ path: "bed", populate: { path: "room floor" } })
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" })
    }
    res.json(tenant)
  } catch (error) {
    next(error)
  }
})

// Delete tenant
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" })
    }

    const bed = await Bed.findById(tenant.bed)
    if (bed) {
      await Bed.findByIdAndUpdate(tenant.bed, { status: "AVAILABLE", tenant: null })
      await Room.findByIdAndUpdate(bed.room, { $inc: { occupiedBeds: -1 } })
    }

    await Tenant.findByIdAndDelete(req.params.id)
    res.json({ message: "Tenant deleted successfully" })
  } catch (error) {
    next(error)
  }
})

export default router
