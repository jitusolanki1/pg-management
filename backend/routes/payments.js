import express from "express";
import Payment from "../models/Payment.js";
import Tenant from "../models/Tenant.js";
import { authenticate } from "../middleware/auth.js";
import { validatePayment } from "../middleware/validator.js";
import { getModel } from "../middleware/dbSelector.js";

const router = express.Router();

// Get all payments
router.get("/", authenticate, async (req, res, next) => {
  try {
    const PaymentModel = getModel(req, Payment);
    const { status, tenantId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (tenantId) query.tenant = tenantId;

    const payments = await PaymentModel.find(query)
      .populate("tenant")
      .sort({ paymentDate: -1 });
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// Get paid list
router.get("/paid", authenticate, async (req, res, next) => {
  try {
    const PaymentModel = getModel(req, Payment);
    const payments = await PaymentModel.find({ status: "PAID" })
      .populate({ path: "tenant", populate: { path: "bed plan" } })
      .sort({ paymentDate: -1 });
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// Get unpaid list
router.get("/unpaid", authenticate, async (req, res, next) => {
  try {
    const PaymentModel = getModel(req, Payment);
    const payments = await PaymentModel.find({
      status: { $in: ["PENDING", "OVERDUE"] },
    })
      .populate({ path: "tenant", populate: { path: "bed plan" } })
      .sort({ nextDueDate: 1 });

    // Mark overdue payments
    const now = new Date();
    for (const payment of payments) {
      if (
        payment.nextDueDate &&
        payment.nextDueDate < now &&
        payment.status === "PENDING"
      ) {
        payment.status = "OVERDUE";
        await payment.save();
      }
    }

    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// Create payment
router.post("/", authenticate, validatePayment, async (req, res, next) => {
  try {
    const PaymentModel = getModel(req, Payment);
    const TenantModel = getModel(req, Tenant);

    const {
      tenant,
      amount,
      paymentType = "FULL", // Default to FULL
      paymentFor,
      paymentDate,
      remainingDue = 0,
      nextDueDate,
      notes,
    } = req.body;

    // Verify tenant exists
    const tenantDoc = await TenantModel.findById(tenant).populate("plan");
    if (!tenantDoc) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Calculate if this is a partial payment
    const expectedAmount = tenantDoc.monthlyRent;
    const isPartial = amount < expectedAmount && paymentType === "PARTIAL";
    const calculatedRemaining = isPartial ? expectedAmount - amount : 0;

    const paymentData = {
      tenant,
      amount: Number(amount),
      paymentType: isPartial ? "PARTIAL" : "FULL",
      paymentFor,
      paymentDate: new Date(paymentDate),
      notes: notes || "",
      remainingDue: isPartial ? calculatedRemaining : 0,
      status: isPartial ? "PENDING" : "PAID",
    };

    if (isPartial && nextDueDate) {
      paymentData.nextDueDate = new Date(nextDueDate);
    }

    const payment = await PaymentModel.create(paymentData);
    const populatedPayment = await PaymentModel.findById(payment._id).populate(
      "tenant"
    );

    res.status(201).json(populatedPayment);
  } catch (error) {
    next(error);
  }
});

// Update payment
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const PaymentModel = getModel(req, Payment);
    const payment = await PaymentModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("tenant");
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

// Get payment history for a tenant
router.get("/tenant/:tenantId", authenticate, async (req, res, next) => {
  try {
    const PaymentModel = getModel(req, Payment);
    const payments = await PaymentModel.find({
      tenant: req.params.tenantId,
    }).sort({ paymentDate: -1 });
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

export default router;
