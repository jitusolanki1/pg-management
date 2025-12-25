import express from "express"
import Floor from "../models/Floor.js"
import Room from "../models/Room.js"
import Bed from "../models/Bed.js"
import Tenant from "../models/Tenant.js"
import Payment from "../models/Payment.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

// Get dashboard statistics
router.get("/stats", authenticate, async (req, res, next) => {
  try {
    const [totalFloors, totalRooms, totalBeds, occupiedBeds, activeTenants, totalPayments, pendingPayments] =
      await Promise.all([
        Floor.countDocuments(),
        Room.countDocuments(),
        Bed.countDocuments(),
        Bed.countDocuments({ status: "OCCUPIED" }),
        Tenant.countDocuments({ status: "ACTIVE" }),
        Payment.aggregate([{ $match: { status: "PAID" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
        Payment.aggregate([
          { $match: { status: { $in: ["PENDING", "OVERDUE"] } } },
          { $group: { _id: null, total: { $sum: "$remainingDue" } } },
        ]),
      ])

    const availableBeds = totalBeds - occupiedBeds
    const monthlyRevenue = totalPayments[0]?.total || 0
    const pendingDues = pendingPayments[0]?.total || 0

    // Get current month revenue
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthPayments = await Payment.aggregate([
      { $match: { status: "PAID", paymentDate: { $gte: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    const currentMonthRevenue = currentMonthPayments[0]?.total || 0

    res.json({
      totalFloors,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      activeTenants,
      monthlyRevenue: currentMonthRevenue,
      totalRevenue: monthlyRevenue,
      pendingDues,
      occupancyRate: totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(2) : 0,
    })
  } catch (error) {
    next(error)
  }
})

export default router
