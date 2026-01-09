import express from "express";
import Bed from "../models/Bed.js";
import { authenticate } from "../middleware/auth.js";
import { getModel } from "../middleware/dbSelector.js";

const router = express.Router();

// Get all beds
router.get("/", authenticate, async (req, res, next) => {
  try {
    const BedModel = getModel(req, Bed);
    const { floorId, roomId, status } = req.query;
    const query = {};
    if (floorId) query.floor = floorId;
    if (roomId) query.room = roomId;
    if (status) query.status = status;

    const beds = await BedModel.find(query)
      .populate("room")
      .populate("floor")
      .populate("tenant");
    res.json(beds);
  } catch (error) {
    next(error);
  }
});

// Get single bed
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const BedModel = getModel(req, Bed);
    const bed = await BedModel.findById(req.params.id)
      .populate("room")
      .populate("floor")
      .populate("tenant");
    if (!bed) {
      return res.status(404).json({ error: "Bed not found" });
    }
    res.json(bed);
  } catch (error) {
    next(error);
  }
});

export default router;
