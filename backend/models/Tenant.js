import mongoose from "mongoose"

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
    },
    profilePhoto: {
      type: String,
      required: true,
    },
    aadhaarFront: {
      type: String,
      required: true,
    },
    aadhaarBack: {
      type: String,
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      required: true,
    },
    clothWashing: {
      type: Boolean,
      default: false,
    },
    monthlyRent: {
      type: Number,
      required: true,
    },
    deposit: {
      amount: { type: Number, required: true },
      months: { type: Number, required: true },
      paidDate: { type: Date, required: true },
    },
    phone: {
      type: String,
      required: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
)

export default mongoose.model("Tenant", tenantSchema)
