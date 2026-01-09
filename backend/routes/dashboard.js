import express from "express";
import Floor from "../models/Floor.js";
import Room from "../models/Room.js";
import Bed from "../models/Bed.js";
import Tenant from "../models/Tenant.js";
import Payment from "../models/Payment.js";
import { authenticate } from "../middleware/auth.js";
import { getModel } from "../middleware/dbSelector.js";

const router = express.Router();

// Get dashboard statistics
router.get("/stats", authenticate, async (req, res, next) => {
  try {
    const FloorModel = getModel(req, Floor);
    const RoomModel = getModel(req, Room);
    const BedModel = getModel(req, Bed);
    const TenantModel = getModel(req, Tenant);
    const PaymentModel = getModel(req, Payment);

    // Get current month info
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthName = now.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const [
      totalFloors,
      totalRooms,
      totalBeds,
      occupiedBeds,
      activeTenants,
      tenantsList,
      currentMonthPaidPayments,
      totalPaidPayments,
    ] = await Promise.all([
      FloorModel.countDocuments(),
      RoomModel.countDocuments(),
      BedModel.countDocuments(),
      BedModel.countDocuments({ status: "OCCUPIED" }),
      TenantModel.countDocuments({ status: "ACTIVE" }),
      TenantModel.find({ status: "ACTIVE" }).select("monthlyRent"),
      PaymentModel.aggregate([
        { $match: { status: "PAID", paymentDate: { $gte: firstDayOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      PaymentModel.aggregate([
        { $match: { status: "PAID" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    // Calculate expected monthly revenue from all active tenants
    const expectedMonthlyRevenue = tenantsList.reduce(
      (sum, t) => sum + (t.monthlyRent || 0),
      0
    );

    // Current month collection
    const currentMonthRevenue = currentMonthPaidPayments[0]?.total || 0;

    // Pending dues = Expected - Collected this month
    const pendingDues = Math.max(
      0,
      expectedMonthlyRevenue - currentMonthRevenue
    );

    const availableBeds = totalBeds - occupiedBeds;
    const totalRevenue = totalPaidPayments[0]?.total || 0;

    res.json({
      totalFloors,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      activeTenants,
      monthlyRevenue: currentMonthRevenue,
      expectedMonthlyRevenue,
      totalRevenue,
      pendingDues,
      occupancyRate:
        totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0,
      isDevMode: req.isDevMode || false,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
