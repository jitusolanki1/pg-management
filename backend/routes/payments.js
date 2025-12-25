import express from "express"
import Payment from "../models/Payment.js"
import Tenant from "../models/Tenant.js"
import { authenticate } from "../middleware/auth.js"
import { validatePayment } from "../middleware/validator.js"

const router = express.Router()

// Get all payments
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { status, tenantId } = req.query
    const query = {}
    if (status) query.status = status
    if (tenantId) query.tenant = tenantId

    const payments = await Payment.find(query).populate("tenant").sort({ paymentDate: -1 })
    res.json(payments)
  } catch (error) {
    next(error)
  }
})

// Get paid list
router.get("/paid", authenticate, async (req, res, next) => {
  try {
    const payments = await Payment.find({ status: "PAID" })
      .populate({ path: "tenant", populate: { path: "bed plan" } })
      .sort({ paymentDate: -1 })
    res.json(payments)
  } catch (error) {
    next(error)
  }
})

// Get unpaid list
router.get("/unpaid", authenticate, async (req, res, next) => {
  try {
    const payments = await Payment.find({ status: { $in: ["PENDING", "OVERDUE"] } })
      .populate({ path: "tenant", populate: { path: "bed plan" } })
      .sort({ nextDueDate: 1 })

    // Mark overdue payments
    const now = new Date()
    for (const payment of payments) {
      if (payment.nextDueDate && payment.nextDueDate < now && payment.status === "PENDING") {
        payment.status = "OVERDUE"
        await payment.save()
      }
    }

    res.json(payments)
  } catch (error) {
    next(error)
  }
})

// Create payment
router.post("/", authenticate, validatePayment, async (req, res, next) => {
  try {
    const { tenant, amount, paymentType, paymentFor, paymentDate, remainingDue, nextDueDate, notes } = req.body

    // Verify tenant exists
    const tenantDoc = await Tenant.findById(tenant)
    if (!tenantDoc) {
      return res.status(404).json({ error: "Tenant not found" })
    }

    const paymentData = {
      tenant,
      amount,
      paymentType,
      paymentFor,
      paymentDate,
      notes,
    }

    if (paymentType === "PARTIAL") {
      paymentData.remainingDue = remainingDue
      paymentData.nextDueDate = nextDueDate
      paymentData.status = "PENDING"
    } else {
      paymentData.status = "PAID"
    }

    const payment = await Payment.create(paymentData)
    const populatedPayment = await Payment.findById(payment._id).populate("tenant")

    res.status(201).json(populatedPayment)
  } catch (error) {
    next(error)
  }
})

// Update payment
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("tenant")
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" })
    }
    res.json(payment)
  } catch (error) {
    next(error)
  }
})

// Get payment history for a tenant
router.get("/tenant/:tenantId", authenticate, async (req, res, next) => {
  try {
    const payments = await Payment.find({ tenant: req.params.tenantId }).sort({ paymentDate: -1 })
    res.json(payments)
  } catch (error) {
    next(error)
  }
})

export default router
