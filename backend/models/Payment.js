import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["FULL", "PARTIAL"],
      required: true,
    },
    paymentFor: {
      type: String,
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    remainingDue: {
      type: Number,
      default: 0,
    },
    nextDueDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["PAID", "PENDING", "OVERDUE"],
      default: "PAID",
    },
  },
  { timestamps: true },
)

export default mongoose.model("Payment", paymentSchema)
