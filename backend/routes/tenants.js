import express from "express";
import Tenant from "../models/Tenant.js";
import Bed from "../models/Bed.js";
import Room from "../models/Room.js";
import Plan from "../models/Plan.js";
import { authenticate } from "../middleware/auth.js";
import { validateTenant } from "../middleware/validator.js";
import { getModel } from "../middleware/dbSelector.js";

const router = express.Router();

// Get all tenants
router.get("/", authenticate, async (req, res, next) => {
  try {
    const TenantModel = getModel(req, Tenant);
    const { status } = req.query;
    const query = status ? { status } : {};
    const tenants = await TenantModel.find(query)
      .populate("plan")
      .populate("bed")
      .populate({ path: "bed", populate: { path: "room floor" } });
    res.json(tenants);
  } catch (error) {
    next(error);
  }
});

// Get single tenant
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const TenantModel = getModel(req, Tenant);
    const tenant = await TenantModel.findById(req.params.id)
      .populate("plan")
      .populate("bed")
      .populate({ path: "bed", populate: { path: "room floor" } });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// Create tenant
router.post("/", authenticate, validateTenant, async (req, res, next) => {
  try {
    const TenantModel = getModel(req, Tenant);
    const BedModel = getModel(req, Bed);
    const RoomModel = getModel(req, Room);
    const PlanModel = getModel(req, Plan);

    const {
      name,
      age,
      profilePhoto,
      aadhaarFront,
      aadhaarBack,
      plan,
      bed,
      clothWashing,
      depositMonths,
      phone,
    } = req.body;

    // Validate ObjectId format
    if (!plan || plan.length !== 24) {
      return res.status(400).json({ error: "Please select a valid plan" });
    }
    if (!bed || bed.length !== 24) {
      return res.status(400).json({ error: "Please select a valid bed" });
    }

    // Check if bed is available
    const bedDoc = await BedModel.findById(bed);
    if (!bedDoc) {
      return res.status(404).json({ error: "Bed not found" });
    }
    if (bedDoc.status === "OCCUPIED") {
      return res.status(400).json({ error: "Bed is already occupied" });
    }

    // Get plan details
    const planDoc = await PlanModel.findById(plan);
    if (!planDoc) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Calculate rent and deposit
    const clothWashingFee = clothWashing ? 500 : 0;
    const monthlyRent = planDoc.price + clothWashingFee;
    const depositAmount = planDoc.price * depositMonths;

    // Create tenant
    const tenant = await TenantModel.create({
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
    });

    // Update bed status
    await BedModel.findByIdAndUpdate(bed, {
      status: "OCCUPIED",
      tenant: tenant._id,
    });

    // Update room occupied beds count
    await RoomModel.findByIdAndUpdate(bedDoc.room, {
      $inc: { occupiedBeds: 1 },
    });

    const populatedTenant = await TenantModel.findById(tenant._id)
      .populate("plan")
      .populate("bed")
      .populate({ path: "bed", populate: { path: "room floor" } });

    res.status(201).json(populatedTenant);
  } catch (error) {
    next(error);
  }
});

// Update tenant
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const TenantModel = getModel(req, Tenant);
    const tenant = await TenantModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("plan")
      .populate("bed")
      .populate({ path: "bed", populate: { path: "room floor" } });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// Delete tenant
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const TenantModel = getModel(req, Tenant);
    const BedModel = getModel(req, Bed);
    const RoomModel = getModel(req, Room);

    const tenant = await TenantModel.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const bed = await BedModel.findById(tenant.bed);
    if (bed) {
      await BedModel.findByIdAndUpdate(tenant.bed, {
        status: "AVAILABLE",
        tenant: null,
      });
      await RoomModel.findByIdAndUpdate(bed.room, {
        $inc: { occupiedBeds: -1 },
      });
    }

    await TenantModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
